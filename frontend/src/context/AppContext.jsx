import React, { createContext, useState, useEffect, useContext } from "react";
import { fetchData } from "../utils/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes ] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const getSolicitudes = async () => {
    const res = await fetchData("licencias-solicitadas", usuario?.token);
    setSolicitudes(res);
  };

  const getNotificaciones = async () => {
    const res = await fetchData("notificaciones" + (usuario?.id ? `/usuario/${usuario.id}` : ""));
    setNotificaciones(res.notificaciones);
  };

  const login = (userData) => {
    setUsuario(userData);
    localStorage.setItem("usuario", JSON.stringify(userData));
    getSolicitudes();
    getNotificaciones();
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

 

  return (
    <AppContext.Provider value={{ usuario, login, logout, notificaciones, loading, solicitudes, getNotificaciones, getSolicitudes }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
