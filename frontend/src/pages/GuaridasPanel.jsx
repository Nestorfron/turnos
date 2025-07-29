import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData, putData, deleteData, postData } from "../utils/api.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import LicenciaModal from "../components/LicenciaModal.jsx";
import EliminarGuardiasModal from "../components/EliminarGuardiasModal.jsx";
import Loading from "../components/Loading";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.locale("es");

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const GuardiasPanel = () => {
  const { usuario } = useAppContext();

  const location = useLocation();
  const navigate = useNavigate();
  const dependencia = location.state?.sec;

  const [selectorTipo, setSelectorTipo] = useState(null);

  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [turnos, setTurnos] = useState([]);

  const [modalEliminar, setModalEliminar] = useState(null);

  const [modalData, setModalData] = useState(null);
  const [daysToShow, setDaysToShow] = useState(14);

  const [startDate, setStartDate] = useState(dayjs().startOf("day"));
  const dias = Array.from({ length: daysToShow }, (_, i) =>
    startDate.add(i, "day")
  );

  const exportarPDF = () => {
    const contenedor = document.getElementById("contenedor-tablas");

    if (!contenedor) return;

    html2canvas(contenedor, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight < pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let y = 0;

        while (heightLeft > 0) {
          pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          if (heightLeft > 0) {
            pdf.addPage();
            y -= pageHeight;
          }
        }
      }

      pdf.save("guardias_completo.pdf");
    });
  };

  useEffect(() => {
    if (!usuario.token) {
      navigate("/");
    };
    
    if (!dependencia?.id) return;

    const cargarDatos = async () => {
      try {
        // Cargo usuarios y filtro
        const usuarios = await fetchData("usuarios", usuario.token);
        const filtrados = usuarios.filter(
          (u) =>
            u.dependencia_id === dependencia.id &&
            u.rol_jerarquico !== "JEFE_DEPENDENCIA"
        );
        setFuncionarios(filtrados);

        // Cargo guardias y filtro
        const todasGuardias = await fetchData("guardias", usuario.token);
        const guardiasFiltradas = todasGuardias.filter((g) =>
          filtrados.some((f) => f.id === g.usuario_id)
        );

        // Cargo licencias y filtro
        const todasLicencias = await fetchData("licencias", usuario.token);
        const licenciasFiltradas = todasLicencias
          .filter((l) => filtrados.some((f) => f.id === l.usuario_id))
          .map((l) => ({ ...l, tipo: "licencia" }));

        setGuardias([...guardiasFiltradas, ...licenciasFiltradas]);

        // Cargo turnos y ordeno
        const turnosData = await fetchData(
          `turnos?dependencia_id=${dependencia.id}`,
          usuario.token
        );
        const ordenDeseado = [
          "primer turno",
          "brou",
          "segundo turno",
          "tercer turno",
          "destacados",
        ];
        const turnosOrdenados = [...turnosData].sort((a, b) => {
          const nombreA = a.nombre.trim().toLowerCase();
          const nombreB = b.nombre.trim().toLowerCase();
          const ia = ordenDeseado.indexOf(nombreA);
          const ib = ordenDeseado.indexOf(nombreB);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        setTurnos(turnosOrdenados);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    cargarDatos();
  }, [dependencia, usuario.token]);

  useEffect(() => {
    if (usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA") {
      setDaysToShow(14);
    }
  }, [usuario]);

  const getCelda = (usuario, dia) => {
    const fecha = dia.format("YYYY-MM-DD");

    const registro = guardias.find((g) => {
      if (g.usuario_id !== usuario.id) return false;

      const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");

      return fecha >= inicio && fecha <= fin;
    });

    if (registro) {
      if (registro.tipo === "licencia") return "L";
      if (registro.tipo === "guardia") return "T";
      return registro.tipo;
    }

    return "D";
  };

  const actualizarCelda = async (usuario, dia, nuevoTipo, token) => {
    if (!token) {
      return;
    }

    const fechaStr = dia.format("YYYY-MM-DD");

    const existente = guardias.find((g) => {
      if (g.usuario_id !== usuario.id) return false;
      const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
      return fechaStr >= inicio && fechaStr <= fin;
    });

    if (existente) {
      const endpoint =
        existente.tipo === "licencia"
          ? `licencias/${existente.id}`
          : `guardias/${existente.id}`;

      if (typeof token !== "string" || token.trim() === "") {
        return;
      }

      const ok = await deleteData(endpoint, token);

      if (ok) {
        setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
      } else {
        return;
      }
    }

    if (nuevoTipo === "D") return;

    // Revisa si quieres resetear 'dia' para no acumular días en cada loop
    let esBloque =
      (nuevoTipo === "T" || nuevoTipo.toLowerCase() === "brou") &&
      Array.from({ length: 5 }).every((_, i) => {
        const fecha = dia.add(i, "day").format("YYYY-MM-DD");

        const ocupado = guardias.find((g) => {
          if (g.usuario_id !== usuario.id) return false;
          const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
          const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
          return fecha >= inicio && fecha <= fin;
        });

        return !ocupado;
      });

    if (esBloque) {
      for (let i = 0; i < 5; i++) {
        // Importante: clonar 'dia' para no modificar el original en cada iteración
        const fecha = dia.add(i, "day").clone();

        const nueva = {
          usuario_id: usuario.id,
          fecha_inicio: fecha.format("YYYY-MM-DD"),
          fecha_fin: fecha.format("YYYY-MM-DD"),
          tipo: nuevoTipo,
          comentario: "Agregada manualmente",
        };

        const creada = await postData("guardias", nueva, token, {
          "Content-Type": "application/json",
        });

        if (creada) setGuardias((prev) => [...prev, creada]);
      }
    } else {
      const nueva = {
        usuario_id: usuario.id,
        fecha_inicio: fechaStr,
        fecha_fin: fechaStr,
        tipo: nuevoTipo === "T" ? "guardia" : nuevoTipo,
        comentario: "Agregada manualmente",
      };

      const creada = await postData("guardias", nueva, token, {
        "Content-Type": "application/json",
      });

      if (creada) setGuardias((prev) => [...prev, creada]);
    }
  };

  const abrirModalLicencia = (usuario_licencia, dia) => {
    setModalData({
      usuario: usuario_licencia,
      fechaInicio: dia,
    });
  };

  const eliminarLicencia = async (usuario_licencia, dia) => {
    const token = usuario.token;
    if (!token) {
      console.error("Token no proporcionado para eliminar licencia");
      return false;
    }

    const fechaStr = dia.format("YYYY-MM-DD");

    // Buscar licencia existente para ese día
    const existente = guardias.find((g) => {
      if (g.usuario_id !== usuario_licencia.id || g.tipo !== "licencia")
        return false;

      const inicio = dayjs.utc(g.fecha_inicio).format("YYYY-MM-DD");
      const fin = dayjs.utc(g.fecha_fin).format("YYYY-MM-DD");

      return fechaStr >= inicio && fechaStr <= fin;
    });

    if (!existente) {
      console.warn(`No se encontró licencia para el ${fechaStr}`);
      return false;
    }

    try {
      const ok = await deleteData(`licencias/${existente.id}`, token);
      if (ok) {
        setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
        return true;
      } else {
        console.error(`❌ Error al borrar licencia ID ${existente.id}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Error en eliminarLicencia:", error);
      return false;
    }
  };

  const abrirModalEditarLicencia = (usuario, dia) => {
    const fechaStr = dia.format("YYYY-MM-DD");

    const existente = guardias.find((g) => {
      if (g.usuario_id !== usuario.id || g.tipo !== "licencia") return false;
      const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
      return fechaStr >= inicio && fechaStr <= fin;
    });

    if (!existente) return;

    setModalData({
      usuario,
      id: existente.id,
      fechaInicio: existente.fecha_inicio,
      fechaFin: existente.fecha_fin,
      motivo: existente.motivo,
    });
  };

  const handleLicenciaSubmit = async ({ fechaFin, motivo }) => {
    try {
      const usuarioId = modalData.usuario.id;
      const fechaInicio = dayjs(modalData.fechaInicio);
      const fechaFinDayjs = dayjs(fechaFin);

      // 1️⃣ Buscar guardias que se superpongan con la licencia
      const guardiasAEliminar = guardias.filter((g) => {
        if (g.usuario_id !== usuarioId || g.tipo !== "guardia") return false;

        const inicio = dayjs.utc(g.fecha_inicio);
        const fin = dayjs.utc(g.fecha_fin);

        return (
          inicio.isSameOrBefore(fechaFinDayjs, "day") &&
          fin.isSameOrAfter(fechaInicio, "day")
        );
      });

      // 2️⃣ Borrar las guardias superpuestas en paralelo
      await Promise.all(
        guardiasAEliminar.map(async (g) => {
          const ok = await deleteData(`guardias/${g.id}`, usuario.token);
          if (ok) {
            setGuardias((prev) => prev.filter((x) => x.id !== g.id));
          } else {
            console.error("❌ Error al eliminar guardia", g.id);
          }
        })
      );

      // 3️⃣ Preparar la licencia
      const nuevaLicencia = {
        usuario_id: usuarioId,
        fecha_inicio: fechaInicio.utc().format("YYYY-MM-DD"),
        fecha_fin: fechaFinDayjs.utc().format("YYYY-MM-DD"),
        motivo,
        estado: "activo",
      };

      // 4️⃣ Crear licencia en backend
      const creada = await postData("licencias", nuevaLicencia, usuario.token);

      if (creada) {
        // 5️⃣ Agregar la licencia al estado local como "licencia"
        setGuardias((prev) => [...prev, { ...creada, tipo: "licencia" }]);
        setModalData(null);
      } else {
        console.error("❌ Error al guardar licencia");
      }
    } catch (error) {
      console.error("❌ Error en handleLicenciaSubmit:", error);
    }
  };

  const eliminarGuardiasFiltradas = async ({ desde, hasta, usuario_ids }) => {
    const desdeD = dayjs.utc(desde).startOf("day");
    const hastaD = dayjs.utc(hasta).endOf("day");

    const idsObjetivo =
      usuario_ids === "todos"
        ? funcionarios
            .filter((f) => f.turno_id === modalEliminar.turno.id)
            .map((f) => f.id)
        : usuario_ids;

    const guardiasFiltradas = guardias.filter((g) => {
      if (g.tipo !== "guardia") return false;
      if (!idsObjetivo.includes(g.usuario_id)) return false;

      const inicio = dayjs.utc(g.fecha_inicio).startOf("day");
      if (!inicio.isValid()) return false;

      return inicio.isSameOrAfter(desdeD) && inicio.isSameOrBefore(hastaD);
    });

    for (const g of guardiasFiltradas) {
      const ok = await deleteData(`guardias/${g.id}`, usuario.token);
      if (ok) {
        setGuardias((prev) => prev.filter((x) => x.id !== g.id));
      } else {
        console.error("Error al eliminar guardia", g.id);
      }
    }

    setModalEliminar(null);
  };

  const funcionariosPorTurno = (turnoId) =>
    funcionarios
      .filter((f) => f.turno_id === turnoId)
      .sort((a, b) => (b.grado || 0) - (a.grado || 0));

  return (
    <div className="p-6 space-y-2 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">
        Escalafón de Servicio
      </h1>

      {/* Controles de visualización */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2 font-semibold text-blue-900">Mostrar:</label>
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(parseInt(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA"}
          >
            <option value={7}>1 Semana</option>
            <option value={14}>2 Semanas</option>
            <option value={30}>1 Mes</option>
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold text-blue-900">Desde:</label>
          <input
            type="date"
            value={startDate.format("YYYY-MM-DD")}
            onChange={(e) => setStartDate(dayjs(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA"}
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={exportarPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          >
            📄 Exportar a PDF
          </button>
        </div>
      </div>

      {/* Contenedor Principal */}
      {turnos.length === 0 ||
      funcionarios.length === 0 ||
      guardias.length === 0 ? (
        <Loading />
      ) : (
        <div id="contenedor-tablas" className="mb-6">
          {turnos.map((turno) => {
            const lista = funcionariosPorTurno(turno.id);

            return (
              <div key={turno.id} className="bg-white rounded shadow p-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm text-center">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border px-2 py-1 w-48">
                          <h2 className="text-lg font-semibold text-blue-800">
                            {turno.nombre}
                          </h2>
                        </th>
                        {dias.map((d) => (
                          <th
                            key={d.format("YYYY-MM-DD")}
                            className="border px-2 py-1"
                          >
                            {d.format("ddd")} <br /> {d.format("D")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((f) => (
                        <tr key={f.id}>
                          <td className="border px-2 text-left whitespace-nowrap w-48 min-w-48">
                            G{f.grado} {f.nombre}
                          </td>
                          {dias.map((d) => {
                            const valor = getCelda(f, d);
                            const esFinDeSemana = [6, 0].includes(d.day());

                            let bgBase = "";
                            let textColor = "text-black";
                            let fontWeight = "font-normal";
                            let textSize = "text-sm";

                            switch (valor) {
                              case "D":
                                bgBase = "bg-black";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "T":
                                bgBase = "bg-white";
                                textColor = "text-black";
                                fontWeight = "font-normal";
                                break;
                              case "L":
                                bgBase = "bg-green-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "1ro":
                                bgBase = "bg-blue-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "2do":
                                bgBase = "bg-blue-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "3er":
                                bgBase = "bg-blue-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "CURSO":
                                bgBase = "bg-green-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                textSize = "text-xs";
                                break;
                              case "BROU":
                                bgBase = "bg-white";
                                textColor = "text-black";
                                fontWeight = "font-normal";
                                textSize = "text-xs";
                                break;
                              case "CUSTODIA":
                                bgBase = "bg-blue-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                textSize = "text-xs";
                                break;
                              default:
                                bgBase = "";
                                textColor = "text-black";
                                fontWeight = "font-normal";
                            }

                            const fondoExtra = esFinDeSemana
                              ? ""
                              : "bg-opacity-100";

                            return (
                              <td
                                key={d.format("YYYY-MM-DD")}
                                className={`border py-1 h-5 relative group ${bgBase} ${textColor} ${fontWeight} ${textSize}`}
                              >
                                {valor}
                                {valor === "L"
                                  ? usuario?.rol_jerarquico ===
                                      "JEFE_DEPENDENCIA" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            abrirModalEditarLicencia(f, d)
                                          }
                                          className="absolute top-0 right-6 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-blue-700 transition"
                                          title="Editar Licencia"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => eliminarLicencia(f, d)}
                                          className="absolute top-0 right-0 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-red-700 transition"
                                          title="Eliminar Licencia"
                                        >
                                          ❌
                                        </button>
                                      </>
                                    )
                                  : usuario?.rol_jerarquico ===
                                      "JEFE_DEPENDENCIA" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            setSelectorTipo({
                                              usuario: f,
                                              dia: d,
                                            })
                                          }
                                          className="absolute top-0 right-6 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-blue-700 transition"
                                          title="Cambiar Guardia"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() =>
                                            abrirModalLicencia(f, d)
                                          }
                                          className="absolute top-0 right-0 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition"
                                          title="Agregar Licencia"
                                        >
                                          📄
                                        </button>
                                      </>
                                    )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {lista.length === 0 && (
                        <tr>
                          <td
                            colSpan={dias.length + 1}
                            className="text-center py-4 text-gray-500"
                          >
                            No hay funcionarios asignados a este turno.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() =>
          usuario?.rol_jerarquico === "JEFE_DEPENDENCIA"
            ? navigate("/escalafon-servicio")
            : navigate("/funcionario/" + usuario.id)
        }
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>

      {modalData && (
        <LicenciaModal
          usuario={modalData.usuario}
          fechaInicio={modalData.fechaInicio}
          onClose={() => setModalData(null)}
          onSubmit={handleLicenciaSubmit}
        />
      )}

      {modalEliminar && (
        <EliminarGuardiasModal
          turno={modalEliminar.turno}
          funcionarios={funcionariosPorTurno(modalEliminar.turno.id)}
          onClose={() => setModalEliminar(null)}
          onConfirm={eliminarGuardiasFiltradas}
        />
      )}
      {selectorTipo && usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 space-y-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Seleccionar tipo de guardia
            </h3>

            {["D", "T", "1ro", "2do", "3er", "CURSO", "BROU", "CUSTODIA"].map(
              (tipo) => (
                <button
                  key={tipo}
                  onClick={async () => {
                    await actualizarCelda(
                      selectorTipo.usuario,
                      selectorTipo.dia,
                      tipo,
                      usuario.token
                    );
                    setSelectorTipo(null);
                  }}
                  className={`w-full ${
                    tipo === "D"
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                      : tipo === "CURSO" || tipo === "CUSTODIA"
                      ? "bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      : tipo === "BROU"
                      ? "bg-white hover:bg-gray-100 text-black"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-900"
                  } font-medium py-2 px-4 rounded transition`}
                >
                  {tipo === "D" ? "Descanso (D)" : tipo}
                </button>
              )
            )}

            <button
              onClick={() => setSelectorTipo(null)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardiasPanel;
