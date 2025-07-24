import React, { createContext, useState, useEffect, useContext } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); // { token, id, nombre, correo, rol_jerarquico, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userWithToken = { token: userData.token, ...userData.usuario };
    setUsuario(userWithToken);
    localStorage.setItem("usuario", JSON.stringify(userWithToken));
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
