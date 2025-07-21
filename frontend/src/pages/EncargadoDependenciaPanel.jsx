import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";

// Función genérica para fetch
const fetchData = async (url, setter) => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    setter(data);
  } catch (err) {
    console.error(err);
  }
};

// Tabla reutilizable
const Table = ({ title, columns, data, onEditTurno, onDeleteTurno }) => (
  <section className="mb-8">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-xl font-semibold text-blue-900 border-b border-blue-900 pb-1">
        {typeof title === "string" ? title : title.label}
      </h2>
      {title.button}
    </div>
    <div className="bg-white rounded-md shadow p-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
            {columns.map((col) => (
              <th key={col} className="border border-gray-300 py-3 px-4 text-left">
                {col}
              </th>
            ))}
            {(onEditTurno || onDeleteTurno) && (
              <th className="border border-gray-300 py-3 px-4 text-left">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEditTurno || onDeleteTurno ? 1 : 0)}
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
                {(onEditTurno || onDeleteTurno) && (
                  <td className="border border-gray-300 py-2 px-4 space-x-2">
                    {onEditTurno && (
                      <button
                        onClick={() => onEditTurno(item)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    {onDeleteTurno && (
                      <button
                        onClick={() => onDeleteTurno(item)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                )}
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
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(location.state?.sec || null);
  const [turnos, setTurnos] = useState([]);
  const [guardias, setGuardias] = useState([]);

  const [turnoEdit, setTurnoEdit] = useState(null);
  const [nuevoTurno, setNuevoTurno] = useState(null);

  useEffect(() => {
    if (!dependencia && id) {
      fetchData(
        `${import.meta.env.VITE_API_URL}/dependencias/${id}`,
        setDependencia
      );
    }
  }, [dependencia, id]);

  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData(
      `${import.meta.env.VITE_API_URL}/turnos?dependencia_id=${dependencia.id}`,
      setTurnos
    );
  }, [dependencia]);

  useEffect(() => {
    if (!turnos.length) {
      setGuardias([]);
      return;
    }

    fetchData(`${import.meta.env.VITE_API_URL}/guardias`, (allGuardias) => {
      const turnoIds = new Set(turnos.map((t) => t.id));
      const filtradas = allGuardias.filter((g) => turnoIds.has(g.turno_id));
      setGuardias(filtradas);
    });
  }, [turnos]);

  const closeModal = () => setTurnoEdit(null);
  const closeNuevoModal = () => setNuevoTurno(null);

  const handleUpdate = async () => {
    if (!turnoEdit) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/turnos/${turnoEdit.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(turnoEdit),
        }
      );

      if (res.ok) {
        alert("Turno actualizado");
        closeModal();
        fetchData(
          `${import.meta.env.VITE_API_URL}/turnos?dependencia_id=${dependencia.id}`,
          setTurnos
        );
      } else {
        alert("Error al actualizar");
      }
    } catch (err) {
      console.error(err);
      alert("Error en la solicitud");
    }
  };

  const handleCreate = async () => {
    if (!nuevoTurno) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/turnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoTurno,
          dependencia_id: dependencia.id,
        }),
      });

      if (res.ok) {
        alert("Turno creado");
        closeNuevoModal();
        fetchData(
          `${import.meta.env.VITE_API_URL}/turnos?dependencia_id=${dependencia.id}`,
          setTurnos
        );
      } else {
        alert("Error al crear");
      }
    } catch (err) {
      console.error(err);
      alert("Error en la solicitud");
    }
  };

  const handleDelete = async (turno) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el turno "${turno.nombre}"?`)) {
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/turnos/${turno.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        alert("Turno eliminado");
        fetchData(
          `${import.meta.env.VITE_API_URL}/turnos?dependencia_id=${dependencia.id}`,
          setTurnos
        );
      } else {
        alert(`Error al eliminar: ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error en la solicitud");
    }
  };

  if (!dependencia) {
    return <p className="text-red-600">Cargando dependencia...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">
          Panel Encargado de Dependencia
        </h1>

        <div className="bg-white rounded-md shadow p-6 mb-10">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            {dependencia.nombre}
          </h2>
          <p>
            <strong>Jefe:</strong> {dependencia.jefe_nombre || "Sin jefe"}
          </p>
          <p>
            <strong>Cantidad de funcionarios:</strong>{" "}
            {dependencia.funcionarios_count || 0}
          </p>
          <p>
            <strong>Descripción:</strong> {dependencia.descripcion || "-"}
          </p>
        </div>
      </header>

      <main className="space-y-10">
        <Table
          title={{
            label: "Turnos Actuales",
            button: (
              <button
                onClick={() =>
                  setNuevoTurno({
                    nombre: "",
                    hora_inicio: "",
                    hora_fin: "",
                    descripcion: "",
                  })
                }
                className="ml-4 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Agregar Turno
              </button>
            ),
          }}
          columns={["Nombre", "Hora Inicio", "Hora Fin", "Descripcion"]}
          data={turnos.map((t) => ({
            nombre: t.nombre,
            hora_inicio: t.hora_inicio?.slice(0, 5),
            hora_fin: t.hora_fin?.slice(0, 5),
            descripcion: t.descripcion,
            id: t.id,
          }))}
          onEditTurno={(turno) => setTurnoEdit(turno)}
          onDeleteTurno={handleDelete}
        />

        <Table
          title="Guardias Asignadas"
          columns={["Funcionario", "Turno", "Fecha Inicio", "Fecha Fin"]}
          data={guardias.map((g) => ({
            funcionario: g.usuario_id,
            turno: g.turno_id,
            fecha_inicio: new Date(g.fecha_inicio).toLocaleString(),
            fecha_fin: new Date(g.fecha_fin).toLocaleString(),
          }))}
        />
      </main>

      <button
        onClick={() => navigate("/jefe-zona")}
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>

      {/* Modal EDITAR */}
      {turnoEdit && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Turno</h2>

            <label className="block mb-2">
              Nombre
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mt-1"
                value={turnoEdit.nombre}
                onChange={(e) =>
                  setTurnoEdit({ ...turnoEdit, nombre: e.target.value })
                }
              />
            </label>

            <label className="block mb-2">
              Hora Inicio
              <input
                type="time"
                className="w-full border px-3 py-2 rounded mt-1"
                value={turnoEdit.hora_inicio?.slice(0, 5)}
                onChange={(e) =>
                  setTurnoEdit({ ...turnoEdit, hora_inicio: e.target.value })
                }
              />
            </label>

            <label className="block mb-2">
              Hora Fin
              <input
                type="time"
                className="w-full border px-3 py-2 rounded mt-1"
                value={turnoEdit.hora_fin?.slice(0, 5)}
                onChange={(e) =>
                  setTurnoEdit({ ...turnoEdit, hora_fin: e.target.value })
                }
              />
            </label>

            <label className="block mb-4">
              Descripción
              <select
                className="w-full border px-3 py-2 rounded mt-1"
                value={turnoEdit.descripcion || ""}
                onChange={(e) =>
                  setTurnoEdit({ ...turnoEdit, descripcion: e.target.value })
                }
              >
                <option value="">Seleccione una opción</option>
                <option value="Horario mañana">Horario mañana</option>
                <option value="Horario tarde">Horario tarde</option>
                <option value="Horario noche">Horario noche</option>
              </select>
            </label>

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal CREAR */}
      {nuevoTurno && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar Turno</h2>

            <label className="block mb-2">
              Nombre
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mt-1"
                value={nuevoTurno.nombre}
                onChange={(e) =>
                  setNuevoTurno({ ...nuevoTurno, nombre: e.target.value })
                }
              />
            </label>

            <label className="block mb-2">
              Hora Inicio
              <input
                type="time"
                className="w-full border px-3 py-2 rounded mt-1"
                value={nuevoTurno.hora_inicio}
                onChange={(e) =>
                  setNuevoTurno({ ...nuevoTurno, hora_inicio: e.target.value })
                }
              />
            </label>

            <label className="block mb-2">
              Hora Fin
              <input
                type="time"
                className="w-full border px-3 py-2 rounded mt-1"
                value={nuevoTurno.hora_fin}
                onChange={(e) =>
                  setNuevoTurno({ ...nuevoTurno, hora_fin: e.target.value })
                }
              />
            </label>

            <label className="block mb-4">
              Descripción
              <select
                className="w-full border px-3 py-2 rounded mt-1"
                value={nuevoTurno.descripcion || ""}
                onChange={(e) =>
                  setNuevoTurno({
                    ...nuevoTurno,
                    descripcion: e.target.value,
                  })
                }
              >
                <option value="">Seleccione una opción</option>
                <option value="Horario mañana">Horario mañana</option>
                <option value="Horario tarde">Horario tarde</option>
                <option value="Horario noche">Horario noche</option>
              </select>
            </label>

            <div className="flex justify-end space-x-2">
              <button
                onClick={closeNuevoModal}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncargadoDependenciaPanel;
