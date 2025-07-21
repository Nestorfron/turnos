import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Aquí pones la lógica real de login
    console.log("Login con:", email, password);

    // Ejemplo de validación simulada:
    if (email && password) {
      navigate("/jefe-zona"); // O la ruta a la que rediriges
    } else {
      alert("Completa todos los campos");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="mb-4">
        <label className="block mb-1 text-sm">Email</label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="correo@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 text-sm">Contraseña</label>
        <input
          type="password"
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Entrar
      </button>
    </form>
  );
};

export default LoginForm;
