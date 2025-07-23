import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchData } from "../utils/api";
import dayjs from "dayjs";

const GuardiasPanel = () => {
  const location = useLocation();
  const dependencia = location.state?.sec;

  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [turnos, setTurnos] = useState([]);

  const [hovered, setHovered] = useState(null); // { usuarioId, fecha }
  const [editando, setEditando] = useState(null); // { usuarioId, fecha }

  const startDate = dayjs("2025-07-01");
  const daysToShow = 7;
  const dias = Array.from({ length: daysToShow }, (_, i) =>
    startDate.add(i, "day")
  );

  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData("usuarios", (usuarios) => {
      const filtrados = usuarios.filter(
        (u) => u.dependencia_id === dependencia.id
      );
      setFuncionarios(filtrados);

      fetchData("guardias", (todas) => {
        const filtradas = todas.filter((g) =>
          filtrados.some((f) => f.id === g.usuario_id)
        );
        setGuardias(filtradas);
      });
    });

    fetchData(`turnos?dependencia_id=${dependencia.id}`, (data) => {
      const unicos = Array.from(new Map(data.map((t) => [t.id, t])).values());
      setTurnos(unicos);
    });
  }, [dependencia]);

  const getCelda = (usuario, dia) => {
    const fecha = dia.format("YYYY-MM-DD");

    const guardia = guardias.find(
      (g) =>
        g.usuario_id === usuario.id &&
        dayjs(g.fecha_inicio).format("YYYY-MM-DD") === fecha
    );

    if (guardia) {
      if (guardia.tipo === "licencia") return "L";
      return guardia.tipo === "D" ? "D" : "T";
    }

    const inicio = guardias
      .filter((g) => g.usuario_id === usuario.id)
      .map((g) => dayjs(g.fecha_inicio))
      .sort((a, b) => a.unix() - b.unix())[0];

    if (!inicio) return "";

    const diff = dia.diff(inicio, "day");
    const ciclo = diff % 6;

    return ciclo < 5 ? "T" : "D";
  };

  const funcionariosPorTurno = (turnoId) =>
    funcionarios
      .filter((f) => f.turno_id === turnoId)
      .sort((a, b) => (b.grado || 0) - (a.grado || 0));

  const alguienDescansa = (fecha, turnoId, exceptUsuarioId = null) => {
    const fechaStr = fecha.format("YYYY-MM-DD");
    return funcionarios.some((f) =>
      f.turno_id === turnoId &&
      f.id !== exceptUsuarioId &&
      guardias.some(
        (g) =>
          g.usuario_id === f.id &&
          g.tipo === "D" &&
          dayjs(g.fecha_inicio).format("YYYY-MM-DD") === fechaStr
      )
    );
  };

  const actualizarTipoGuardia = (usuarioId, fechaStr, nuevoTipo) => {
    const fecha = dayjs(fechaStr);
    const usuario = funcionarios.find((f) => f.id === usuarioId);
    const turnoId = usuario?.turno_id;

    const futuras = dias.filter((d) => d.isSame(fecha) || d.isAfter(fecha));
    const nuevasGuardias = [];

    for (let i = 0; i < futuras.length; i++) {
      let tipo = i % 6 < 5 ? nuevoTipo : nuevoTipo === "T" ? "D" : "T";

      // Verificar si otro ya descansa ese día
      const estaFecha = futuras[i];
      if (tipo === "D" && alguienDescansa(estaFecha, turnoId, usuarioId)) {
        tipo = "T"; // evitar doble descanso
      }

      nuevasGuardias.push({
        usuario_id: usuarioId,
        fecha_inicio: estaFecha.format("YYYY-MM-DD"),
        fecha_fin: estaFecha.format("YYYY-MM-DD"),
        tipo,
        comentario: `Modificado manualmente desde ${fechaStr}`,
      });
    }

    // Eliminar guardias futuras del usuario
    const actuales = guardias.filter(
      (g) =>
        g.usuario_id === usuarioId &&
        (dayjs(g.fecha_inicio).isSame(fecha) ||
          dayjs(g.fecha_inicio).isAfter(fecha))
    );

    Promise.all(
      actuales.map((g) =>
        fetch(`/api/guardias/${g.id}`, { method: "DELETE" })
      )
    ).then(() => {
      Promise.all(
        nuevasGuardias.map((g) =>
          fetch("/api/guardias", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(g),
          })
        )
      ).then(() => {
        fetchData("guardias", (todas) => {
          const filtradas = todas.filter((g) =>
            funcionarios.some((f) => f.id === g.usuario_id)
          );
          setGuardias(filtradas);
          setEditando(null);
        });
      });
    });
  };

  return (
    <div className="p-6 space-y-12 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">
        Guardias por Turno (Calendario)
      </h1>

      {turnos.map((turno) => {
        const lista = funcionariosPorTurno(turno.id);

        return (
          <div key={turno.id} className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">
              Turno: {turno.nombre}
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Funcionario</th>
                    {dias.map((d) => (
                      <th key={d.format("YYYY-MM-DD")} className="border px-2 py-1">
                        {d.format("dd")} <br /> {d.format("D")}
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
                        const celdaFecha = d.format("YYYY-MM-DD");
                        const valor = getCelda(f, d);

                        return (
                          <td
                            key={celdaFecha}
                            className="border px-2 py-1 relative group"
                            onMouseEnter={() =>
                              setHovered({ usuarioId: f.id, fecha: celdaFecha })
                            }
                            onMouseLeave={() => setHovered(null)}
                          >
                            {editando &&
                            editando.usuarioId === f.id &&
                            editando.fecha === celdaFecha ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() =>
                                    actualizarTipoGuardia(f.id, celdaFecha, "T")
                                  }
                                  className="text-green-600 hover:underline text-xs"
                                >
                                  T
                                </button>
                                <button
                                  onClick={() =>
                                    actualizarTipoGuardia(f.id, celdaFecha, "D")
                                  }
                                  className="text-yellow-600 hover:underline text-xs"
                                >
                                  D
                                </button>
                                <button
                                  onClick={() => setEditando(null)}
                                  className="text-gray-400 hover:text-black text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                {valor}
                                {hovered &&
                                  hovered.usuarioId === f.id &&
                                  hovered.fecha === celdaFecha && (
                                    <button
                                      onClick={() =>
                                        setEditando({
                                          usuarioId: f.id,
                                          fecha: celdaFecha,
                                        })
                                      }
                                      className="absolute top-0 right-0 p-1 text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      ✏️
                                    </button>
                                  )}
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
  );
};

export default GuardiasPanel;
