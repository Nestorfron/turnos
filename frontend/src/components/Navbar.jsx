import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { usuario, logout } = useAppContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // Debug usuario
  useEffect(() => {
    console.log("Usuario en Navbar:", usuario);
  }, [usuario]);

  // Cerrar menú si clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Si no hay usuario, no mostrar navbar
  if (!usuario) return null;

  const inicial = usuario.nombre?.charAt(0).toUpperCase() || "?";

  return (
    <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center relative">
      <div className="text-xl font-bold">Mi App</div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => {
            console.log("Toggle menú");
            setOpen((o) => !o);
          }}
          className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg select-none"
          aria-label="Menú de usuario"
        >
          {inicial}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="font-semibold">{usuario.nombre}</p>
              <p className="text-xs text-gray-600 truncate">{usuario.email}</p>
            </div>
            <Link
              to="/perfil"
              className="block px-4 py-2 hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Ver perfil
            </Link>
            <button
              onClick={() => {
                console.log("Logout clickeado");
                logout();
                setOpen(false);
              }}
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
