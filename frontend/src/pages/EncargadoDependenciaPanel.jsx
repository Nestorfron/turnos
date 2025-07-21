import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const fetchData = async (url, setter) => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    setter(data);
  } catch (err) {
    console.error(err);
  }
};

const Table = ({ title, columns, data, onEdit }) => (
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
                key={col.label}
                className="border border-gray-300 py-3 px-4 text-left"
              >
                {col.label}
              </th>
            ))}
            {onEdit && <th className="border border-gray-300 py-3 px-4 text-left">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit ? 1 : 0)}
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
                  <td key={col.key} className="border border-gray-300 py-2 px-4">
                    {item[col.key] ?? "-"}
                  </td>
                ))}
                {onEdit && (
                  <td className="border border-gray-300 py-2 px-4">
                    <button
                      onClick={() => onEdit(item)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>
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

  // Para el modal de edición
  const [turnoEdit, setTurnoEdit] = useState(null);

  useEffect(() => {
    if (!dependencia && id) {
      fetchData(
        `${import.meta.env.VITE_API_URL}/dependencias/${id}`,
        setDependencia
      );
    }
  }, [dependencia, id]);

  const cargarTurnos = () => {
    if (!dependencia?.id) return;
    fetchData(
      `${import.meta.env.VITE_API_URL}/turnos?dependencia_id=${dependencia.id}`,
      setTurnos
    );
  };

  useEffect(() => {
    cargarTurnos();
  }, [dependencia]);

  useEffect(() => {
    if (!turnos.length) {
      setGuardias([]);
      return;
    }

    fetchData(
      `${import.meta.env.VITE_API_URL}/guardias`,
      (allGuardias) => {
        const turnoIds = new Set(turnos.map((t) => t.id));
        const filtradas = allGuardias.filter((g) => turnoIds.has(g.turno_id));
        setGuardias(filtradas);
      }
    );
  }, [turnos]);

  if (!dependencia) {
    return <p className="text-red-600">Cargando dependencia...</p>;
  }

  // Funciones para modal de editar
  const openModal = (turno) => {
    setTurnoEdit({...turno}); // copia para editar
  };

  const closeModal = () => {
    setTurnoEdit(null);
  };

  const handleUpdate = async () => {
    if (!turnoEdit) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/turnos/${turnoEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turnoEdit),
      });

      if (res.ok) {
        alert("Turno actualizado");
        closeModal();
        cargarTurnos();
      } else {
        alert("Error al actualizar");
      }
    } catch (err) {
      console.error(err);
      alert("Error en la solicitud");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 relative">
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
          columns={[
            { label: "Nombre", key: "nombre" },
            { label: "Hora Inicio", key: "hora_inicio" },
            { label: "Hora Fin", key: "hora_fin" },
          ]}
          data={turnos}
          onEdit={openModal}
        />

        <Table
          title="Guardias Asignadas"
          columns={[
            { label: "Funcionario", key: "funcionario" },
            { label: "Turno", key: "turno" },
            { label: "Fecha Inicio", key: "fecha_inicio" },
            { label: "Fecha Fin", key: "fecha_fin" },
          ]}
          data={guardias.map((g) => ({
            funcionario: g.usuario_id,
            turno: g.turno_id,
            fecha_inicio: new Date(g.fecha_inicio).toLocaleString(),
            fecha_fin: new Date(g.fecha_fin).toLocaleString(),
          }))}
        />
      </main>

      {/* Modal para editar turno */}
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

            <div className="flex justify-end space-x-2 mt-4">
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

      {/* Botón flotante para regresar */}
      <button
        onClick={() => navigate("/jefe-zona")}
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
        aria-label="Volver al panel de Jefe de Zona"
      >
        ← Volver
      </button>
    </div>
  );
};

export default EncargadoDependenciaPanel;
