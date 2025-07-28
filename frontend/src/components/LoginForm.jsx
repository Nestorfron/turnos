import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Grab } from "lucide-react";

const LoginForm = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Iniciando login con:", { correo, password: password ? "***" : "" });
    console.log("URL backend:", `${import.meta.env.VITE_API_URL}/login`);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });
  
      console.log("Respuesta recibida del backend:", res);
  
      const data = await res.json();
      console.log("JSON parseado:", data);
  
      if (res.ok) {
        console.log("Login exitoso, datos usuario:", data.usuario);
  
        login({
          token: data.token,
          id: data.usuario.id,
          nombre: data.usuario.nombre,
          correo: data.usuario.correo,
          Grado: data.usuario.grado,
          rol_jerarquico: data.usuario.rol_jerarquico,
          dependencia_id: data.usuario.dependencia_id,
          dependencia_nombre: data.usuario.dependencia_nombre,
          zona_id: data.usuario.zona_id,
          zona_nombre: data.usuario.zona_nombre,
          turno_id: data.usuario.turno_id,
          estado: data.usuario.estado,
        });
  
        if (data.usuario.rol_jerarquico === "JEFE_ZONA") {
          console.log("Redirigiendo a /jefe-zona");
          navigate("/jefe-zona");
        } else if (
          data.usuario.rol_jerarquico === "JEFE_DEPENDENCIA" ||
          data.usuario.rol_jerarquico === "FUNCIONARIO"
        ) {
          console.log(`Redirigiendo a dependencia/${data.usuario.dependencia_id}`);
          navigate("dependencia/" + data.usuario.dependencia_id);
        } else if (data.usuario.rol_jerarquico === "ADMINISTRADOR") {
          console.log("Redirigiendo a /admin");
          navigate("/admin");
        } else {
          console.log("Redirigiendo a / (default)");
          navigate("/");
        }
      } else {
        console.warn("Error de login:", data.error || "Usuario o contraseña incorrectos");
        alert(data.error || "Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error en la conexión con backend:", error);
      alert("Error en la conexión");
    } finally {
      setLoading(false);
      console.log("Proceso de login finalizado");
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
