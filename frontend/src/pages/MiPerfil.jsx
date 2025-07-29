import React, { useState, useEffect } from "react";
import { Users, Edit2, Key, Home } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { cambiarPassword } from "../utils/api";

export default function MiPerfil() {
  const { usuario, login, logout } = useAppContext();
  const navigate = useNavigate();

  const [editCorreo, setEditCorreo] = useState(false);
  const [tempCorreo, setTempCorreo] = useState(usuario?.correo || "");
  const [loadingCorreo, setLoadingCorreo] = useState(false);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);

  // Sincronizar tempCorreo con usuario actualizado
  useEffect(() => {
    setTempCorreo(usuario?.correo || "");
  }, [usuario]);

  if (!usuario) return <p>Cargando usuario...</p>;

  const handleCorreoSave = async () => {
    if (!tempCorreo.trim()) {
      alert("El correo no puede estar vacío");
      return;
    }

    try {
      setLoadingCorreo(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/usuarios/${usuario.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuario.token}`,
          },
          body: JSON.stringify({ correo: tempCorreo }),
        }
      );

      if (res.ok) {
        const updatedUser = await res.json();
        login({ token: usuario.token, usuario: updatedUser });
        alert("✅ Correo actualizado correctamente");
        setEditCorreo(false);
      } else {
        const data = await res.json();
        alert(`❌ Error: ${data.error || "No se pudo actualizar"}`);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Error inesperado");
    } finally {
      setLoadingCorreo(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      alert("Por favor completa todos los campos de contraseña");
      return;
    }
  
    if (newPass !== confirmPass) {
      alert("La nueva contraseña y su confirmación no coinciden");
      return;
    }
  
    try {
      setLoadingPass(true);
  
      const payload = {
        current_password: currentPass,
        new_password: newPass,
        confirm_password: confirmPass,
      };
  
      const res = await cambiarPassword(usuario.id, payload, usuario.token);
  
      alert("✅ Contraseña actualizada correctamente");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      // Aquí mostramos el mensaje del backend capturado
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoadingPass(false);
    }
  };
  

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("❌ Error inesperado");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6">
      {/* Icono y nombre */}
      <div className="flex flex-col items-center space-y-2">
        <Users size={48} className="text-blue-600" />
        <h1 className="text-xl font-bold">{usuario.nombre}</h1>
        <p className="text-gray-500">{usuario.grado}</p>
      </div>

      {/* Datos básicos */}
      <div>
        <p>
          <strong>Grado:</strong> {usuario.Grado}
        </p>
        <p>
          <strong>Rol jerárquico:</strong> {usuario.rol_jerarquico}
        </p>
        <p>
          <strong>Dependencia:</strong>{" "}
          {usuario.dependencia_nombre || "No asignada"}
        </p>
        <p>
          <strong>Estado:</strong> {usuario.estado || "No especificado"}
        </p>
      </div>

      {/* Correo editable */}
      <div>
        <h2 className="text-lg font-semibold mb-1">Correo</h2>
        {editCorreo ? (
          <div className="flex space-x-2 items-center">
            <input
              type="email"
              value={tempCorreo}
              onChange={(e) => setTempCorreo(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 flex-grow"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCorreoSave();
                if (e.key === "Escape") {
                  setTempCorreo(usuario.correo);
                  setEditCorreo(false);
                }
              }}
            />
            <button
              onClick={handleCorreoSave}
              disabled={loadingCorreo}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Guardar
            </button>
            <button
              onClick={() => {
                setTempCorreo(usuario.correo);
                setEditCorreo(false);
              }}
              className="text-gray-600 px-2 hover:text-gray-900"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span>{usuario.correo}</span>
            <button
              onClick={() => setEditCorreo(true)}
              aria-label="Editar correo"
              className="text-blue-600 hover:text-blue-800"
              title="Editar correo"
            >
              <Edit2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Cambio de contraseña */}
      <div>
        <h2 className="text-lg font-semibold mb-1 flex items-center space-x-2">
          <Key size={20} /> <span>Cambiar contraseña</span>
        </h2>
        <input
          type="password"
          placeholder="Contraseña actual"
          value={currentPass}
          onChange={(e) => setCurrentPass(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
        />
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
        />
        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-3"
        />
        <button
          onClick={handleChangePassword}
          disabled={loadingPass}
          className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700"
        >
          {loadingPass ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </div>

      {/* Botón cerrar sesión */}
      <button
        onClick={handleLogout}
        className="bg-gray-600 text-white w-full py-2 rounded hover:bg-gray-800"
      >
        Cerrar sesión
      </button>
      <button
        onClick={() =>
          usuario.rol_jerarquico === "JEFE_ZONA"
            ? navigate("/jefe-zona")
            : navigate("/dependencia/" + usuario.dependencia_id)
        }
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Inicio
      </button>
    </div>
  );
}
