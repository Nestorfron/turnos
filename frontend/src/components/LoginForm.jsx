import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login({
          id: data.id,
          nombre: data.nombre,
          correo: data.correo,
          token: data.token,
          rol_jerarquico: data.rol,
          dependencia_id: data.dependencia_id,
          zona_id: data.zona_id,
        });

        if (data.rol === "JEFE_ZONA") {
          navigate("/jefe-zona");
        } else if (data.rol === "encargado_dependencia") {
          navigate(`/dependencia/${data.id}`); 
        } else {
          navigate("/"); 
        }
      } else {
        alert(data.error || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      alert("Error en la conexión");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Correo"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-3 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Ingresando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
};

export default LoginForm;
