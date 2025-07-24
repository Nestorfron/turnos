import React, { useEffect, useState } from "react";

const estadosDisponibles = ["activo", "inactivo"];

const AsignarTurnoModal = ({
  funcionarios,
  turnos,
  asignacion, // prop de asignación que viene del padre
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    usuario_id: "",
    turno_id: "",
    estado: "",
  });

  // Cuando cambia la prop `asignacion`, sincronizo el estado local `form`
  useEffect(() => {
    if (asignacion) {
      setForm({
        usuario_id: asignacion.usuario_id || "",
        turno_id: asignacion.turno_id || "",
        estado: asignacion.estado || "",
      });
    }
  }, [asignacion]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Mandamos el form completo al padre
    onSubmit(form);
  };

  if (!asignacion) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Asignar Turno a Funcionario</h2>

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

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
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
