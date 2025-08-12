import React, { useState, useEffect } from "react";
import { postData, fetchData, putData } from "../utils/api";

const DependenciaModal = ({ dependencia, onClose, onSubmitted, isEditing, token }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    zona_id: null,
  });
  const [zonas, setZonas] = useState([]);

  useEffect(() => {
    const cargarZonas = async () => {
      const data = await fetchData("zonas", token);
      if (data) setZonas(data);
    };
    cargarZonas();
  }, [token]);

  useEffect(() => {
    if (dependencia) {
      setFormData({
        nombre: dependencia.nombre || "",
        descripcion: dependencia.descripcion || "",
        zona_id: dependencia.zona_id ?? null,
      });
    }
  }, [dependencia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "zona_id" ? (value === "" ? null : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let result;
      if (isEditing && dependencia?.id) {
        result = await putData(`dependencias/${dependencia.id}`, formData, token);
      } else {
        result = await postData("dependencias", formData, token);
      }

      if (result) {
        alert(isEditing ? "Seccional actualizada correctamente" : "Seccional agregada correctamente");
        onSubmitted(result);
      } else {
        alert("Error al guardar la seccional");
      }
    } catch (err) {
      console.error(err);
      alert("Error en la solicitud");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded p-6 max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? "Editar Seccional" : "Agregar Seccional"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-3">
            Nombre
            <input
              name="nombre"
              type="text"
              className="w-full border px-3 py-2 rounded mt-1"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block mb-3">
            Descripción
            <textarea
              name="descripcion"
              className="w-full border px-3 py-2 rounded mt-1"
              value={formData.descripcion}
              onChange={handleChange}
            />
          </label>

          <label className="block mb-4">
            Zona
            <select
              name="zona_id"
              className="w-full border px-3 py-2 rounded mt-1"
              value={formData.zona_id ?? ""}
              onChange={handleChange}
            >
              <option value="">-- Seleccionar zona --</option>
              {zonas.map((zona) => (
                <option key={zona.id} value={zona.id}>
                  {zona.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {isEditing ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DependenciaModal;
