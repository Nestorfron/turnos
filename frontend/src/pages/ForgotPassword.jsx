import React, { useState } from "react";
import { forgotPassword } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("IDLE"); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado("LOADING");
    try {
      await forgotPassword(email);
      setEstado("SUCCESS");
    } catch (err) {
      console.error(err);
      setEstado("ERROR");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          ¿Olvidaste tu contraseña?
        </h1>

        {estado === "SUCCESS" ? (
          <p className="text-green-700 text-center">
            Si el correo existe, recibirás instrucciones para restablecerla.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
            
              <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <button
              type="submit"
              disabled={estado === "LOADING"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {estado === "LOADING" ? "Enviando..." : "Enviar"}
            </button>

            {estado === "ERROR" && (
              <p className="text-red-600 text-center">
                Ocurrió un error, intenta de nuevo.
              </p>
            )}
          </form>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-6 block text-blue-600  mx-auto"
        >
            <Home size={24} className="mx-2 cursor-pointer" />
        </button>
      </div>
    </main>
  );
};

export default ForgotPassword;
