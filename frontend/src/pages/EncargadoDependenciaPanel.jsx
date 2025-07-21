import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

const fetchData = async (url, setter) => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    setter(data);
    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

const Table = ({ title, columns, data }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold text-blue-900 border-b border-blue-900 pb-1 mb-4">
      {title}
    </h2>
    <div className="bg-white rounded-md shadow p-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
            {columns.map((col) => (
              <th
                key={col}
                className="border border-gray-300 py-3 px-4 text-left"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 text-gray-500"
              >
                No hay datos disponibles
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={idx}
                className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col} className="border border-gray-300 py-2 px-4">
                    {item[col.toLowerCase().replace(/\s/g, "_")] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const EncargadoDependenciaPanel = () => {
  const location = useLocation();
  const { id } = useParams();

  const [dependencia, setDependencia] = useState(location.state?.sec || null);
  const [turnos, setTurnos] = useState([]);
  const [guardias, setGuardias] = useState([]);

  // Si no vino por state, lo pido al backend
  useEffect(() => {
    if (!dependencia && id) {
      fetchData(
        `${import.meta.env.VITE_API_URL}/dependencias/${id}`,
        setDependencia
      );
    }
  }, [dependencia, id]);

  // Fetch de turnos y guardias solo cuando tengo la dependencia
  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData(
      `${import.meta.env.VITE_API_URL}/turnos?dependencia_id=${dependencia.id}`,
      setTurnos
    );

    fetchData(
      `${import.meta.env.VITE_API_URL}/guardias?dependencia_id=${dependencia.id}`,
      setGuardias
    );
  }, [dependencia]);

  if (!dependencia) {
    return (
      <p className="text-red-600">
        Cargando dependencia...
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">
          Panel Encargado de Dependencia
        </h1>

        <div className="bg-white rounded-md shadow p-6 mb-10">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">{dependencia.nombre}</h2>
          <p><strong>Jefe:</strong> {dependencia.jefe_nombre || "Sin jefe"}</p>
          <p><strong>Cantidad de funcionarios:</strong> {dependencia.funcionarios_count || 0}</p>
          <p><strong>Descripción:</strong> {dependencia.descripcion || "-"}</p>
        </div>
      </header>

      <main className="space-y-10">
        <Table
          title="Turnos Actuales"
          columns={["Nombre", "Fecha Inicio", "Fecha Fin"]}
          data={turnos.map((t) => ({
            nombre: t.nombre,
            fecha_inicio: new Date(t.fecha_inicio).toLocaleString(),
            fecha_fin: new Date(t.fecha_fin).toLocaleString(),
          }))}
        />

        <Table
          title="Guardias Asignadas"
          columns={["Funcionario", "Fecha"]}
          data={guardias.map((g) => ({
            funcionario: g.usuario_id,
            fecha: new Date(g.fecha).toLocaleDateString(),
          }))}
        />
      </main>
    </div>
  );
};

export default EncargadoDependenciaPanel;
