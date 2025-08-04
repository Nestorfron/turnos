import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import { fetchData, putData } from "../utils/api";
import { Pencil, Home } from "lucide-react";
import AsignarTurnoModal from "../components/AsignarTurnoModal";
import { estaTokenExpirado } from "../utils/tokenUtils.js";

const EscalafonServicio = () => {
  const { usuario, logout } = useAppContext();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [cantidadFuncionarios, setCantidadFuncionarios] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cargandoGuardias, setCargandoGuardias] = useState(true);
  const [cargandoLicencias, setCargandoLicencias] = useState(true);

  const [startDate, setStartDate] = useState(dayjs());

  const diaActual = useMemo(() => startDate, [startDate]);

  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  const abrirModalEditarAsignacion = useCallback((funcionario) => {
    setAsignacionSeleccionada({
      usuario_id: funcionario.id,
      turno_id: funcionario.turno_id || "",
      estado: funcionario.estado || "",
    });
    setAsignarModalOpen(true);
  }, []);

  const handleGuardarAsignacion = async (asignacionForm) => {
    try {
      const resultado = await putData(
        `usuarios/${asignacionForm.usuario_id}`,
        {
          turno_id: asignacionForm.turno_id,
          estado: asignacionForm.estado,
        },
        usuario?.token
      );

      if (resultado) {
        setFuncionarios((prev) =>
          prev.map((f) => (f.id === resultado.id ? resultado : f))
        );
      }

      setAsignarModalOpen(false);
    } catch (error) {
      console.error("Error guardando asignación:", error);
    }
  };

  useEffect(() => {
    if (estaTokenExpirado(usuario.token)) {
      logout();
      navigate("/");
    }
    const cargarDependencia = async () => {
      try {
        if (location.state?.sec) {
          const dep = location.state.sec;
          const jefe = dep.usuarios?.find(
            (u) => u.rol_jerarquico === "JEFE_DEPENDENCIA"
          );
          const funcs =
            dep.usuarios?.filter(
              (u) => u.rol_jerarquico !== "JEFE_DEPENDENCIA"
            ) || [];
          setDependencia({
            id: dep.id,
            nombre: dep.nombre,
            descripcion: dep.descripcion,
            jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          });
          setFuncionarios(funcs);
          setTurnos(dep.turnos || []);
          setCantidadFuncionarios(dep.usuarios?.length || 0);
        } else {
          const deps = await fetchData("dependencias");
          if (!deps) return;

          let dep = usuario?.dependencia_id
            ? deps.find((d) => d.id === usuario.dependencia_id)
            : deps.find((d) => d.id === parseInt(id, 10));
          if (!dep) return;

          const jefe = dep.usuarios?.find(
            (u) => u.rol_jerarquico === "JEFE_DEPENDENCIA"
          );
          const funcs =
            dep.usuarios?.filter(
              (u) => u.rol_jerarquico !== "JEFE_DEPENDENCIA"
            ) || [];

          setDependencia({
            id: dep.id,
            nombre: dep.nombre,
            descripcion: dep.descripcion,
            jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          });
          setFuncionarios(funcs);
          const ordenDeseado = [
            "primer turno",
            "brou",
            "segundo turno",
            "tercer turno",
            "destacados",
          ];
          const turnosOrdenados = [...dep.turnos].sort((a, b) => {
            const nombreA = a.nombre.trim().toLowerCase();
            const nombreB = b.nombre.trim().toLowerCase();
            const ia = ordenDeseado.indexOf(nombreA);
            const ib = ordenDeseado.indexOf(nombreB);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
          });
          setTurnos(turnosOrdenados);
          setCantidadFuncionarios(dep.usuarios?.length || 0);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error cargando dependencia:", error);
        setIsLoading(false);
      }
    };

    cargarDependencia();
  }, [usuario, id, location.state]);

  useEffect(() => {
    const cargarGuardias = async () => {
      const g = await fetchData("guardias", usuario?.token);
      setGuardias(g || []);
      setCargandoGuardias(false);
    };
    const cargarLicencias = async () => {
      const l = await fetchData("licencias", usuario?.token);
      setLicencias(l || []);
      setCargandoLicencias(false);
    };
    cargarGuardias();
    cargarLicencias();
  }, [usuario?.token]);

  const getCelda = useCallback(
    (usuario, dia) => {
      const fecha = dia.format("YYYY-MM-DD");
      const licencia = licencias.find(
        (lic) =>
          lic.usuario_id === usuario.id &&
          fecha >= dayjs(lic.fecha_inicio).utc().format("YYYY-MM-DD") &&
          fecha <= dayjs(lic.fecha_fin).utc().format("YYYY-MM-DD")
      );
      if (licencia) return "Licencia";

      const registro = guardias.find(
        (g) =>
          g.usuario_id === usuario.id &&
          fecha >= dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD") &&
          fecha <= dayjs(g.fecha_fin).utc().format("YYYY-MM-DD")
      );
      if (registro) {
        if (registro.tipo === "guardia" || registro.tipo === "T")
          return "En Servicio";
        if (registro.tipo === "descanso") return "Descanso";
        return registro.tipo;
      }
    },
    [licencias, guardias]
  );

  const funcionariosOrdenados = useMemo(
    () => [...funcionarios].sort((a, b) => (b.grado || 0) - (a.grado || 0)),
    [funcionarios]
  );

  const funcionariosPorTurno = useCallback(
    (turnoId) =>
      funcionarios
        .filter(
          (f) =>
            f.turno_id === turnoId &&
            f.estado?.toLowerCase() === "activo"
        )
        .sort((a, b) => (b.grado || 0) - (a.grado || 0)),
    [funcionarios]
  );
  

  if (isLoading || cargandoGuardias || cargandoLicencias || !dependencia)
    return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <div className="bg-white rounded-md shadow p-6 mb-4">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            {dependencia.nombre}
          </h2>
          <p>
            <strong>Jefe:</strong> {dependencia.jefe_nombre}
          </p>
          <p>
            <strong>Descripción:</strong> {dependencia.descripcion || "-"}
          </p>
          <p>
            <strong>Total de funcionarios:</strong> {cantidadFuncionarios}
          </p>
        </div>
        {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && (
          <Link
            to={`/guardias`}
            state={{ sec: dependencia }}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Ver Escalafón
          </Link>
        )}
      </header>

      <main className="space-y-10">
        <div className="flex  items-center mb-8">
          <label className="mr-2 font-semibold text-blue-900">Fecha:</label>
          <input
            type="date"
            value={startDate.format("YYYY-MM-DD")}
            onChange={(e) => setStartDate(dayjs(e.target.value))}
            className="border rounded px-2 py-1"
          />
          <Home
            size={18}
            className="mx-2 cursor-pointer"
            onClick={() => setStartDate(dayjs())}
          />
        </div>

        {turnos.map((turno) => {
          const lista = funcionariosPorTurno(turno.id);
          return (
            <section
              key={turno.id}
              className="bg-white rounded shadow p-4 overflow-x-auto mb-6"
            >
              <h2 className="text-xl font-bold text-blue-900 mb-2">
                {turno.nombre}
              </h2>
              <table className="min-w-full border border-gray-300 text-sm text-center">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1 w-20">Grado</th>
                    <th className="border px-2 py-1 w-60 min-w-[15rem]">
                      Nombres
                    </th>
                    <th className="border px-2 py-1 w-32">
                      {startDate.format("DD/MM/YYYY")}
                    </th>
                    <th className="border px-2 py-1 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-4 text-gray-500"
                      >
                        No hay funcionarios asignados a este turno.
                      </td>
                    </tr>
                  ) : (
                    lista.map((f) => {
                      const valor = getCelda(f, diaActual);
                      let bg = "",
                        text = "text-black",
                        fw = "font-normal",
                        ts = "text-sm";
                      if (valor === "Descanso") {
                        bg = "bg-black";
                        text = "text-white";
                        fw = "font-bold";
                      } else if (valor === "Licencia") {
                        bg = "bg-green-600";
                        text = "text-white";
                        fw = "font-bold";
                      } else if (valor === "En Servicio") {
                        bg = "bg-white";
                      } else if (["1ro", "2do", "3er"].includes(valor)) {
                        bg = "bg-blue-600";
                        text = "text-white";
                        fw = "font-bold";
                      } else if (valor === "CURSO") {
                        bg = "bg-green-600";
                        text = "text-white";
                        fw = "font-bold";
                        ts = "text-xs";
                      } else if (valor === "BROU") {
                        ts = "text-xs";
                      } else if (valor === "CUSTODIA") {
                        bg = "bg-blue-600";
                        text = "text-white";
                        fw = "font-bold";
                        ts = "text-xs";
                      }else if (valor === "CH") {
                        bg = "bg-green-600";
                        text = "text-white";
                        fw = "font-bold";
                        ts = "text-xs";
                      }else if (valor === "L.Ext") {
                        bg = "bg-green-600";
                        text = "text-white";
                        fw = "font-bold";
                        ts = "text-xs";
                      }else if (valor === "-") {
                        bg = "bg-gray-300";
                        text = "text-gray-300";
                        fw = "font-normal";
                        ts = "text-xs";
                      }return (
                        <tr key={f.id}>
                          <td className="border px-2 text-center w-20">
                            G{f.grado}
                          </td>
                          <td className="border px-2 text-left whitespace-nowrap w-48">
                            {f.nombre}
                          </td>
                          <td
                            className={`border py-1 h-5 ${bg} ${text} ${fw} ${ts}`}
                          >
                            {valor}
                          </td>
                          <td className="border px-2 py-1">
                            {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ? (
                              <button
                                onClick={() => abrirModalEditarAsignacion(f)}
                                className="m-auto p-1 text-yellow-600 rounded"
                              >
                                <Pencil size={18} />
                              </button>
                            ) : (
                              <span className="text-gray-500">
                                Sin acciones.
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          );
        })}

        {/* Tabla General */}
        <section className="bg-white rounded shadow p-4 mt-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">
            Listado General del Personal
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Grado</th>
                  <th className="border px-3 py-2">Nombre</th>
                  <th className="border px-3 py-2">Estado</th>
                  <th className="border px-3 py-2">Turno</th>
                  <th className="border px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {funcionariosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No hay funcionarios registrados.
                    </td>
                  </tr>
                ) : (
                  funcionariosOrdenados.map((f) => {
                    const turnoNombre =
                      turnos.find((t) => t.id === f.turno_id)?.nombre ||
                      "Sin asignar";
                    return (
                      <tr key={f.id} className="even:bg-gray-50">
                        <td className="border px-3 py-2">G{f.grado}</td>
                        <td className="border px-3 py-2">{f.nombre}</td>
                        <td className="border px-3 py-2">
                          <span
                            className={
                              f.estado?.toLowerCase() === "activo"
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            {f.estado || "Sin estado"}
                          </span>
                        </td>
                        <td className="border px-3 py-2">{turnoNombre}</td>
                        <td className="flex border px-3 py-2">
                          {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ? (
                            <button
                              onClick={() => abrirModalEditarAsignacion(f)}
                              className="m-auto p-1 text-yellow-600 rounded"
                            >
                              <Pencil size={18} />
                            </button>
                          ) : (
                            <span className="text-gray-500">Sin acciones.</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {asignarModalOpen && (
        <AsignarTurnoModal
          funcionarios={funcionarios}
          turnos={turnos}
          asignacion={asignacionSeleccionada}
          isEdit={true}
          onClose={() => setAsignarModalOpen(false)}
          onSubmit={handleGuardarAsignacion}
        />
      )}

      {usuario?.rol_jerarquico === "JEFE_ZONA" && (
        <button
          onClick={() => navigate("/jefe-zona")}
          className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
        >
          ← Volver
        </button>
      )}
      {usuario?.rol_jerarquico === "ADMINISTRADOR" && (
        <button
          onClick={() => navigate("/admin")}
          className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
        >
          ← Volver
        </button>
      )}
    </div>
  );
};

export default EscalafonServicio;
