import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchData, putData, deleteData, postData } from "../utils/api";    
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import LicenciaModal from "../components/LicenciaModal.jsx";
import { estaTokenExpirado } from "../utils/tokenUtils.js";
import { Trash, Check  } from "lucide-react";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.locale("es");

const FuncionarioDetallePanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, logout } = useAppContext();

  const [funcionario, setFuncionario] = useState(null);
  const [licencias, setLicencias] = useState([]);
  const [licenciasSolicitadas, setLicenciasSolicitadas] = useState([]);
  const [licenciasMedicas, setLicenciasMedicas] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [guardias, setGuardias] = useState([]);
  

  const [anioSeleccionado, setAnioSeleccionado] = useState(dayjs().year());
  const aniosDisponibles = Array.from(
    { length: 6 },
    (_, i) => dayjs().year() - i
  );

  useEffect(() => {
    if (!usuario?.token) {
      navigate("/");
      return;
    }
    if (estaTokenExpirado(usuario.token)) {
      navigate("/");
    }  

    const cargarDatos = async () => {
      try {
        const func = await fetchData(`usuarios/${id}`);
        const lic = await fetchData(`usuarios/${id}/licencias`);
        const guardias = await fetchData(`/guardias`);
        const licenciasSolicitadas = await fetchData(`usuarios/${id}/licencias-solicitadas`);

        setGuardias(guardias);

        if (func) setFuncionario(func);
        if (lic) {
          setLicencias(lic.licencias || []);
          setLicenciasMedicas(lic.licencias_medicas || []);
          setLicenciasSolicitadas(licenciasSolicitadas.licencias_solicitadas || []);
        }
      } catch (error) {
        console.error("Error al cargar funcionario:", error);
      }

    };

    cargarDatos();
  }, [id, usuario, logout, navigate]);

  if (!funcionario) return <Loading />;

  const calcularDiasEnAnio = (inicio, fin) => {
    const start = dayjs(inicio).utc();
    const end = dayjs(fin).utc();

    const inicioAContar = start.isBefore(`${anioSeleccionado}-01-01`)
      ? dayjs(`${anioSeleccionado}-01-01`).utc()
      : start;

    const finAContar = end.isAfter(`${anioSeleccionado}-12-31`)
      ? dayjs(`${anioSeleccionado}-12-31`).utc()
      : end;

    const dias = finAContar.diff(inicioAContar, "day") + 1;
    return dias > 0 ? dias : 0;
  };

  const totalDiasLicencia = licencias.reduce(
    (acc, l) => acc + calcularDiasEnAnio(l.fecha_inicio, l.fecha_fin),
    0
  );

  const totalDiasLicenciaMedica = licenciasMedicas.reduce(
    (acc, l) => acc + calcularDiasEnAnio(l.fecha_inicio, l.fecha_fin),
    0
  );

  const totalPermitido = 30;
  const totalPermitidoMedica = 60;

  const diasRestantes = totalPermitido - totalDiasLicencia;
  const diasRestantesMedica = totalPermitidoMedica - totalDiasLicenciaMedica;

  const abrirModalLicencia = (licencia) => {
    setModalData({
      id: licencia.id,
      fechaInicio: licencia.fecha_inicio,
      fechaFin: licencia.fecha_fin,
      motivo: licencia.motivo,
      tipo: licencia.tipo,
    });
  };

  const handleSolicitudLicenciaSubmit = async ({ fechaInicio, fechaFin, motivo, esMedica }) => {
    try {
      const usuarioId = usuario.id;
      const fechaInicioDayjs = dayjs(fechaInicio).utc();
      const fechaFinDayjs = dayjs(fechaFin).utc();
  
      const nuevaLicencia = {
        usuario_id: usuarioId,
        fecha_inicio: fechaInicioDayjs.utc().format("YYYY-MM-DD"),
        fecha_fin: fechaFinDayjs.utc().format("YYYY-MM-DD"),
        motivo,
        estado: "pendiente", 
      };
  
      const endpoint = esMedica ? "licencias-medicas" : "licencias-solicitadas";
  
      const creada = await postData(endpoint, nuevaLicencia, usuario.token);
  
      if (creada) {
        const tipo = esMedica ? "licencia_medica" : "licencia-solicitada";
        setGuardias((prev) => [...prev, { ...creada, tipo }]); 
        setModalData(null);
  
        const ok = await fetchData(`usuarios/${usuarioId}/licencias-solicitadas`);
        if (ok) {
          setLicenciasSolicitadas(ok.licencias_solicitadas);
        }
      } else {
        console.error("❌ Error al guardar licencia");
      }
    } catch (error) {
      console.error("❌ Error en handleSolicitudLicenciaSubmit:", error);
    }
  };

  const eliminarLicencia = async (Licencia_id) => {
    const token = usuario.token;
    if (!token) return;
  
    const resp = await deleteData(`licencias/${Licencia_id}`, token);
    
    if (resp) {
      const ok = await fetchData(`usuarios/${id}/licencias`);
      if (ok) {
        setLicencias(ok.licencias);
      }
    } else {
      console.error("❌ No se pudo eliminar la licencia");
    }
  };
  

  const eliminarSolicitudLicencia = async (Licencia_id) => {
    const token = usuario.token;
    if (!token) return;
  
    const resp = await deleteData(`licencias-solicitadas/${Licencia_id}/`, token);
    
    if (resp) {
      const ok = await fetchData(`usuarios/${id}/licencias-solicitadas`);
      if (ok) {
        setLicenciasSolicitadas(ok.licencias_solicitadas);
      }
    } else {
      console.error("❌ No se pudo eliminar la licencia");
    }
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
            setGuardias((prev) => prev.filter((x) => x.id !== g.id));
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
  
      if (!creada) {
        console.error("❌ Error al guardar licencia");
        return;
      }
  
      eliminarSolicitudLicencia(licencia.id);
  
    
      const tipo = "licencia";
      setGuardias((prev) => [...prev, { ...creada, tipo }]);
      setLicencias((prev) => prev.filter((l) => l.id !== licencia.id));
      setModalData(null);
  
      const ok = await fetchData(`usuarios/${usuarioId}/licencias`);
      if (ok) {
        setLicencias(ok.licencias);
      }
    } catch (error) {
      console.error("❌ Error en handleAutorizarLicencia:", error);
    }
  };
  

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          G{funcionario.grado} {funcionario.nombre}
        </h2>
        <p>
          <strong>Correo:</strong> {funcionario.correo}
        </p>
        <p>
          <strong>Rol jerárquico:</strong> {funcionario.rol_jerarquico}
        </p>
        <p>
          <strong>Dependencia:</strong> {funcionario.dependencia_nombre || "-"}
        </p>
        <p>
          <strong>Turno:</strong> {funcionario.turno_nombre || "-"}
        </p>
        <p>
          <strong>Estado:</strong> {funcionario.estado || "-"}
        </p>
      </div>

      <div className="mb-4">
        <label className="font-semibold mr-2">Año:</label>
        <select
          className="border rounded px-3 py-1"
          value={anioSeleccionado}
          onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
        >
          {aniosDisponibles.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-blue-900">Licencias</h3>
          {usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA" && <button
            onClick={() => abrirModalLicencia(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            + Solicitar Licencia
          </button>}
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Autorizado</h3>
        {licencias.length > 0 ? (
          <ul className="space-y-2">
            {licencias.map((l) => (
              <li key={l.id} className="border p-3 rounded">
                <strong>
                  {dayjs(l.fecha_inicio).utc().format("DD/MM/YYYY")} -{" "}
                  {dayjs(l.fecha_fin).utc().format("DD/MM/YYYY")}
                </strong>
                <p>Motivo: {l.motivo}</p>
                <p>Estado: {l.estado}</p>
                {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && <button
                  onClick={() => eliminarLicencia(l.id)}
                  className="flex ms-auto text-red-500 hover:text-red-600"
                >
                  <Trash size={18} />
                </button>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay licencias registradas.</p>
        )}
        <p className="mt-4 font-medium">
          Días utilizados en {anioSeleccionado}: {totalDiasLicencia}
        </p>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6"> 
        <h3 className="text-xl font-semibold text-blue-900 mb-4">
          Solicitado
        </h3>
        {licenciasSolicitadas.length > 0 ? (
          <ul className="space-y-2">
            {licenciasSolicitadas.map((l) => (
              <li key={l.id} className="border p-3 rounded">
                <strong>
                  {dayjs(l.fecha_inicio).utc().format("DD/MM/YYYY")} -{" "}
                  {dayjs(l.fecha_fin).utc().format("DD/MM/YYYY")}
                </strong>
                <p>Motivo: {l.motivo}</p>
                <p>Estado: {l.estado}</p>
               <div className="flex justify-end gap-6">
               <button
                  onClick={() => eliminarSolicitudLicencia(l.id)}
                  className="flex text-red-500 hover:text-red-600"
                >
                  <Trash size={18} />
                </button>
                {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && <button
                  onClick={() => handleAutorizarLicencia(l)}
                  className="flex text-green-500 hover:text-green-600"
                >
                  <Check size={18} />
                </button>}
               </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay licencias solicitadas registradas.</p>
        )}
      </div>

      <div className="bg-white rounded shadow p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">
          Médicas
        </h3>
        {licenciasMedicas.length > 0 ? (
          <ul className="space-y-2">
            {licenciasMedicas.map((l) => (
              <li key={l.id} className="border p-3 rounded">
                <strong>
                  {dayjs(l.fecha_inicio).utc().format("DD/MM/YYYY")} -{" "}
                  {dayjs(l.fecha_fin).utc().format("DD/MM/YYYY")}
                </strong>
                <p>Motivo: {l.motivo}</p>
                <p>Estado: {l.estado}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay licencias médicas registradas.</p>
        )}
        <p className="mt-4 font-medium">
          Días utilizados en {anioSeleccionado}: {totalDiasLicenciaMedica}
        </p>
      </div>

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
      {modalData && (
        <LicenciaModal
          usuario={modalData.usuario}
          fechaInicio={modalData.fechaInicio}
          fechaFinInicial={modalData.fechaFinInicial}
          motivoInicial={modalData.motivoInicial}
          esMedicaInicial={modalData.esMedicaInicial}
          onClose={() => setModalData(null)}
          onSubmit={handleSolicitudLicenciaSubmit}
        />
      )}
    </div>
  );
};

export default FuncionarioDetallePanel;
