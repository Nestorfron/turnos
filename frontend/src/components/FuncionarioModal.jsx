import React, { useEffect, useState } from "react";
import { postData, putData } from "../utils/api";

const rolMap = {
  usuario: "FUNCIONARIO",
  encargado_dependencia: "JEFE_DEPENDENCIA",
  jefe_zona: "JEFE_ZONA",
  administrador: "ADMINISTRADOR",
};

const reverseRolMap = {
  FUNCIONARIO: "usuario",
  JEFE_DEPENDENCIA: "encargado_dependencia",
  JEFE_ZONA: "jefe_zona",
  ADMINISTRADOR: "administrador",
};

const FuncionarioModal = ({
  onClose,
  onSubmitted,
  funcionario,
  zonas = [],
  dependencias = [],
  zonaId,
  token,
}) => {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    password: "",
    grado: "",
    rol_jerarquico: "usuario",
    dependencia_id: "",
    zona_id: zonaId || "",
  });

  const [error, setError] = useState("");
  const isEditing = !!funcionario;

  useEffect(() => {
    if (funcionario) {
      setForm({
        nombre: funcionario.nombre || "",
        correo: funcionario.correo || "",
        password: "",
        grado: funcionario.grado || "",
        rol_jerarquico: reverseRolMap[funcionario.rol_jerarquico] || "usuario",
        dependencia_id: funcionario.dependencia_id || "",
        zona_id: funcionario.zona_id || zonaId || "",
      });
    }
  }, [funcionario, zonaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      ...form,
      rol_jerarquico: rolMap[form.rol_jerarquico],
    };

    if (!isEditing && !form.password) {
      setError("La contraseña es obligatoria");
      return;
    }

    if (!payload.nombre || !payload.correo || !payload.grado || !payload.rol_jerarquico) {
      setError("Faltan campos obligatorios");
      return;
    }

    // Ajuste del payload según rol
    if (payload.rol_jerarquico === "JEFE_ZONA") {
      payload.dependencia_id = null;
      if (!form.zona_id) {
        setError("Debe seleccionar una zona para Jefe de Zona");
        return;
      }
    } else {
      payload.zona_id = null;
      if (!form.dependencia_id) {
        setError("Debe seleccionar una seccional para este rol");
        return;
      }
    }

    
    

    try {
      let data;
      if (isEditing) {
        
        
        data = await putData(`usuarios/${funcionario.id}`, payload, token);
      } else {
        
        
        data = await postData("usuarios", payload, token);
        
      }
      onSubmitted(data);
    } catch (err) {
      console.error("Error al guardar funcionario:", err);
      setError("No se pudo guardar el funcionario. Revisa el token y permisos.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Editar Funcionario" : "Nuevo Funcionario"}
        </h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre"
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            name="correo"
            type="email"
            value={form.correo}
            onChange={handleChange}
            placeholder="Correo"
            className="w-full border px-3 py-2 rounded"
            required
          />
          <input
            name="grado"
            value={form.grado}
            onChange={handleChange}
            placeholder="Grado"
            className="w-full border px-3 py-2 rounded"
            required
          />
          <select
            name="rol_jerarquico"
            value={form.rol_jerarquico}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="usuario">Funcionario</option>
            <option value="encargado_dependencia">Encargado de Seccional</option>
            <option value="jefe_zona">Jefe de Zona</option>
          </select>
          {!isEditing && (
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Contraseña"
              className="w-full border px-3 py-2 rounded"
              required={!isEditing}
            />
          )}

          {(form.rol_jerarquico === "usuario" ||
            form.rol_jerarquico === "encargado_dependencia") ? (
            <select
              name="dependencia_id"
              value={form.dependencia_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">Selecciona una seccional</option>
              {dependencias.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          ) : (
            <select
              name="zona_id"
              value={form.zona_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            >
              <option value="">Selecciona una zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>
          )}

          <div className="flex justify-end gap-3 pt-4">
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
              {isEditing ? "Guardar Cambios" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuncionarioModal;
