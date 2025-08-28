import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { putData } from "../utils/api";
import Table from "../components/Table";
import Loading from "../components/Loading";
import { estaTokenExpirado } from "../utils/tokenUtils";

const NotificacionesPage = () => {
  const { usuario, notificaciones, getNotificaciones } = useAppContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allNotificaciones, setAllNotificaciones] = useState([]);

  useEffect(() => {
    if (!usuario) return;
    notificaciones ? setAllNotificaciones(notificaciones) : getNotificaciones();
    setLoading(false);
  }, [notificaciones, usuario]);

  useEffect(() => {
    if (estaTokenExpirado(usuario?.token)) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem("usuario");
      navigate("/");
      return;
    }
  }, [usuario, navigate]);

  const marcarLeida = async (not) => {
    try {
      const updated = await putData(
        `notificaciones/${not.id}`,
        { is_read: true },
        usuario.token
      );
      if (updated) {
        getNotificaciones();
      }
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  const NotificacionesSinLeer =
    allNotificaciones.filter((n) => !n.is_read) || [];

  const columnas = ["Mensaje"];

  return (
    <div className="p-6">
      {loading ? (
        <Loading />
      ) : (
        <Table
          columns={columnas}
          data={NotificacionesSinLeer.map((n) => ({
            id: n.id,
            mensaje: n.mensaje,
          }))}
          marcarLeida={marcarLeida}
          searchable={true}
          title="Mis notificaciones"
        />
      )}
      <button
        onClick={() =>
          usuario?.rol_jerarquico === "JEFE_DEPENDENCIA"
            ? navigate("/escalafon-servicio")
            : navigate("/funcionario/" + usuario.id)
        }
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>
    </div>
  );
};

export default NotificacionesPage;
