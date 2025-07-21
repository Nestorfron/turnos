// src/components/LoginForm.jsx
import React, { useState } from "react";

const LoginForm = ({ login }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.message || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      const userData = await res.json();
      login(userData); // Actualiza el contexto con usuario
      setLoading(false);
    } catch (err) {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full border px-3 py-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800"
        }`}
      >
        {loading ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
};

export default LoginForm;
