import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import DonutChart from "../components/DonutChart";
import DependenciaModal from "../components/DependenciaModal.jsx";

import { fetchData, deleteData } from "../utils/api"; // ✅ importa utils

const JefeZonaDashboard = () => {
  const { usuario } = useAppContext();
  const [jefatura, setJefatura] = useState(null);
  const [dependencias, setDependencias] = useState([]);
  const [selectedDep, setSelectedDep] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  if (!usuario) {
    return <p className="p-6">Acceso no autorizado. Por favor inicia sesión.</p>;
  }

  const dependenciasZona = dependencias.filter(
    (dep) => dep.zona_id === usuario?.zona_id
  );

  const handleEdit = (dep) => {
    setSelectedDep(dep);
    setShowModal(true);
  };

  const handleDelete = async (depId) => {
    if (confirm("¿Seguro que deseas eliminar esta seccional?")) {
      const ok = await deleteData(`dependencias/${depId}`);
      if (ok) {
        setDependencias(dependencias.filter((d) => d.id !== depId));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Panel Jefe de Zona</h1>
        {jefatura ? (
          <div className="bg-white rounded-md shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              Unidad Ejecutora:
            </h2>
            <p><strong>{jefatura.nombre}</strong></p>
          </div>
        ) : (
          <p className="text-gray-500">No hay jefatura asignada.</p>
        )}
      </header>

      <main className="space-y-10">
        {dependenciasZona.length === 0 ? (
          <p className="text-gray-500">
            No hay seccionales asignadas a tu zona.
          </p>
        ) : (
          <>
            <section className="mb-8 bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">
                Seccionales
              </h3>
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
                    <th className="border border-gray-300 py-2 px-4 text-left">Nombre</th>
                    <th className="border border-gray-300 py-2 px-4 text-left">Jefe</th>
                    <th className="border border-gray-300 py-2 px-4 text-left">Funcionarios</th>
                    <th className="border border-gray-300 py-2 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dependenciasZona.map((sec) => (
                    <tr
                      key={sec.id}
                      className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
                    >
                      <td className="border border-gray-300 py-2 px-4">{sec.nombre}</td>
                      <td className="border border-gray-300 py-2 px-4">
                        {sec.jefe_nombre || "Sin jefe"}
                      </td>
                      <td className="border border-gray-300 py-2 px-4">
                        {sec.funcionarios_count || 0}
                      </td>
                      <td className="border border-gray-300 py-2 px-4 flex items-center gap-2">
                        <Link
                          to={`/dependencia/${sec.id}`}
                          state={{ sec }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Plus size={16} className="text-blue-600" />
                          Ver más
                        </Link>
                        <button
                          onClick={() => handleEdit(sec)}
                          title="Editar"
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sec.id)}
                          title="Eliminar"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="mb-8 bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">
                Funcionarios por Seccional
              </h3>
              <DonutChart data={dependenciasZona} />
            </section>
          </>
        )}
      </main>

      {showModal && selectedDep && (
        <DependenciaModal
          dependencia={selectedDep}
          onClose={() => setShowModal(false)}
          onUpdated={(updatedDep) => {
            setDependencias((prev) =>
              prev.map((d) => (d.id === updatedDep.id ? updatedDep : d))
            );
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};

export default JefeZonaDashboard;
