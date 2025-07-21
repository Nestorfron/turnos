import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rolJerarquico, setRolJerarquico] = useState("usuario"); // valor por defecto

  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !correo || !password || !rolJerarquico) {
      alert("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: name,
          correo: correo,
          password: password,
          rol_jerarquico: rolJerarquico,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al crear usuario");
      }

      const data = await res.json();
      console.log("Usuario creado:", data);

      alert("Usuario registrado con éxito");
      navigate("/");

    } catch (err) {
      console.error(err);
      alert("Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <div className="mb-4">
        <label className="block mb-1 text-sm">Nombre Completo</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="Juan Pérez"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm">Correo Electrónico</label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="correo@dominio.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-sm">Contraseña</label>
        <input
          type="password"
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 text-sm">Rol Jerárquico</label>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={rolJerarquico}
          onChange={(e) => setRolJerarquico(e.target.value)}
        >
          <option value="">Seleccione un rol</option>
          <option value="jefe_zona">Jefe de Zona</option>
          <option value="encargado_dependencia">Encargado de Dependencia</option>
          <option value="usuario">Usuario</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
};

export default RegisterForm;
