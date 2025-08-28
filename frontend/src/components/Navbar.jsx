import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import img from "../assets/logo.png";


const Navbar = () => {
  const { usuario, logout, solicitudes, notificaciones  } = useAppContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const [ allSolicitudes, setAllSolicitudes ] = useState([]);
  const [ allNotificaciones, setAllNotificaciones ] = useState([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    setAllSolicitudes(solicitudes);
    setAllNotificaciones(notificaciones);
  }, [usuario, notificaciones, solicitudes]);

  if (!usuario) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const inicial = usuario.nombre?.charAt(0).toUpperCase() || "?";

  const NotificacionesSinLeer = allNotificaciones?.filter((n) => !n.is_read);

  

  return (
    <nav className={usuario ? "bg-blue-700 text-white px-6 py-3 flex justify-between items-center relative" : "d-none"}>
      <div className="flex items-center max-w-xs md:max-w-md lg:max-w-lg">
        <Link to="/" className="block w-full">
          <img src={img} alt="Logo" className="w-auto h-12" />
        </Link>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg select-none relative"
          aria-label="Menú de usuario"
        >
          {inicial}
          {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && (
            <span className={allSolicitudes.length !== 0 ? "absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full" : "hidden"}>
              {allSolicitudes.length}
            </span>
          )}
          {usuario?.rol_jerarquico === "FUNCIONARIO" && (
            <span className={NotificacionesSinLeer?.length !== 0 ? "absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full" : "hidden"}>
              {NotificacionesSinLeer?.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-gray-600 truncate">{usuario.correo}</p>
            </div>
            {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && <button
              onClick={() => {
                setOpen(false);
                navigate("/solicitudes-licencia");
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
             Solicitudes {allSolicitudes.length > 0 ? `(${allSolicitudes.length})` : ""}
            </button>}
            {usuario?.rol_jerarquico === "FUNCIONARIO" && <button
              onClick={() => {
                setOpen(false);
                navigate("/notificaciones");
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
             Notificaciones {NotificacionesSinLeer?.length > 0 ? `(${NotificacionesSinLeer?.length})` : ""}
            </button>}
            <Link
              to="/mi-perfil"
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Ver perfil
            </Link>
            <button
              onClick={() => handleLogout()}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
