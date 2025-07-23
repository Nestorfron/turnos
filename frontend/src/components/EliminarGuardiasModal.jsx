import React, { useState } from "react";
import dayjs from "dayjs";

const EliminarGuardiasModal = ({ turno, funcionarios, onClose, onConfirm }) => {
  const [desde, setDesde] = useState(dayjs().format("YYYY-MM-DD"));
  const [hasta, setHasta] = useState(dayjs().add(7, "day").format("YYYY-MM-DD"));
  const [seleccionados, setSeleccionados] = useState([]);

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      desde,
      hasta,
      usuario_ids: seleccionados.length > 0 ? seleccionados : "todos",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full space-y-4">
        <h2 className="text-lg font-bold text-red-700">Eliminar Guardias - {turno.nombre}</h2>

        <div>
          <label className="block font-semibold">Desde:</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block font-semibold">Hasta:</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Funcionarios:</label>
          <div className="max-h-40 overflow-y-auto border rounded px-2 py-1">
            {funcionarios.map((f) => (
              <label key={f.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(f.id)}
                  onChange={() => toggleSeleccion(f.id)}
                />
                G{f.grado} {f.nombre}
              </label>
            ))}
            {funcionarios.length === 0 && <p className="text-gray-500 text-sm">No hay funcionarios en este turno.</p>}
          </div>
          <small className="text-gray-500">Si no seleccionás ninguno, se eliminarán guardias de todos.</small>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EliminarGuardiasModal;
