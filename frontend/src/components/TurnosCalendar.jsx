// src/components/TurnosCalendar.jsx
import React, { useEffect, useState } from 'react';

const TurnosCalendar = () => {
  const [turnos, setTurnos] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/turnos`)
      .then(res => res.json())
      .then(data => {
        setTurnos(data.turnos || data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">Nombre</th>
            <th className="py-2 px-4 border">Inicio</th>
            <th className="py-2 px-4 border">Fin</th>
            <th className="py-2 px-4 border">Dependencia</th>
          </tr>
        </thead>
        <tbody>
          {turnos.map(turno => (
            <tr key={turno.id}>
              <td className="py-2 px-4 border">{turno.nombre}</td>
              <td className="py-2 px-4 border">{turno.fecha_inicio}</td>
              <td className="py-2 px-4 border">{turno.fecha_fin}</td>
              <td className="py-2 px-4 border">{turno.dependencia_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TurnosCalendar;
