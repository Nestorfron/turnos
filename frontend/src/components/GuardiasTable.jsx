// src/components/GuardiasTable.jsx
import React, { useEffect, useState } from 'react';

const GuardiasTable = () => {
  const [guardias, setGuardias] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/guardias`)
      .then(res => res.json())
      .then(data => {
        setGuardias(data.guardias || data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border">Funcionario</th>
            <th className="py-2 px-4 border">Fecha</th>
            <th className="py-2 px-4 border">Dependencia</th>
          </tr>
        </thead>
        <tbody>
          {guardias.map(guardia => (
            <tr key={guardia.id}>
              <td className="py-2 px-4 border">{guardia.usuario_id}</td>
              <td className="py-2 px-4 border">{guardia.fecha}</td>
              <td className="py-2 px-4 border">{guardia.dependencia_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GuardiasTable;
