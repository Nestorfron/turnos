import React, { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import { estaTokenExpirado } from "../utils/tokenUtils";


import img from "../assets/logo.png";

const Home = () => {
  const { usuario, logout } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (estaTokenExpirado(usuario?.token)) {
      logout();
    }
    if (usuario?.token) {
      switch (usuario.rol_jerarquico) {
        case "JEFE_ZONA":
          navigate("/jefe-zona");
          break;
        case "JEFE_DEPENDENCIA":
          navigate(`/escalafon-servicio`);
          break;
        case "FUNCIONARIO":
          navigate(`/funcionario/${usuario.id}`);
          break;
        case "ADMINISTRADOR":
          navigate("/admin");
          break;
        default:
          navigate("/");
      }
    }
  }, [usuario, navigate]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <section
        className="bg-white rounded-lg shadow-md p-8 w-full max-w-md"
        role="region"
        aria-label="Formulario de inicio de sesión"
      >
        <div className="flex justify-center mb-6 p-4 rounded-md">
          <img src={img} alt="Logo" className="w-auto h-20 rounded-lg" />         
        </div>

        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
          Iniciar Sesión
        </h1>

        <LoginForm />
      </section>

      <footer className="mt-8 text-center text-gray-500 text-sm select-none">
        © {new Date().getFullYear()} Sistema de Gestión de Personal
      </footer>
    </main>
  );
};

export default Home;
