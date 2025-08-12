import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit3, Trash2, Search } from "lucide-react";
import { useAppContext } from "../context/AppContext.jsx";
import DonutChart from "../components/DonutChart.jsx";
import DependenciaModal from "../components/DependenciaModal.jsx";
import FuncionarioModal from "../components/FuncionarioModal.jsx";
import { fetchData, deleteData } from "../utils/api.js";
import Loading from "../components/Loading.jsx";
import {estaTokenExpirado } from "../utils/tokenUtils";

const AdminPanel = () => {
  const { usuario, logout } = useAppContext();
  const navigate = useNavigate();

  const [jefatura, setJefatura] = useState(null);
  const [dependencias, setDependencias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDep, setSelectedDep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!usuario || usuario?.rol_jerarquico !== "ADMINISTRADOR" ) {
      navigate("/");
      return;
    }
    
    if (estaTokenExpirado(usuario?.token)) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem("usuario");
      navigate("/");
      return;
    }

    setIsLoading(true);

    const cargarDatos = async () => {
      try {
        const [jefaturasData, dependenciasData, usuariosData, zonasData] = await Promise.all([
          fetchData("jefaturas", null, usuario.token),
          fetchData("dependencias", null, usuario.token),
          fetchData("usuarios", null, usuario.token),
          fetchData("zonas", null, usuario.token),
        ]);

        setJefatura(Array.isArray(jefaturasData) && jefaturasData.length > 0 ? jefaturasData[0] : null);
        setDependencias(dependenciasData || []);
        setUsuarios(usuariosData || []);
        setZonas(zonasData || []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [usuario, navigate]);

  const dependenciasOrdenadas = [...dependencias].sort((a, b) => {
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

  const dataChart = dependenciasOrdenadas.map((d) => ({
    name: d.nombre,
    value: usuarios.filter((u) => u.dependencia_id === d.id).length,
  }));

  const handleEdit = (dep) => {
    setSelectedDep(dep);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedDep({
      nombre: "",
      descripcion: "",
      zona_id: usuario.zona_id,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDelete = async (depId) => {
    if (confirm("¿Seguro que deseas eliminar esta seccional?")) {
      try {
        const ok = await deleteData(`dependencias/${depId}`, usuario.token);
        if (ok) {
          setDependencias((prev) => prev.filter((d) => d.id !== depId));
        }
      } catch (error) {
        console.error("Error al eliminar dependencia:", error);
        alert("No se pudo eliminar la seccional. Intenta nuevamente.");
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDep(null);
  };

  const handleModalSubmit = (savedDep) => {
    if (isEditing) {
      setDependencias((prev) => prev.map((d) => (d.id === savedDep.id ? savedDep : d)));
    } else {
      setDependencias((prev) => [...prev, savedDep]);
    }
    handleModalClose();
  };

  const handleDeleteFuncionario = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este funcionario?")) {
      try {
        const ok = await deleteData(`usuarios/${id}`, usuario.token);
        if (ok) {
          setUsuarios((prev) => prev.filter((u) => u.id !== id));
        } else {
          alert("No se pudo eliminar el funcionario. Intenta de nuevo.");
        }
      } catch (error) {
        console.error("Error al eliminar funcionario:", error);
        alert("Ocurrió un error al intentar eliminar al funcionario.");
      }
    }
  };

  const filteredFuncionarios = usuarios.filter((f) => {
    const query = search.toLowerCase();
    return (
      f.nombre.toLowerCase().includes(query) ||
      f.grado?.toLowerCase().includes(query) ||
      f.rol_jerarquico?.toLowerCase().includes(query)
    );
  });

  if (!usuario) {
    return (
      <p className="p-6">
        Acceso no autorizado. Por favor inicia sesión como Administrador.
      </p>
    );
  }

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
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
          <button
            onClick={handleAdd}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Agregar Seccional
          </button>
        </div>

        {dependenciasOrdenadas.length === 0 ? (
          <p className="text-gray-500">No hay seccionales.</p>
        ) : (
          <>
            <section className="overflow-x-auto mb-8 bg-white rounded-md shadow p-4">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
                    <th className="border py-2 px-4 text-left">Nombre</th>
                    <th className="border py-2 px-4 text-left">Funcionarios</th>
                    <th className="border py-2 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {dependenciasOrdenadas.map((sec) => (
                    <tr
                      key={sec.id}
                      className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
                    >
                      <td className="border py-2 px-4">{sec.nombre}</td>
                      <td className="border py-2 px-4">
                        {usuarios.filter((u) => u.dependencia_id === sec.id).length}
                      </td>
                      <td className="border py-2 px-4 flex items-center gap-2">
                        <Link
                          to={`/escalafon-servicio`}
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-blue-700">
                  Todos los Funcionarios
                </h3>
                <button
                  onClick={() => {
                    setSelectedFuncionario(null);
                    setShowFuncionarioModal(true);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Agregar Funcionario
                </button>
              </div>

              <div className="mb-4 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, grado o rol..."
                  className="w-full border px-3 py-2 rounded pl-10"
                />
                <Search
                  className="absolute top-2.5 left-2.5 text-gray-400"
                  size={18}
                />
              </div>

              <div className="overflow-auto max-h-[400px]">
                {filteredFuncionarios.length === 0 ? (
                  <p className="text-gray-500">
                    No hay funcionarios registrados.
                  </p>
                ) : (
                  <table className="min-w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
                        <th className="border py-2 px-4 text-left">Nombre</th>
                        <th className="border py-2 px-4 text-left">Correo</th>
                        <th className="border py-2 px-4 text-left">Grado</th>
                        <th className="border py-2 px-4 text-left">Rol</th>
                        <th className="border py-2 px-4 text-left">Dependencia</th>
                        <th className="border py-2 px-4 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFuncionarios.map((f) => (
                        <tr
                          key={f.id}
                          className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
                        >
                          <td className="border py-2 px-4">{f.nombre}</td>
                          <td className="border py-2 px-4">{f.correo}</td>
                          <td className="border py-2 px-4">{f.grado}</td>
                          <td className="border py-2 px-4">{f.rol_jerarquico}</td>
                          <td className="border py-2 px-4">
                            {dependencias.find((d) => d.id === f.dependencia_id)
                              ?.nombre || "Sin dependencia"}
                          </td>
                          <td className="border py-2 px-4 flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedFuncionario(f);
                                setShowFuncionarioModal(true);
                              }}
                              title="Editar"
                              className="text-yellow-500 hover:text-yellow-600"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFuncionario(f.id)}
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
                )}
              </div>
            </section>

            <section className="mb-8 bg-white rounded-md shadow p-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">
                Funcionarios por Seccional
              </h3>
              <DonutChart data={dataChart} />
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
          token={usuario.token}
        />
      )}

      {showFuncionarioModal && (
        <FuncionarioModal
          funcionario={selectedFuncionario}
          onClose={() => {
            setShowFuncionarioModal(false);
            setSelectedFuncionario(null);
          }}
          onSubmitted={(nuevo) => {
            if (selectedFuncionario) {
              setUsuarios((prev) => prev.map((u) => (u.id === nuevo.id ? nuevo : u)));
            } else {
              setUsuarios((prev) => [...prev, nuevo]);
            }
            setShowFuncionarioModal(false);
            setSelectedFuncionario(null);
          }}
          zonaId={usuario?.zona_id}
          zonas={zonas}
          dependencias={dependenciasOrdenadas}
          token={usuario.token}
        />
      )}
    </div>
  );
};

export default AdminPanel;
