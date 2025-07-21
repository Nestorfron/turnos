// src/pages/Home.jsx
import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import LoginForm from "../components/LoginForm.jsx";
import RegisterForm from "../components/RegisterFrom.jsx";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAppContext();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-md shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Iniciar Sesión" : "Registrarse"}
        </h1>

        {isLogin ? (
          <LoginForm login={login} />
        ) : (
          <RegisterForm />
        )}

        <p className="text-sm text-center mt-4">
          {isLogin ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => setIsLogin(false)}
                className="text-blue-600 hover:underline"
              >
                Registrarse
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => setIsLogin(true)}
                className="text-blue-600 hover:underline"
              >
                Iniciar Sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Home;
