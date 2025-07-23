import React from "react";

const TurnoModal = ({
  isEdit = false,
  turnoData,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!turnoData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? "Editar Turno" : "Agregar Turno"}
        </h2>

        <label className="block mb-2">
          Nombre
          <input
            type="text"
            className="w-full border px-3 py-2 rounded mt-1"
            value={turnoData.nombre}
            onChange={(e) => onChange({ ...turnoData, nombre: e.target.value })}
          />
        </label>

        <label className="block mb-2">
          Hora Inicio
          <input
            type="time"
            className="w-full border px-3 py-2 rounded mt-1"
            value={turnoData.hora_inicio?.slice(0, 5)}
            onChange={(e) =>
              onChange({ ...turnoData, hora_inicio: e.target.value })
            }
          />
        </label>

        <label className="block mb-2">
          Hora Fin
          <input
            type="time"
            className="w-full border px-3 py-2 rounded mt-1"
            value={turnoData.hora_fin?.slice(0, 5)}
            onChange={(e) =>
              onChange({ ...turnoData, hora_fin: e.target.value })
            }
          />
        </label>

        <label className="block mb-4">
          Descripción
          <select
            className="w-full border px-3 py-2 rounded mt-1"
            value={turnoData.descripcion || ""}
            onChange={(e) =>
              onChange({ ...turnoData, descripcion: e.target.value })
            }
          >
            <option value="">Seleccione una opción</option>
            <option value="Horario mañana">Horario mañana</option>
            <option value="Horario tarde">Horario tarde</option>
            <option value="Horario noche">Horario noche</option>
            <option value="Full Time">Full Time</option>
            <option value="Brou">Brou</option>
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
            className={`px-4 py-2 rounded ${
              isEdit
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isEdit ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TurnoModal;
