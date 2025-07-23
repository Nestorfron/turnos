import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchData } from "../utils/api.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);


const apiUrl = import.meta.env.VITE_API_URL;

const GuardiasPanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dependencia = location.state?.sec;

  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [turnos, setTurnos] = useState([]);

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

    fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);
  }, [dependencia]);

  const getCelda = (usuario, dia) => {
    const fecha = dia.format("YYYY-MM-DD");
    const guardia = guardias.find(
      (g) =>
        g.usuario_id === usuario.id &&
        dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD") === fecha
    );

    if (guardia) {
      if (guardia.tipo === "licencia") return "L";
      return "T";
    }

    return "D";
  };

  const actualizarCelda = async (usuario, dia, nuevoTipo) => {
    const fechaStr = dia.format("YYYY-MM-DD");
    const existente = guardias.find(
      (g) =>
        g.usuario_id === usuario.id &&
        dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD") === fechaStr
    );

    if (nuevoTipo === "T" && !existente) {
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
        const nuevaGuardia = await resp.json();
        setGuardias((prev) => [...prev, nuevaGuardia]);
      }
    }

    if (nuevoTipo === "D" && existente && existente.tipo === "guardia") {
      const resp = await fetch(
        `${apiUrl}/guardias/${existente.id}`,
        { method: "DELETE" }
      );

      if (resp.ok) {
        setGuardias((prev) => prev.filter((g) => g.id !== existente.id));
      }
    }
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
                            {valor !== "L" && (
                              <button
                                onClick={() =>
                                  actualizarCelda(f, d, valor === "T" ? "D" : "T")
                                }
                                className="absolute top-0 right-0 text-xs text-gray-500 p-1 opacity-0 group-hover:opacity-100 hover:text-blue-700 transition"
                                title="Editar"
                              >
                                ✏️
                              </button>
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
    </div>
  );
};

export default GuardiasPanel;
