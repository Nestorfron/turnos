import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { fetchData, putData } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { deleteData, postData } from "../utils/api";
import { estaTokenExpirado } from "../utils/tokenUtils.js";
import dayjs from "dayjs";
import { Trash, Check } from "lucide-react";
import Loading from "../components/Loading";

const SolicitudesLicencia = () => {
  const { usuario, solicitudes, getSolicitudes } = useAppContext();
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardias, setGuardias] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) {
      navigate("/");
      return;
    }

    if (estaTokenExpirado(usuario?.token)) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem("usuario");
      navigate("/");
      return;
    }

    const cargarDatos = async () => {
      try {
        const usuarios = await fetchData("usuarios", usuario.token);
        if (usuarios) setFuncionarios(usuarios);
        const todasGuardias = await fetchData("guardias", usuario.token);
        if (todasGuardias) setGuardias(todasGuardias);
        getSolicitudes();
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    cargarDatos();
    setLoading(false);
  }, [usuario, navigate]);

  const getFuncionario = (id) => {
    const filtrado = funcionarios.find((f) => f.id === id);
    return "G" + filtrado?.grado + " " + filtrado?.nombre || "Desconocido";
  };

  const handleAutorizarLicencia = async (licencia) => {
    try {
      const usuarioId = licencia.usuario_id;
      const fechaInicioDayjs = dayjs(licencia.fecha_inicio);
      const fechaFinDayjs = dayjs(licencia.fecha_fin);

      const guardiasAEliminar = guardias.filter((g) => {
        if (g.usuario_id !== usuarioId || g.tipo !== "guardia") return false;

        const inicio = dayjs.utc(g.fecha_inicio);
        const fin = dayjs.utc(g.fecha_fin);

        return (
          inicio.isSameOrBefore(fechaFinDayjs, "day") &&
          fin.isSameOrAfter(fechaInicioDayjs, "day")
        );
      });

      await Promise.all(
        guardiasAEliminar.map(async (g) => {
          const ok = await deleteData(`guardias/${g.id}`, usuario.token);
          if (ok) {
            return true;
          } else {
            console.error("❌ Error al eliminar guardia", g.id);
          }
        })
      );

      const nuevaLicencia = {
        usuario_id: usuarioId,
        fecha_inicio: fechaInicioDayjs.utc().format("YYYY-MM-DD"),
        fecha_fin: fechaFinDayjs.utc().format("YYYY-MM-DD"),
        motivo: licencia.motivo,
        estado: "activo",
      };

      const creada = await postData("licencias", nuevaLicencia, usuario.token);
      eliminarSolicitudLicencia(licencia.id);
      if (creada) {
        const tipo = creada.es_medica ? "licencia_medica" : "licencia";
        getSolicitudes();
      } else {
        console.error("❌ Error al guardar licencia");
      }
    } catch (error) {
      console.error("❌ Error en handleAutorizarLicencia:", error);
    }
  };

  const eliminarSolicitudLicencia = async (Licencia_id) => {
    const token = usuario.token;
    if (!token) return;

    const resp = await deleteData(
      `licencias-solicitadas/${Licencia_id}/`,
      token
    );
    if (resp) {
      getSolicitudes();
    } else {
      console.error("❌ No se pudo eliminar la licencia");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="bg-white rounded shadow p-6 mb-6">
      <h3 className="text-xl font-semibold text-blue-900 mb-4">Solicitudes</h3>
      {solicitudes.length > 0 ? (
        <ul className="space-y-2">
          {solicitudes.map((l) => (
            <li key={l.id} className="border p-3 rounded">
              <strong>
                {dayjs(l.fecha_inicio).format("DD/MM/YYYY")} -{" "}
                {dayjs(l.fecha_fin).format("DD/MM/YYYY")}
              </strong>
              <p>Solicitante: {getFuncionario(l.usuario_id)}</p>
              <p>Motivo: {l.motivo}</p>
              <p>Estado: {l.estado}</p>

              <div className="flex justify-end gap-6">
                <button
                  onClick={() => eliminarSolicitudLicencia(l.id)}
                  className="flex text-red-500 hover:text-red-600"
                >
                  <Trash size={18} />
                </button>
                {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && (
                  <button
                    onClick={() => handleAutorizarLicencia(l)}
                    className="flex text-green-500 hover:text-green-600"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay licencias solicitadas registradas.</p>
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

export default SolicitudesLicencia;
