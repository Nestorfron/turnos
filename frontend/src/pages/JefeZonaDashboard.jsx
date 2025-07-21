import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const fetchData = async (endpoint, setter) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`);
    const data = await res.json();
    setter(data[endpoint] || data);
  } catch (err) {
    console.error(err);
  }
};

const JefeZonaDashboard = () => {
  const [jefatura, setJefatura] = useState(null);
  const [dependencias, setDependencias] = useState([]);

  useEffect(() => {
    fetchData("jefaturas", (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setJefatura(data[0]);
      } else {
        setJefatura(null);
      }
    });

    fetchData("dependencias", setDependencias);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Panel Jefe de Zona</h1>
        {jefatura ? (
          <div className="bg-white rounded-md shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              Unidad Ejecutora:
            </h2>
            <p>
              <strong>{jefatura.nombre}</strong>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No hay jefatura asignada.</p>
        )}
      </header>

      <main className="space-y-10">
        {jefatura?.zonas && jefatura.zonas.length > 0 ? (
          jefatura.zonas.map((zona) => {
            const seccionales = dependencias.filter(
              (dep) => dep.zona_id === zona.id
            );

            return (
              <section
                key={zona.id}
                className="mb-8 bg-white rounded-md shadow p-4"
              >
                <h3 className="text-lg font-semibold text-blue-700 mb-3">
                  {zona.nombre}
                </h3>

                {seccionales.length === 0 ? (
                  <p className="text-gray-500">
                    No hay seccionales asignadas a esta zona.
                  </p>
                ) : (
                  <table className="min-w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
                        <th className="border border-gray-300 py-2 px-4 text-left">
                          Nombre
                        </th>
                        <th className="border border-gray-300 py-2 px-4 text-left">
                          Jefe
                        </th>
                        <th className="border border-gray-300 py-2 px-4 text-left">
                          Cantidad Funcionarios
                        </th>
                        <th className="border border-gray-300 py-2 px-4 text-left">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {seccionales.map((sec) => (
                        <tr
                          key={sec.id}
                          className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
                        >
                          <td className="border border-gray-300 py-2 px-4">
                            {sec.nombre}
                          </td>
                          <td className="border border-gray-300 py-2 px-4">
                            {sec.jefe_nombre || "Sin jefe"}
                          </td>
                          <td className="border border-gray-300 py-2 px-4">
                            {sec.funcionarios_count || 0}
                          </td>
                          <td className="border border-gray-300 py-2 px-4">
                            <Link
                              to={{
                                pathname: `/dependencia/${sec.id}`,
                                state: { sec }
                              }}
                              className="inline-block bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                            >
                              Ver Panel
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })
        ) : (
          <p className="text-gray-500">No hay zonas asignadas.</p>
        )}
      </main>
    </div>
  );
};

export default JefeZonaDashboard;
