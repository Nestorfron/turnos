import React from "react";

// Podés reemplazar esta lista por una que venga del backend en el futuro
const estadosDisponibles = ["asignado", "activo", "completado"];

const AsignarTurnoModal = ({
  funcionarios,
  turnos,
  asignacion,
  setAsignacion,
  onClose,
  onSubmit,
}) => {
  if (!asignacion) return null;

  const handleChange = (field, value) => {
    setAsignacion({ ...asignacion, [field]: value });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Asignar Turno a Funcionario</h2>

        <label className="block mb-3">
          Funcionario
          <select
            className="w-full border px-3 py-2 rounded mt-1"
            value={asignacion.usuario_id || ""}
            onChange={(e) =>
              handleChange("usuario_id", e.target.value ? parseInt(e.target.value) : "")
            }
          >
            <option value="">Seleccione un funcionario</option>
            {funcionarios.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre} ({f.grado || "Sin grado"})
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-3">
          Turno
          <select
            className="w-full border px-3 py-2 rounded mt-1"
            value={asignacion.turno_id || ""}
            onChange={(e) =>
              handleChange("turno_id", e.target.value ? parseInt(e.target.value) : "")
            }
          >
            <option value="">Seleccione un turno</option>
            {turnos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.hora_inicio?.slice(0, 5)} - {t.hora_fin?.slice(0, 5)})
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          Estado
          <select
            className="w-full border px-3 py-2 rounded mt-1"
            value={asignacion.estado ?? ""}
            onChange={(e) => handleChange("estado", e.target.value || null)}
          >
            <option value="">Seleccione un estado</option>
            {estadosDisponibles.map((estado) => (
              <option key={estado} value={estado}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarTurnoModal;
