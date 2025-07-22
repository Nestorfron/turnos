import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const fetchData = async (endpoint, setter) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`);
    const data = await res.json();
    setter(data[endpoint] || data);
  } catch (err) {
    console.error(err);
  }
};

const EditDependenciaModal = ({ dependencia, zonas, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    zona_id: "",
  });

  useEffect(() => {
    if (dependencia) {
      setFormData({
        nombre: dependencia.nombre || "",
        descripcion: dependencia.descripcion || "",
        zona_id: dependencia.zona_id || "",
      });
    }
  }, [dependencia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/dependencias/${dependencia.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
        onClose();
      } else {
        alert("Error al actualizar la dependencia");
      }
    } catch (error) {
      console.error(error);
      alert("Error en la conexión");
    }
  };

  if (!dependencia) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Editar Dependencia</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold" htmlFor="nombre">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold" htmlFor="descripcion">
              Descripción
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold" htmlFor="zona_id">
              Zona
            </label>
            <select
              id="zona_id"
              name="zona_id"
              value={formData.zona_id}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Seleccione una zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JefeZonaDashboard = () => {
  const { usuario } = useAppContext();
  const [jefatura, setJefatura] = useState(null);
  const [dependencias, setDependencias] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [editDependencia, setEditDependencia] = useState(null);

  useEffect(() => {
    fetchData("jefaturas", (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setJefatura(data[0]);
      } else {
        setJefatura(null);
      }
    });

    fetchData("dependencias", setDependencias);
    fetchData("zonas", setZonas);
  }, []);

  const dependenciasZona = dependencias.filter(
    (dep) => dep.zona_id === usuario?.zona_id
  );

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres borrar esta dependencia?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/dependencias/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDependencias((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert("Error al borrar la dependencia");
      }
    } catch (error) {
      console.error(error);
      alert("Error en la conexión");
    }
  };

  if (!usuario) {
    return <p className="p-6">Acceso no autorizado. Por favor inicia sesión.</p>;
  }

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
        {dependenciasZona.length === 0 ? (
          <p className="text-gray-500">No hay seccionales asignadas a tu zona.</p>
        ) : (
          <section className="mb-8 bg-white rounded-md shadow p-4">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              Seccionales
            </h3>
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
                  <th className="border border-gray-300 py-2 px-4 text-left">Nombre</th>
                  <th className="border border-gray-300 py-2 px-4 text-left">Jefe</th>
                  <th className="border border-gray-300 py-2 px-4 text-left">
                    Cantidad Funcionarios
                  </th>
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
                    <td className="border border-gray-300 py-2 px-4 flex gap-2 items-center">
                      <Link
                        to={`/dependencia/${sec.id}`}
                        state={{ sec }}
                        className="flex items-center gap-1 px-3 py-1 rounded hover:shadow-lg bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium text-sm"
                        title="Ver Panel"
                      >
                        <Plus size={16} color="#2563EB" />
                        Ver Panel
                      </Link>
                      <button
                        onClick={() => setEditDependencia(sec)}
                        className="p-2 rounded hover:bg-gray-100"
                        title="Editar Seccional"
                      >
                        <Edit2 size={18} color="#D97706" />
                      </button>
                      <button
                        onClick={() => handleDelete(sec.id)}
                        className="p-2 rounded hover:bg-gray-100"
                        title="Borrar Seccional"
                      >
                        <Trash2 size={18} color="#DC2626" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>

      {editDependencia && (
        <EditDependenciaModal
          dependencia={editDependencia}
          zonas={zonas}
          onClose={() => setEditDependencia(null)}
          onUpdated={(updated) => {
            setDependencias((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
          }}
        />
      )}
    </div>
  );
};

export default JefeZonaDashboard;
