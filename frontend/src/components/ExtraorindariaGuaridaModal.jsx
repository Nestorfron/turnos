import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const ExtraordinariaGuardiaModal = ({
  usuarios,
  extraordinariaGuardia,
  onClose,
  onSubmit,
}) => {
  const [fechaInicio, setFechaInicio] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
  const [fechaFin, setFechaFin] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
  const [tipo, setTipo] = useState("");
  const [comentario, setComentario] = useState("");
  const [usuarioId, setUsuarioId] = useState("");

  useEffect(() => {
    if (extraordinariaGuardia) {
      setFechaInicio(dayjs(extraordinariaGuardia.fecha_inicio).format("YYYY-MM-DDTHH:mm"));
      setFechaFin(dayjs(extraordinariaGuardia.fecha_fin).format("YYYY-MM-DDTHH:mm"));
      setTipo(extraordinariaGuardia.tipo ?? "");
      setComentario(extraordinariaGuardia.comentario ?? "");
      setUsuarioId(extraordinariaGuardia.usuario_id ?? "");
    } else {
      setFechaInicio(dayjs().format("YYYY-MM-DDTHH:mm"));
      setFechaFin(dayjs().format("YYYY-MM-DDTHH:mm"));
      setTipo("");
      setComentario("");
      setUsuarioId("");
    }
  }, [extraordinariaGuardia]);

  useEffect(() => {
    if (dayjs(fechaFin).isBefore(dayjs(fechaInicio))) {
      setFechaFin(fechaInicio);
    }
  }, [fechaInicio, fechaFin]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-blue-800">
          {extraordinariaGuardia ? "Editar Licencia/Guardia" : "Agregar Licencia/Guardia"}
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Usuario</label>
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          >
            <option value="">Seleccionar funcionario</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                G{u.grado} {u.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha y hora de inicio</label>
          <input
            type="datetime-local"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha y hora de fin</label>
          <input
            type="datetime-local"
            value={fechaFin}
            min={fechaInicio}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Charla">Charla</option>
            <option value="Curso">Curso</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Comentario</label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onSubmit({
                fechaInicio,
                fechaFin,
                tipo,
                comentario,
                usuarioId,
              })
            }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            disabled={!usuarioId || !fechaInicio || !fechaFin || !tipo}
            title={!usuarioId || !fechaInicio || !fechaFin || !tipo ? "Complete todos los campos obligatorios" : ""}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtraordinariaGuardiaModal;
