import React, { useEffect, useState } from "react";

const estadosDisponibles = ["activo", "inactivo"];

const AsignarTurnoModal = ({
  funcionarios,
  turnos,
  asignacion,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    usuario_id: "",
    turno_id: "",
    estado: "",
    is_admin: false,
  });

  useEffect(() => {
    if (asignacion) {
      setForm({
        usuario_id: asignacion.usuario_id || "",
        turno_id: asignacion.turno_id || "",
        estado: asignacion.estado || "",
        is_admin: asignacion.is_admin || false,
      });
    }
  }, [asignacion]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(form);
  };

  if (!asignacion) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">Asignar Turno a Funcionario</h2>

        {asignacion.usuario_id ? (
          <p className="mb-3">
            <strong>Funcionario:</strong>{" "}
            {funcionarios.find((f) => f.id === form.usuario_id)?.nombre || "Desconocido"}{" "}
            ({funcionarios.find((f) => f.id === form.usuario_id)?.grado || "Sin grado"})
          </p>
        ) : (
          <label className="block mb-3">
            Funcionario
            <select
              className="w-full border px-3 py-2 rounded mt-1"
              value={form.usuario_id}
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
        )}

        <label className="block mb-3">
          Turno
          <select
            className="w-full border px-3 py-2 rounded mt-1"
            value={form.turno_id}
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
            value={form.estado}
            onChange={(e) => handleChange("estado", e.target.value || "")}
          >
            <option value="">Seleccione un estado</option>
            {estadosDisponibles.map((estado) => (
              <option key={estado} value={estado}>
                {estado.charAt(0).toUpperCase() + estado.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center mb-4">
          Administrador
          <input
            type="checkbox"
            checked={form.is_admin}
            onChange={(e) => handleChange("is_admin", e.target.checked)}
            className="border border-gray-300 m-4 rounded "
          />
        </label>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.usuario_id}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AsignarTurnoModal;
