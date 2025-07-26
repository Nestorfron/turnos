import React, { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

const Home = () => {
  const { usuario } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario?.token) {
      if (usuario.rol_jerarquico === "JEFE_ZONA") {
        navigate("/jefe-zona");
      } else if (
        usuario.rol_jerarquico === "JEFE_DEPENDENCIA" ||
        usuario.rol_jerarquico === "FUNCIONARIO"
      ) {
        navigate(`/dependencia/${usuario.dependencia_id}`);
      } else {
        navigate("/");
      }
    }
  }, [usuario, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-md shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        <LoginForm />
      </div>
    </div>
  );
};

export default Home;
