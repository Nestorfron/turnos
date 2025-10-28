import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import ConfirmModal from "../components/ConfirmModal.jsx";
import Loading from "../components/Loading.jsx";
import { Camera } from "lucide-react";
import { toPng } from "html-to-image";
import { estaTokenExpirado } from "../utils/tokenUtils.js";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.locale("es");

//import jsPDF from "jspdf";
//import html2canvas from "html2canvas";

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

  const [showConfirm, setShowConfirm] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [mensajeConfirm, setMensajeConfirm] = useState("");

  const [startDate, setStartDate] = useState(dayjs().startOf("day"));
  const dias = Array.from({ length: daysToShow }, (_, i) =>
    startDate.add(i, "day")
  );

  // const exportarPDF = () => {
  //   const contenedor = document.getElementById("contenedor-tablas");

  //   if (!contenedor) return;

  //   html2canvas(contenedor, { scale: 2 }).then((canvas) => {
  //     const imgData = canvas.toDataURL("image/png");
  //     const pdf = new jsPDF("landscape", "pt", "a4");
  //     const pageWidth = pdf.internal.pageSize.getWidth();
  //     const pageHeight = pdf.internal.pageSize.getHeight();
  //     const imgWidth = pageWidth;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;

  //     if (imgHeight < pageHeight) {
  //       pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  //     } else {
  //       let heightLeft = imgHeight;
  //       let y = 0;

  //       while (heightLeft > 0) {
  //         pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
  //         heightLeft -= pageHeight;
  //         if (heightLeft > 0) {
  //           pdf.addPage();
  //           y -= pageHeight;
  //         }
  //       }
  //     }

  //     pdf.save("guardias_completo.pdf");
  //   });
  // };

  const capturar = () => {
    const elemento = document.getElementById("contenedor-tablas");

    const originalWidth = elemento.style.width;
    const originalHeight = elemento.style.height;
    const originalPadding = elemento.style.padding;

    elemento.style.padding = "20px";

    elemento.style.width = elemento.scrollWidth + 40 + "px"; // +40 = 20px izquierda + 20px derecha
    elemento.style.height = elemento.scrollHeight + 40 + "px"; // igual para altura

    toPng(elemento, {
      cacheBust: true,
      width: elemento.scrollWidth + 40,
      height: elemento.scrollHeight + 40,
    })
      .then((dataUrl) => {
        elemento.style.width = originalWidth;
        elemento.style.height = originalHeight;
        elemento.style.padding = originalPadding;

        const link = document.createElement("a");
        link.download = "turnos.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Error capturando pantalla:", err);

        elemento.style.width = originalWidth;
        elemento.style.height = originalHeight;
        elemento.style.padding = originalPadding;
      });
  };

  useEffect(() => {
    if (!usuario) {
      navigate("/");
    }

    if (estaTokenExpirado(usuario?.token)) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem("usuario");
      navigate("/");
      return;
    }

    if (!dependencia?.id) return;

    const cargarDatos = async () => {
      try {
        const usuarios = await fetchData("usuarios", usuario.token);
        const filtrados = usuarios.filter(
          (u) =>
            u.dependencia_id === dependencia.id &&
            u.rol_jerarquico !== "JEFE_DEPENDENCIA"
        );
        setFuncionarios(filtrados);

        const ids = new Set(filtrados.map((f) => f.id));

        const todasGuardias = await fetchData("guardias", usuario.token);
        const guardiasFiltradas = todasGuardias.filter((g) =>
          ids.has(g.usuario_id)
        );

        const todasLicenciasMedicas = await fetchData(
          "licencias-medicas",
          usuario.token
        );
        const licenciasFiltradasMedicas = todasLicenciasMedicas
          .filter((l) => ids.has(l.usuario_id))
          .map((l) => ({ ...l, tipo: "licencia_medica" }));

        const todasLicencias = await fetchData("licencias", usuario.token);
        const licenciasFiltradas = todasLicencias
          .filter((l) => ids.has(l.usuario_id))
          .map((l) => ({ ...l, tipo: "licencia" }));

        setGuardias([
          ...guardiasFiltradas,
          ...licenciasFiltradas,
          ...licenciasFiltradasMedicas,
        ]);

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
  }, [dependencia, usuario]);

  useEffect(() => {
    if (
      usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA" &&
      usuario?.is_admin !== true
    ) {
      setDaysToShow(14);
    }
  }, [usuario]);

  const handleConfirm = async () => {
    if (accionPendiente) await accionPendiente();
    setShowConfirm(false);
    setAccionPendiente(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setAccionPendiente(null);
  };

  const guardiasMap = useMemo(() => {
    const map = new Map();
    guardias.forEach((g) => {
      const inicio = dayjs(g.fecha_inicio).utc();
      const fin = dayjs(g.fecha_fin).utc();
      for (let d = inicio; d.isSameOrBefore(fin); d = d.add(1, "day")) {
        const key = `${g.usuario_id}_${d.format("YYYY-MM-DD")}`;
        map.set(key, g);
      }
    });
    return map;
  }, [guardias]);

  const getCelda = useCallback(
    (usuario, dia) => {
      const key = `${usuario.id}_${dia.format("YYYY-MM-DD")}`;
      const registro = guardiasMap.get(key);

      if (registro) {
        if (registro.tipo === "licencia") return "L";
        if (registro.tipo === "licencia_medica") return "L.Medica";
        if (registro.tipo === "guardia") return "T";
        if (registro.tipo === "Compensacion") return "CH";
        if (registro.tipo === "licencia-ext") return "L.Ext";
        if (registro.tipo === "descanso") return "D";
        return registro.tipo;
      }

      return "-";
    },
    [guardiasMap]
  );

  const enviarNotificacion = async (usuarioId, mensaje, fecha, token) => {
    if (!token) return;

    try {
      await postData(
        "notificaciones",
        { usuario_id: usuarioId, mensaje, fecha },
        token,
        { "Content-Type": "application/json" }
      );
    } catch (error) {
      console.error("Error enviando notificación:", error);
    }
  };

  const actualizarCelda = async (usuario, dia, nuevoTipo, token) => {
    if (!token) return;
  
    const fechaStr = dia.format("YYYY-MM-DD");
    const key = `${usuario.id}_${fechaStr}`;
    const existente = guardiasMap.get(key);
  
    // Eliminar guardia o licencia existente
    if (existente) {
      let endpoint = "";
      if (existente.tipo === "licencia") endpoint = `licencias/${existente.id}`;
      else if (existente.tipo === "licencia_medica")
        endpoint = `licencias-medicas/${existente.id}`;
      else endpoint = `guardias/${existente.id}`;
  
      if (typeof token !== "string" || token.trim() === "") return;
  
      const ok = await deleteData(endpoint, token);
      if (ok) {
        setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
      } else {
        return;
      }
    }
  
    // Crear descanso
    if (nuevoTipo === "D") {
      const nueva = {
        usuario_id: usuario.id,
        fecha_inicio: fechaStr,
        fecha_fin: fechaStr,
        tipo: "descanso",
        comentario: "Agregada manualmente",
      };
  
      const creada = await postData("guardias", nueva, token, {
        "Content-Type": "application/json",
      });
  
      if (creada) {
        setGuardias((prev) => [...prev, creada]);
        // Guardar acción pendiente y mensaje para el modal
        // setAccionPendiente(() => () =>
        //   enviarNotificacion(
        //     usuario.id,
        //     `Se agregó un descanso el ${fechaStr}`,
        //     fechaStr,
        //     token
        //   )
        // );
        // setModalData(null);
      }
      return;
    }
  
    // Determinar si es un bloque de 5 días (T o Brou)
    let esBloque =
      (nuevoTipo === "T" || nuevoTipo.toLowerCase() === "brou") &&
      Array.from({ length: 5 }).every((_, i) => {
        const fecha = dia.add(i, "day").format("YYYY-MM-DD");
        return !guardiasMap.has(`${usuario.id}_${fecha}`);
      });
  
    // Crear bloque de 5 días
    if (esBloque) {
      for (let i = 0; i < 5; i++) {
        const fecha = dia.add(i, "day").clone();
        const fechaBloqueStr = fecha.format("YYYY-MM-DD");
  
        const nueva = {
          usuario_id: usuario.id,
          fecha_inicio: fechaBloqueStr,
          fecha_fin: fechaBloqueStr,
          tipo: nuevoTipo,
          comentario: "Agregada manualmente",
        };
  
        const creada = await postData("guardias", nueva, token, {
          "Content-Type": "application/json",
        });
  
        if (creada) {
          setGuardias((prev) => [...prev, creada]);
          // setAccionPendiente(() => () =>
          //   enviarNotificacion(
          //     usuario.id,
          //     `Se agregó ${nuevoTipo} el ${fechaBloqueStr}`,
          //     fechaBloqueStr,
          //     token
          //   )
          // );
          // setMensajeConfirm(`¿Desea enviar notificación al usuario por la fecha ${fechaBloqueStr}?`);
          // setShowConfirm(true);
        }
      }
    } else {
      // Crear guardia individual
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
  
      if (creada) {
        setGuardias((prev) => [...prev, creada]);
        // setAccionPendiente(() => () =>
        //   enviarNotificacion(
        //     usuario.id,
        //     `Se agregó ${nueva.tipo} el ${fechaStr}`,
        //     fechaStr,
        //     token
        //   )
        // );
        // setModalData(null);
      }
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
    const key = `${usuario_licencia.id}_${fechaStr}`;
    const existente = guardiasMap.get(key);

    if (
      !existente ||
      (existente.tipo !== "licencia" && existente.tipo !== "licencia_medica")
    ) {
      console.warn(`No se encontró licencia válida para el ${fechaStr}`);
      return false;
    }

    const endpoint =
      existente.tipo === "licencia_medica"
        ? `licencias-medicas/${existente.id}`
        : `licencias/${existente.id}`;

    try {
      const ok = await deleteData(endpoint, token);
      if (ok) {
        setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
        return true;
      } else {
        console.error(
          `❌ Error al borrar ${existente.tipo} ID ${existente.id}`
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Error en eliminarLicencia:", error);
      return false;
    }
  };

  const handleLicenciaSubmit = async ({ fechaFin, motivo, esMedica }) => {
    try {
      const usuarioId = modalData.usuario.id;
      const fechaInicio = dayjs(modalData.fechaInicio);
      const fechaFinDayjs = dayjs(fechaFin);

      const guardiasAEliminar = guardias.filter((g) => {
        if (g.usuario_id !== usuarioId || g.tipo !== "guardia") return false;

        const inicio = dayjs.utc(g.fecha_inicio);
        const fin = dayjs.utc(g.fecha_fin);

        return (
          inicio.isSameOrBefore(fechaFinDayjs, "day") &&
          fin.isSameOrAfter(fechaInicio, "day")
        );
      });

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

      const nuevaLicencia = {
        usuario_id: usuarioId,
        fecha_inicio: fechaInicio.utc().format("YYYY-MM-DD"),
        fecha_fin: fechaFinDayjs.utc().format("YYYY-MM-DD"),
        motivo,
        estado: "activo",
      };

      const endpoint = esMedica ? "licencias-medicas" : "licencias";

      const creada = await postData(endpoint, nuevaLicencia, usuario.token);

      if (creada) {
        const tipo = esMedica ? "licencia_medica" : "licencia";
        setGuardias((prev) => [...prev, { ...creada, tipo }]);
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

  const funcionariosPorTurnoMap = useMemo(() => {
    const map = new Map();

    for (const f of funcionarios) {
      if (!map.has(f.turno_id)) map.set(f.turno_id, []);
      map.get(f.turno_id).push(f);
    }

    for (const [, lista] of map) {
      lista.sort((a, b) => {
        const diffGrado = (b.grado || 0) - (a.grado || 0);
        if (diffGrado !== 0) return diffGrado;

        const fechaA = a.fecha_ingreso
          ? new Date(a.fecha_ingreso)
          : new Date(9999, 0, 1);
        const fechaB = b.fecha_ingreso
          ? new Date(b.fecha_ingreso)
          : new Date(9999, 0, 1);
        return fechaA - fechaB;
      });
    }

    return map;
  }, [funcionarios]);

  const funcionariosPorTurno = useCallback(
    (turnoId) => funcionariosPorTurnoMap.get(turnoId) || [],
    [funcionariosPorTurnoMap]
  );

  return (
    <div className="mb-6 p-6 space-y-2 bg-gray-50 min-h-screen">
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
            disabled={
              usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA" &&
              usuario?.is_admin !== true
            }
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={capturar}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Exportar Imagen
          </button>
        </div>
      </div>

      {/* Contenedor Principal */}
      {turnos.length === 0 ||
      funcionarios.length === 0 ||
      guardias.length === 0 ? (
        <Loading />
      ) : (
        <div
          id="contenedor-tablas"
          className="mb-6 pb-6 overflow-x-auto bg-white rounded shadow"
        >
          {turnos.map((turno) => {
            const lista = funcionariosPorTurno(turno.id);

            return (
              <div key={turno.id} className="p-4">
                <div>
                  <table className="min-w-full text-sm text-center">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="bg-white border px-2 text-left whitespace-nowrap  w-48 min-w-48 ">
                          <h2 className="text-lg font-semibold text-blue-800">
                            {turno.nombre}
                          </h2>
                        </th>
                        {dias.map((d) => (
                          <th
                            key={d.format("YYYY-MM-DD")}
                            className="bg-gray-200 border px-2 py-1"
                          >
                            {d.format("DD")}/{d.format("MM")} <br />{" "}
                            {d.format("ddd")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((f) => (
                        <tr key={f.id}>
                          <td className="bg-white border px-2 text-left whitespace-nowrap  w-48 min-w-48 ">
                            G{f.grado} {f.nombre}
                          </td>
                          {dias.map((d) => {
                            const valor = getCelda(f, d);
                            const esFinDeSemana = [6, 0].includes(d.day());

                            let bgBase = "";
                            let textColor = "text-black";
                            let fontWeight = "font-normal";
                            let textSize = "text-xs";

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
                              case "Curso":
                                bgBase = "bg-green-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "BROU":
                                bgBase = "bg-white";
                                textColor = "text-black";
                                fontWeight = "font-normal";
                                textSize = "text-xs";
                                break;
                              case "Custodia":
                                bgBase = "bg-blue-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "CH":
                                bgBase = "bg-green-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "L.Ext":
                                bgBase = "bg-green-600";
                                textColor = "text-white";
                                fontWeight = "font-bold";
                                break;
                              case "L.Medica":
                                bgBase = "bg-yellow-300";
                                textColor = "text-black";
                                fontWeight = "font-bold";
                                break;
                              case "-":
                                bgBase = "bg-gray-300";
                                textColor = "text-gray-300";
                                fontWeight = "font-normal";
                                break;
                              default:
                                bgBase = "";
                                textColor = "text-black";
                                fontWeight = "font-normal";
                            }

                            return (
                              <td
                                key={d.format("YYYY-MM-DD")}
                                className={`border py-1 h-5 relative group ${bgBase} ${textColor} ${fontWeight} ${textSize}`}
                              >
                                {valor}
                                {valor === "L" || valor === "L.Medica"
                                  ? usuario?.rol_jerarquico ===
                                      "JEFE_DEPENDENCIA" && (
                                      <>
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
                                {valor === "L" || valor === "L.Medica"
                                  ? usuario?.is_admin === true && (
                                      <>
                                        <button
                                          onClick={() => eliminarLicencia(f, d)}
                                          className="absolute top-0 right-0 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-red-700 transition"
                                          title="Eliminar Licencia"
                                        >
                                          ❌
                                        </button>
                                      </>
                                    )
                                  : usuario?.is_admin === true && (
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

      {showConfirm && (
        <ConfirmModal
          open={showConfirm}
          mensaje={mensajeConfirm}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
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
      {selectorTipo && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 ">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 space-y-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Seleccionar tipo de guardia
            </h3>

            {[
              "D",
              "T",
              "1ro",
              "2do",
              "3er",
              "Curso",
              "BROU",
              "Custodia",
              "CH",
              "L.Ext",
            ].map((tipo) => (
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
                    : tipo === "Curso" || tipo === "Custodia"
                    ? "bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    : tipo === "BROU"
                    ? "bg-white hover:bg-gray-100 text-black"
                    : tipo === "CH"
                    ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                    : tipo === "L.Ext"
                    ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                    : "bg-blue-100 hover:bg-blue-200 text-blue-900"
                } font-medium py-2 px-4 rounded transition`}
              >
                {tipo === "D" ? "Descanso (D)" : tipo}
              </button>
            ))}

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
