import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import { fetchData, putData } from "../utils/api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AsignarTurnoModal from "../components/AsignarTurnoModal";

const EscalafonServicio = () => {
  const { usuario } = useAppContext();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [cantidadFuncionarios, setCantidadFuncionarios] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [licencias, setLicencias] = useState([]);

  const [daysToShow, setDaysToShow] = useState(7);
  const [startDate, setStartDate] = useState(dayjs());
  const dias = Array.from({ length: daysToShow }, (_, i) =>
    startDate.clone().add(i, "day")
  );
  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  const abrirModalNuevaAsignacion = (funcionario) => {
    setAsignacionSeleccionada({
      usuario_id: funcionario.id,
      turno_id: funcionario.turno_id || "",
      estado: funcionario.estado || "",
    });
    setAsignarModalOpen(true);
  };

  const abrirModalEditarAsignacion = (funcionario) => {
    setAsignacionSeleccionada({
      usuario_id: funcionario.id,
      turno_id: funcionario.turno_id || "",
      estado: funcionario.estado || "",
    });
    setAsignarModalOpen(true);
  };

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
          const f = [...funcs].sort((a, b) => (b.grado || 0) - (a.grado || 0));
          setFuncionarios(f);

          setDependencia({
            id: dep.id,
            nombre: dep.nombre,
            descripcion: dep.descripcion,
            jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          });

          setTurnos(dep.turnos || []);
          setCantidadFuncionarios(dep.usuarios?.length || 0);
          setIsLoading(false);

          const g = await fetchData("guardias", usuario?.token);
          setGuardias(g || []);

          const l = await fetchData("licencias", usuario?.token);
          setLicencias(l || []);

          return;
        }

        const deps = await fetchData("dependencias");
        if (!deps) return;

        let dep;
        if (usuario?.dependencia_id) {
          dep = deps.find((d) => d.id === usuario.dependencia_id);
        } else {
          dep = deps.find((d) => d.id === parseInt(id, 10));
        }
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

        setTurnos(dep.turnos || []);
        setFuncionarios(funcs);
        setCantidadFuncionarios(dep.usuarios?.length || 0);

        const g = await fetchData("guardias", usuario?.token);
        setGuardias(g || []);

        const l = await fetchData("licencias", usuario?.token);
        setLicencias(l || []);

        setIsLoading(false);
      } catch (error) {
        console.error("Error cargando dependencia:", error);
        setIsLoading(false);
      }
    };

    cargarDependencia();
  }, [usuario, id, location.state]);

  const getCelda = (usuario, dia) => {
    const fecha = dia.format("YYYY-MM-DD");

    // Primero chequea si el usuario tiene licencia en ese día
    const licencia = licencias.find((lic) => {
      if (lic.usuario_id !== usuario.id) return false;

      const inicio = dayjs(lic.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(lic.fecha_fin).utc().format("YYYY-MM-DD");

      return fecha >= inicio && fecha <= fin;
    });

    if (licencia) return "Licencia";

    // Luego chequea guardias
    const registro = guardias.find((g) => {
      if (g.usuario_id !== usuario.id) return false;

      const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
      const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");

      return fecha >= inicio && fecha <= fin;
    });

    if (registro) {
      if (registro.tipo === "guardia" || registro.tipo === "T")
        return "En Servicio";
      return registro.tipo;
    }

    return "Descanso";
  };

  // Funciones auxiliares para la tabla principal
  const funcionariosPorTurno = (turnoId) =>
    funcionarios
      .filter((f) => f.turno_id === turnoId)
      .sort((a, b) => (b.grado || 0) - (a.grado || 0));

  // Funciones para tabla de Turnos actuales
  const abrirModalNuevoTurno = () => {
    console.log("Abrir modal nuevo turno");
  };

  const abrirModalEditarTurno = (turno) => {
    console.log("Editar turno:", turno);
  };

  const handleBorrarTurno = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este turno?")) {
      console.log("Eliminar turno con ID:", id);
    }
  };

  if (isLoading || !dependencia) return <Loading />;

  const hoy = new Date();
  const hoyStr = hoy.toISOString().slice(0, 10);

  const diaActual = dias.find((d) => {
    if (typeof d.format === "function") {
      return d.format("YYYY-MM-DD") === hoyStr;
    }
    if (d instanceof Date) {
      return d.toISOString().slice(0, 10) === hoyStr;
    }
    return false;
  });

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
        {/* Tabla Turnos Actuales */}
        <section className="bg-white rounded shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-900 mb-2 md:mb-0">
              Turnos Actuales
            </h3>

            {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && (
              <button
                onClick={abrirModalNuevoTurno}
                className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA"}
                aria-disabled={usuario?.rol_jerarquico !== "JEFE_DEPENDENCIA"}
              >
                <Plus size={18} /> Agregar
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Nombre</th>
                  <th className="border px-3 py-2">Hora Inicio</th>
                  <th className="border px-3 py-2">Hora Fin</th>
                  <th className="border px-3 py-2">Descripción</th>
                  <th className="border px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      No hay turnos disponibles.
                    </td>
                  </tr>
                )}
                {turnos.map((t) => (
                  <tr key={t.id} className="even:bg-gray-50">
                    <td className="border px-3 py-2">{t.nombre}</td>
                    <td className="border px-3 py-2">
                      {t.hora_inicio?.slice(0, 5)}
                    </td>
                    <td className="border px-3 py-2">
                      {t.hora_fin?.slice(0, 5)}
                    </td>
                    <td className="border px-3 py-2">{t.descripcion || "-"}</td>
                    <td className="border px-3 py-2">
                      <div className="flex gap-2">
                        {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ? (
                          <>
                            <button
                              onClick={() => abrirModalEditarTurno(t)}
                              className="m-auto p-1 hover:bg-yellow-200 rounded"
                              title="Editar turno"
                            >
                              <Pencil size={16} className="text-yellow-600" />
                            </button>
                            <button
                              onClick={() => handleBorrarTurno(t.id)}
                              className="m-auto p-1 hover:bg-red-200 rounded"
                              title="Eliminar turno"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-500">Sin acciones.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {turnos.length === 0 ||
        funcionarios.length === 0 ||
        guardias.length === 0 ? (
          <Loading />
        ) : (
          turnos.map((turno) => {
            const lista = funcionariosPorTurno(turno.id);

            return (
              <section
                key={turno.id}
                className="bg-white rounded shadow p-4 overflow-x-auto mb-6"
              >
                {/* Título del turno */}
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
                      <th className="border px-2 py-1 w-32">Hoy</th>
                      <th className="border px-2 py-1 w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-4 text-gray-500"
                        >
                          No hay funcionarios asignados a este turno.
                        </td>
                      </tr>
                    )}
                    {lista.map((f) => {
                      const valor = getCelda(f, diaActual);

                      let bgBase = "";
                      let textColor = "text-black";
                      let fontWeight = "font-normal";
                      let textSize = "text-sm";

                      switch (valor) {
                        case "Descanso":
                          bgBase = "bg-black";
                          textColor = "text-white";
                          fontWeight = "font-bold";
                          break;
                        case "En Servicio":
                          bgBase = "bg-white";
                          break;
                        case "Licencia":
                          bgBase = "bg-green-600";
                          textColor = "text-white";
                          fontWeight = "font-bold";
                          break;
                        case "1ro":
                        case "2do":
                        case "3er":
                          bgBase = "bg-blue-600";
                          textColor = "text-white";
                          fontWeight = "font-bold";
                          break;
                        case "CURSO":
                          bgBase = "bg-green-600";
                          textColor = "text-white";
                          fontWeight = "font-bold";
                          textSize = "text-xs";
                          break;
                        case "BROU":
                          bgBase = "bg-white";
                          textSize = "text-xs";
                          break;
                        case "CUSTODIA":
                          bgBase = "bg-blue-600";
                          textColor = "text-white";
                          fontWeight = "font-bold";
                          textSize = "text-xs";
                          break;
                        default:
                          bgBase = "";
                      }

                      return (
                        <tr key={f.id}>
                          <td className="border px-2 text-center w-20">
                            G{f.grado}
                          </td>
                          <td className="border px-2 text-left whitespace-nowrap w-48">
                            {f.nombre}
                          </td>
                          <td
                            className={`border py-1 h-5 relative ${bgBase} ${textColor} ${fontWeight} ${textSize}`}
                          >
                            {valor}
                          </td>
                          <td className="border px-2 py-1">
                            <div className="flex gap-2">
                              {usuario?.rol_jerarquico ===
                              "JEFE_DEPENDENCIA" ? (
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            );
          })
        )}
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
      </main>

      {/* Tabla General de Funcionarios */}
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
              {funcionarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No hay funcionarios registrados.
                  </td>
                </tr>
              ) : (
                [...funcionarios]
                  .sort((a, b) => (b.grado || 0) - (a.grado || 0))
                  .map((f) => {
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
      { usuario?.rol_jerarquico === "JEFE_ZONA" && <button
        onClick={() => navigate("/jefe-zona")
        }
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>}
    </div>
  );
};

export default EscalafonServicio;
