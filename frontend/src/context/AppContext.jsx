// src/context/AppContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simula cargar usuario de localStorage o sesión
  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUsuario(userData);
    localStorage.setItem("usuario", JSON.stringify(userData));
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

  return (
    <AppContext.Provider value={{ usuario, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
