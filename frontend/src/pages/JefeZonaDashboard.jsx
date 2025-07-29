import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import DonutChart from "../components/DonutChart";
import DependenciaModal from "../components/DependenciaModal.jsx";
import { fetchData, deleteData } from "../utils/api";
import Loading from "../components/Loading";

const JefeZonaDashboard = () => {
  const { usuario } = useAppContext();
  const navigate = useNavigate();
  const [jefatura, setJefatura] = useState(null);
  const [dependencias, setDependencias] = useState([]);
  const [selectedDep, setSelectedDep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (usuario?.rol_jerarquico !== "JEFE_ZONA") {
      navigate("/");
      return;
    }
  
    const cargarDatos = async () => {
      setIsLoading(true);
  
      try {
        // Cargo jefaturas
        const jefaturas = await fetchData("jefaturas", usuario.token);
        setJefatura(Array.isArray(jefaturas) && jefaturas.length > 0 ? jefaturas[0] : null);
  
        // Cargo dependencias y usuarios
        const deps = await fetchData("dependencias", usuario.token);
        const usuarios = await fetchData("usuarios", usuario.token);
  
        const actualizadas = deps.map((dep) => {
          const usuariosDep = usuarios.filter((u) => u.dependencia_id === dep.id);
          const jefe = usuariosDep.find((u) => u.rol_jerarquico === "JEFE_DEPENDENCIA");
          return {
            ...dep,
            funcionarios_count: usuariosDep.length || 0,
            jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          };
        });
  
        setDependencias(actualizadas);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setIsLoading(false);
      }
    };
  
    cargarDatos();
  }, [usuario, navigate]);
  

  if (!usuario) {
    return (
      <p className="p-6">Acceso no autorizado. Por favor inicia sesión.</p>
    );
  }

  const dependenciasZona = dependencias
    .filter((dep) => dep.zona_id === usuario?.zona_id)
    .sort((a, b) => {
      const getNombre = (d) => d.nombre?.toLowerCase() ?? "";
      const extractNumber = (str) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      };

      const numA = extractNumber(getNombre(a));
      const numB = extractNumber(getNombre(b));

      if (numA !== null && numB !== null) {
        return numA - numB;
      }

      return getNombre(a).localeCompare(getNombre(b));
    });

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDep(null);
  };

  const handleModalSubmit = (savedDep) => {
    if (isEditing) {
      setDependencias((prev) =>
        prev.map((d) => (d.id === savedDep.id ? savedDep : d))
      );
    } else {
      setDependencias((prev) => [...prev, savedDep]);
    }
    handleModalClose();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {isLoading && <Loading />}
      <header className="mb-8">
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
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-semibold text-blue-700">Seccionales</h3>
        </div>

        {dependenciasZona.length === 0 ? (
          <p className="text-gray-500">
            No hay seccionales asignadas a tu zona.
          </p>
        ) : (
          <>
            <section className="mb-8 bg-white rounded-md shadow p-4">
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
                      Funcionarios
                    </th>
                    <th className="border border-gray-300 py-2 px-4 text-left">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dependenciasZona.map((sec) => (
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
                      <td className="border border-gray-300 py-2 px-4 flex items-center gap-2">
                        <Link
                          to={`/escalafon-servicio`}
                          state={{ sec }}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Plus size={16} className="text-blue-600" />
                          Ver más
                        </Link>
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
              <DonutChart
                data={dependenciasZona.map((dep) => ({
                  name: dep.nombre,
                  value: dep.funcionarios_count || 0,
                }))}
              />
            </section>
          </>
        )}
      </main>

      {showModal && (
        <DependenciaModal
          dependencia={selectedDep}
          isEditing={isEditing}
          onClose={handleModalClose}
          onSubmitted={handleModalSubmit}
        />
      )}
    </div>
  );
};

export default JefeZonaDashboard;
