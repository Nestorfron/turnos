import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchData } from "../utils/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [ solicitudes, setSolicitudes ] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
    const fetchSolicitudes = async () => {
      const res = await fetchData("licencias-solicitadas", usuario?.token);
      setSolicitudes(res);
    };
    fetchSolicitudes();
    setLoading(false);
  }, []);

  const getSolicitudes = async () => {
    const res = await fetchData("licencias-solicitadas", usuario?.token);
    setSolicitudes(res);
  };

  const login = (userData) => {
    setUsuario(userData);
    localStorage.setItem("usuario", JSON.stringify(userData));
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

 

  return (
    <AppContext.Provider value={{ usuario, login, logout, getSolicitudes, loading, solicitudes }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
