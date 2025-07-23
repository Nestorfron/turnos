import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "../utils/api.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/es";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import LicenciaModal from "../components/LicenciaModal.jsx";
import EliminarGuardiasModal from "../components/EliminarGuardiasModal.jsx";

dayjs.extend(utc);
dayjs.locale("es"); // Activar español

const apiUrl = import.meta.env.VITE_API_URL;

const GuardiasPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dependencia = location.state?.sec;

  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [turnos, setTurnos] = useState([]);

  const [modalEliminar, setModalEliminar] = useState(null);

  const [modalData, setModalData] = useState(null);
  const [daysToShow, setDaysToShow] = useState(7);

  const [startDate, setStartDate] = useState(dayjs("2025-07-01"));
  const dias = Array.from({ length: daysToShow }, (_, i) =>
    startDate.add(i, "day")
  );

  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData("usuarios", (usuarios) => {
      const filtrados = usuarios.filter(
        (u) =>
          u.dependencia_id === dependencia.id &&
          u.rol_jerarquico !== "JEFE_DEPENDENCIA"
      );
      setFuncionarios(filtrados);

      fetchData("guardias", (todasGuardias) => {
        const guardiasFiltradas = todasGuardias.filter((g) =>
          filtrados.some((f) => f.id === g.usuario_id)
        );

        fetchData("licencias", (todasLicencias) => {
          const licenciasFiltradas = todasLicencias
            .filter((l) => filtrados.some((f) => f.id === l.usuario_id))
            .map((l) => ({
              ...l,
              tipo: "licencia",
            }));

          setGuardias([...guardiasFiltradas, ...licenciasFiltradas]);
        });
      });
    });

    fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);
  }, [dependencia]);

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
      return "T";
    }

    return "D";
  };

  const actualizarCelda = async (usuario, dia, nuevoTipo) => {
    const fechaStr = dia.format("YYYY-MM-DD");

    const existente = guardias.find((g) => {
      if (g.usuario_id !== usuario.id) return false;
      const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
      return fechaStr >= inicio && fechaStr <= fin;
    });

    if (nuevoTipo === "T") {
      if (existente?.tipo === "licencia" || existente?.tipo === "guardia") {
        return;
      }

      const bloqueDisponible = Array.from({ length: 5 }).every((_, i) => {
        const fecha = dia.add(i, "day").format("YYYY-MM-DD");

        const ocupado = guardias.find((g) => {
          if (g.usuario_id !== usuario.id) return false;
          const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
          const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
          return fecha >= inicio && fecha <= fin;
        });

        return !ocupado;
      });

      if (bloqueDisponible) {
        for (let i = 0; i < 5; i++) {
          const fecha = dia.add(i, "day");
          const nueva = {
            usuario_id: usuario.id,
            fecha_inicio: fecha.format("YYYY-MM-DD"),
            fecha_fin: fecha.format("YYYY-MM-DD"),
            tipo: "guardia",
            comentario: "Agregada manualmente",
          };

          const resp = await fetch(`${apiUrl}/guardias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nueva),
          });

          if (resp.ok) {
            const creada = await resp.json();
            setGuardias((prev) => [...prev, creada]);
          }
        }
      } else {
        const nueva = {
          usuario_id: usuario.id,
          fecha_inicio: fechaStr,
          fecha_fin: fechaStr,
          tipo: "guardia",
          comentario: "Agregada manualmente",
        };

        const resp = await fetch(`${apiUrl}/guardias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nueva),
        });

        if (resp.ok) {
          const creada = await resp.json();
          setGuardias((prev) => [...prev, creada]);
        }
      }
    }

    if (nuevoTipo === "D" && existente) {
      const url =
        existente.tipo === "guardia"
          ? `${apiUrl}/guardias/${existente.id}`
          : `${apiUrl}/licencias/${existente.id}`;

      const resp = await fetch(url, { method: "DELETE" });

      if (resp.ok) {
        setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
      } else {
        const error = await resp.json();
        console.error("Error al borrar:", error);
      }
    }
  };

  const abrirModalLicencia = (usuario, dia) => {
    setModalData({
      usuario,
      fechaInicio: dia.format("YYYY-MM-DD"),
    });
  };

  const eliminarLicencia = async (usuario, dia) => {
    const fechaStr = dia.format("YYYY-MM-DD");

    const existente = guardias.find((g) => {
      if (g.usuario_id !== usuario.id || g.tipo !== "licencia") return false;
      const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
      return fechaStr >= inicio && fechaStr <= fin;
    });

    if (!existente) return;

    const resp = await fetch(`${apiUrl}/licencias/${existente.id}`, {
      method: "DELETE",
    });

    if (resp.ok) {
      setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
    } else {
      const error = await resp.json();
      console.error("Error al borrar licencia:", error);
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
      const resp = await fetch(`${apiUrl}/guardias/${g.id}`, {
        method: "DELETE",
      });
      if (resp.ok) {
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
    <div className="p-6 space-y-12 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">
        Guardias por Turno (Calendario)
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
          />
        </div>
      </div>

      {turnos.map((turno) => {
        const lista = funcionariosPorTurno(turno.id);

        return (
          <div key={turno.id} className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-blue-800">
                {turno.nombre}
              </h2>
              <button
                onClick={() => setModalEliminar({ turno })}
                className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 border border-red-300 px-3 py-1 rounded hover:bg-red-50 transition"
              >
                🗑
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Funcionario</th>
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
                      <td className="border px-2 py-1 text-left whitespace-nowrap">
                        G{f.grado} {f.nombre}
                      </td>
                      {dias.map((d) => {
                        const valor = getCelda(f, d);
                        return (
                          <td
                            key={d.format("YYYY-MM-DD")}
                            className={`border px-2 py-1 relative group ${
                              valor === "T"
                                ? "bg-blue-100"
                                : valor === "D"
                                ? "bg-yellow-100"
                                : valor === "L"
                                ? "bg-red-100"
                                : ""
                            }`}
                          >
                            {valor}
                            {valor === "L" ? (
                              <>
                                <button
                                  onClick={() => abrirModalEditarLicencia(f, d)}
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
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    actualizarCelda(
                                      f,
                                      d,
                                      valor === "T" ? "D" : "T"
                                    )
                                  }
                                  className="absolute top-0 right-6 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-blue-700 transition"
                                  title="Cambiar Guardia"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => abrirModalLicencia(f, d)}
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

      <button
        onClick={() => navigate("/dependencia/" + dependencia.id)}
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>

      {modalData && (
        <LicenciaModal
          usuario={modalData.usuario}
          fechaInicio={modalData.fechaInicio}
          onClose={() => setModalData(null)}
          onSubmit={async ({ fechaFin, motivo }) => {
            const licencia = {
              usuario_id: modalData.usuario.id,
              fecha_inicio: dayjs(modalData.fechaInicio).format("YYYY-MM-DD"),
              fecha_fin: dayjs(fechaFin).format("YYYY-MM-DD"),
              motivo,
              estado: "aprobada",
            };

            let nuevaLicencia = null;

            if (modalData.id) {
              const resp = await fetch(`${apiUrl}/licencias/${modalData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(licencia),
              });

              if (resp.ok) {
                nuevaLicencia = await resp.json();
                setGuardias((prev) =>
                  prev.map((g) =>
                    g.id === nuevaLicencia.id
                      ? { ...nuevaLicencia, tipo: "licencia" }
                      : g
                  )
                );
              }
            } else {
              const resp = await fetch(`${apiUrl}/licencias`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(licencia),
              });

              if (resp.ok) {
                nuevaLicencia = await resp.json();
                setGuardias((prev) => [
                  ...prev,
                  { ...nuevaLicencia, tipo: "licencia" },
                ]);
              }
            }

            setModalData(null);
          }}
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
    </div>
  );
};

export default GuardiasPanel;
