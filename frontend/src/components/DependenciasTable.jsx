import React, { useEffect, useState } from 'react';

const DependenciasTable = () => {
  const [dependencias, setDependencias] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/dependencias`)
      .then(res => res.json())
      .then(data => {
        setDependencias(data.dependencias || data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
  <thead>
    <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
      <th className="border border-gray-300 py-3 px-4 text-left">Nombre</th>
      <th className="border border-gray-300 py-3 px-4 text-left">Jefe</th>
      <th className="border border-gray-300 py-3 px-4 text-left">Cantidad Funcionarios</th>
    </tr>
  </thead>
  <tbody>
    {dependencias.map(dep => (
      <tr key={dep.id} className="even:bg-gray-50 hover:bg-blue-50 transition-colors">
        <td className="border border-gray-300 py-2 px-4">{dep.nombre}</td>
        <td className="border border-gray-300 py-2 px-4">{dep.jefe_nombre || 'Sin jefe'}</td>
        <td className="border border-gray-300 py-2 px-4">{dep.funcionarios_count || 0}</td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
};

export default DependenciasTable;
