import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchData } from "../utils/api";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import dayjs from "dayjs";

const FuncionarioDetallePanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, logout } = useAppContext();

  const [funcionario, setFuncionario] = useState(null);
  const [licencias, setLicencias] = useState([]);
  const [licenciasMedicas, setLicenciasMedicas] = useState([]);

  useEffect(() => {
    if (!usuario?.token) {
      logout();
      navigate("/");
      return;
    }

    const cargarDatos = async () => {
      try {
        const func = await fetchData(`usuarios/${id}`);
        const lic = await fetchData(`usuarios/${id}/licencias`);

        if (func) setFuncionario(func);
        if (lic) {
          setLicencias(lic.licencias || []);
          setLicenciasMedicas(lic.licencias_medicas || []);
        }
      } catch (error) {
        console.error("Error al cargar funcionario:", error);
      }
    };

    cargarDatos();
  }, [id, usuario, logout, navigate]);

  if (!funcionario) return <Loading />;

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          G{funcionario.grado} {funcionario.nombre}
        </h2>
        <p><strong>Correo:</strong> {funcionario.correo}</p>
        <p><strong>Rol jerárquico:</strong> {funcionario.rol_jerarquico}</p>
        <p><strong>Dependencia:</strong> {funcionario.dependencia_nombre || "-"}</p>
        <p><strong>Zona:</strong> {funcionario.zona_nombre || "-"}</p>
        <p><strong>Turno:</strong> {funcionario.turno_nombre || "-"}</p>
        <p><strong>Estado:</strong> {funcionario.estado || "-"}</p>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Licencias</h3>
        {licencias.length > 0 ? (
          <ul className="space-y-2">
            {licencias.map((l) => (
              <li key={l.id} className="border p-3 rounded">
                <strong>{dayjs(l.fecha_inicio).format("DD/MM/YYYY")} - {dayjs(l.fecha_fin).format("DD/MM/YYYY")}</strong>
                <p>Motivo: {l.motivo}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay licencias registradas.</p>
        )}
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Licencias Médicas</h3>
        {licenciasMedicas.length > 0 ? (
          <ul className="space-y-2">
            {licenciasMedicas.map((l) => (
              <li key={l.id} className="border p-3 rounded">
                <strong>{dayjs(l.fecha_inicio).format("DD/MM/YYYY")} - {dayjs(l.fecha_fin).format("DD/MM/YYYY")}</strong>
                <p>Motivo: {l.motivo}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay licencias médicas registradas.</p>
        )}
      </div>
    </div>
  );
};

export default FuncionarioDetallePanel;