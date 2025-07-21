// src/components/TurnosCalendar.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TurnosCalendar = () => {
  const [turnos, setTurnos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/turnos`)
      .then(res => res.json())
      .then(data => {
        setTurnos(data.turnos || data);
      })
      .catch(err => console.error(err));
  }, []);

  // Función para formatear la hora a HH:MM
  const formatHora = (timeString) => {
    if (!timeString) return '-';
    // Asume formato `HH:MM:SS` o `HH:MM`
    return timeString.slice(0, 5);
  };

  const handleEditar = (turnoId) => {
    navigate(`/turnos/editar/${turnoId}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">Nombre</th>
            <th className="py-2 px-4 border">Inicio</th>
            <th className="py-2 px-4 border">Fin</th>
            <th className="py-2 px-4 border">Dependencia</th>
            <th className="py-2 px-4 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {turnos.map(turno => (
            <tr key={turno.id} className="hover:bg-blue-50">
              <td className="py-2 px-4 border">{turno.nombre}</td>
              <td className="py-2 px-4 border">{formatHora(turno.hora_inicio)}</td>
              <td className="py-2 px-4 border">{formatHora(turno.hora_fin)}</td>
              <td className="py-2 px-4 border">{turno.dependencia_id}</td>
              <td className="py-2 px-4 border text-center">
                <button
                  onClick={() => handleEditar(turno.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TurnosCalendar;
