import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import { fetchData, putData, postData, deleteData } from "../utils/api";
import { Pencil, Home, Plus, Trash, FileText, BarChart3 } from "lucide-react";
import AsignarTurnoModal from "../components/AsignarTurnoModal";
import { estaTokenExpirado } from "../utils/tokenUtils.js";
import ExtraordinariaGuardiaModal from "../components/ExtraorindariaGuaridaModal.jsx";
import Table from "../components/Table.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import ModalEstadisticas from "../components/ModalEstadisticas.jsx";

const EscalafonServicio = () => {
  const { usuario, getSolicitudes } = useAppContext();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [extraordinariaGuardias, setExtraordinariaGuardias] = useState([]);
  const [extraordinariaGuardiasTodas, setExtraordinariaGuardiasTodas] =
    useState([]);
  const [licencias, setLicencias] = useState([]);
  const [licenciasMedicas, setLicenciasMedicas] = useState([]);
  const [cantidadFuncionarios, setCantidadFuncionarios] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [cargandoGuardias, setCargandoGuardias] = useState(true);
  const [cargandoLicencias, setCargandoLicencias] = useState(true);
  const [cargandoLicenciasMedicas, setCargandoLicenciasMedicas] =
    useState(true);
  const [cargandoExtraordinariaGuardias, setCargandoExtraordinariaGuardias] =
    useState(true);
  const [modalGuardiaOpen, setModalGuardiaOpen] = useState(false);
  const [guardiaSeleccionada, setGuardiaSeleccionada] = useState(null);

  const [startDate, setStartDate] = useState(dayjs());

  const diaActual = useMemo(() => startDate, [startDate]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [mensajeConfirm, setMensajeConfirm] = useState("");

  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  const [mostrarTabla, setMostrarTabla] = useState(false);

  const [modalEstadisticas, setModalEstadisticas] = useState(null);

  const toggleTabla = () => {
    setMostrarTabla(!mostrarTabla);
  };

  const abrirModalEstadisticas = (funcionario) => {
    setModalEstadisticas({
      funcionario,
      estadisticas: estadisticasFuncionario(funcionario.id),
    });
  };

  const abrirModalEditarAsignacion = useCallback((funcionario) => {
    setAsignacionSeleccionada({
      usuario_id: funcionario.id,
      turno_id: funcionario.turno_id || "",
      estado: funcionario.estado || "",
      is_admin: funcionario.is_admin || false,
    });
    setAsignarModalOpen(true);
  }, []);

  const abrirModalNuevaGuardia = () => {
    setGuardiaSeleccionada(null);
    setModalGuardiaOpen(true);
  };

  const handleConfirm = async () => {
    if (accionPendiente) await accionPendiente();
    setShowConfirm(false);
    setAccionPendiente(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setAccionPendiente(null);
  };

  const handleGuardarExtraordinariaGuardia = async (
    extraordinariaGuardiaForm
  ) => {
    try {
      const resultado = await postData(
        `extraordinaria-guardias`,
        {
          usuario_id:
            extraordinariaGuardiaForm.usuarioId ||
            extraordinariaGuardiaForm.usuario_id,
          fecha_inicio:
            extraordinariaGuardiaForm.fechaInicio ||
            extraordinariaGuardiaForm.fecha_inicio,
          fecha_fin:
            extraordinariaGuardiaForm.fechaFin ||
            extraordinariaGuardiaForm.fecha_fin,
          tipo: extraordinariaGuardiaForm.tipo,
          comentario: extraordinariaGuardiaForm.comentario,
        },
        usuario?.token
      );

      if (resultado) {
        setExtraordinariaGuardias((prev) => {
          const existe = prev.find((g) => g.id === resultado.id);
          if (existe) {
            return prev.map((g) => (g.id === resultado.id ? resultado : g));
          } else {
            return [...prev, resultado];
          }
        });
      }

      setAccionPendiente(
        () => () =>
          enviarNotificacion(
            extraordinariaGuardiaForm.usuarioId,
            `Se le asignó ${extraordinariaGuardiaForm.tipo} de ${
              extraordinariaGuardiaForm.comentario
            } el dia ${dayjs
              .utc(extraordinariaGuardiaForm.fechaInicio)
              .format("DD/MM/YYYY")}`,
            extraordinariaGuardiaForm.fechaInicio,
            usuario?.token
          )
      );
      setMensajeConfirm(`¿Desea enviar notificación al Funcionario?`);
      setShowConfirm(true);
      setModalGuardiaOpen(false);
    } catch (error) {
      console.error("Error guardando guardia extraordinaria:", error);
    }
  };

  const enviarNotificacion = async (usuarioId, mensaje, fecha, token) => {
    if (!token) return;

    try {
      await postData(
        "notificaciones",
        { usuario_id: usuarioId, mensaje, fecha },
        token,
        { "Content-Type": "application/json" }
      );
    } catch (error) {
      console.error("Error enviando notificación:", error);
    }
  };

  const handleBorrarExtraordinariaGuardia = async (item) => {
    if (!window.confirm("¿Estás seguro que querés eliminar esta guardia?"))
      return;

    try {
      await deleteData(`extraordinaria-guardias/${item.id}`, usuario.token);

      setAccionPendiente(
        () => () =>
          enviarNotificacion(
            item.usuario_id,
            `Se eliminó  ${item.tipo} de ${item.comentario} el dia ${dayjs
              .utc(item.fecha_inicio)
              .format("DD/MM/YYYY")}`,
            item.fecha_inicio,
            usuario?.token
          )
      );
      setMensajeConfirm(`¿Desea enviar notificación al Funcionario?`);
      setShowConfirm(true);
      setExtraordinariaGuardias((prev) => prev.filter((g) => g.id !== item.id));
    } catch (error) {
      console.error("Error eliminando guardia:", error);
      alert("No se pudo eliminar la guardia, intenta nuevamente.");
    }
  };

  const handleGuardarAsignacion = async (asignacionForm) => {
    try {
      const resultado = await putData(
        `usuarios/${asignacionForm.usuario_id}`,
        {
          turno_id: asignacionForm.turno_id,
          estado: asignacionForm.estado,
          is_admin: asignacionForm.is_admin,
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

    getSolicitudes();
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
    const cargarLicenciasMedicas = async () => {
      const l = await fetchData("licencias-medicas", usuario?.token);
      setLicenciasMedicas(l || []);
      setCargandoLicenciasMedicas(false);
    };
    const cargarExtraordinariaGuardias = async () => {
      const l = await fetchData("extraordinaria-guardias", usuario?.token);
      const hoy = dayjs().startOf("day");
      const guardiasFiltradas = (l || []).filter(
        (g) =>
          dayjs(g.fecha_inicio).isSame(hoy) ||
          dayjs(g.fecha_inicio).isAfter(hoy)
      );
      setExtraordinariaGuardiasTodas(l);
      setExtraordinariaGuardias(guardiasFiltradas);
      setCargandoExtraordinariaGuardias(false);
    };
    cargarLicenciasMedicas();
    cargarGuardias();
    cargarLicencias();
    cargarExtraordinariaGuardias();
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

      const licenciaMedica = licenciasMedicas.find(
        (lic) =>
          lic.usuario_id === usuario.id &&
          fecha >= dayjs(lic.fecha_inicio).utc().format("YYYY-MM-DD") &&
          fecha <= dayjs(lic.fecha_fin).utc().format("YYYY-MM-DD")
      );
      if (licenciaMedica) return "Licencia médica";

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
    () =>
      [...funcionarios].sort((a, b) => {
        const diffGrado = (b.grado || 0) - (a.grado || 0);
        if (diffGrado !== 0) return diffGrado;

        const fechaA = new Date(a.fecha_ingreso);
        const fechaB = new Date(b.fecha_ingreso);
        return fechaA - fechaB;
      }),
    [funcionarios]
  );

  const funcionarioNombre = useCallback(
    (id) => {
      const f = funcionarios.find((f) => f.id === id);
      return f ? `G${f.grado} ${f.nombre}` : "";
    },
    [funcionarios]
  );

  const extraordinariaGuardiaOrdenadas = [...extraordinariaGuardias].sort(
    (a, b) => {
      const fechaA = dayjs.utc(a.fecha_inicio);
      const fechaB = dayjs.utc(b.fecha_inicio);
      return fechaA - fechaB;
    }
  );

  const estadisticasFuncionario = (id) => {
    const totalLicencias = licencias.filter((l) => l.usuario_id === id);
    const totalLicenciasMedicas = licenciasMedicas.filter(
      (l) => l.usuario_id === id
    );
    const totalGuardias = guardias.filter((g) => g.usuario_id === id);
    const totalExtraordinariaGuardias = extraordinariaGuardiasTodas.filter(
      (g) => g.usuario_id === id
    );

    return {
      totalLicencias,
      totalLicenciasMedicas,
      totalGuardias,
      totalExtraordinariaGuardias,
    };
  };

  const funcionariosPorTurno = useCallback(
    (turnoId) =>
      funcionarios
        .filter(
          (f) => f.turno_id === turnoId && f.estado?.toLowerCase() === "activo"
        )
        .sort((a, b) => {
          const diffGrado = (b.grado || 0) - (a.grado || 0);
          if (diffGrado !== 0) return diffGrado;

          const fechaA = new Date(a.fecha_ingreso);
          const fechaB = new Date(b.fecha_ingreso);
          return fechaA - fechaB;
        }),
    [funcionarios]
  );

  if (
    isLoading ||
    cargandoGuardias ||
    cargandoLicencias ||
    cargandoExtraordinariaGuardias ||
    cargandoLicenciasMedicas ||
    !dependencia
  )
    return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 px-2 font-sans text-gray-800">
      <header className="mb-8">
        <div className="bg-white rounded-md shadow p-4 my-4 py-4">
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
          <div className="flex justify-between items-center">
            <Link
              to={`/guardias`}
              state={{ sec: dependencia }}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Escalafón
            </Link>
            <Link
              to={`/funcionario/${usuario?.id}/detalle`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Mis Licencias
            </Link>
          </div>
        )}
      </header>
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

      {/* Guardias Extraordinarias / Cursos */}
      <section className="space-y-10 bg-white rounded-md shadow px-2 mb-4">
        <br />
        <Table
          title="Extraordinarias / Cursos"
          searchable={true}
          columns={["Fecha y horario", "Funcionario", "Tipo", "Comentario"]}
          data={extraordinariaGuardiaOrdenadas}
          leftAlignColumns={["Funcionario", "Tipo", "Comentario"]}
          minWidthColumns={{
            Tipo: "min-w-[150px]",
            Comentario: "min-w-[200px]",
          }}
          renderCell={(item, col) => {
            if (col === "Fecha y horario") {
              return {
                content: (
                  <>
                    {dayjs.utc(item.fecha_inicio).format("DD/MM")}{" "}
                    <span className="text-xs text-gray-500">
                      ({dayjs.utc(item.fecha_inicio).format("HH:mm")} a{" "}
                      {dayjs.utc(item.fecha_fin).format("HH:mm")})
                    </span>
                  </>
                ),
              };
            }
            if (col === "Funcionario") {
              return { content: funcionarioNombre(item.usuario_id) };
            }
            if (col === "Tipo") {
              return {
                content: item.tipo,
                className:
                  item.comentario && window.innerWidth < 1024 ? "truncate" : "",
                title:
                  item.comentario && window.innerWidth < 1024
                    ? item.comentario
                    : "",
              };
            }
            if (col === "Comentario") {
              return { content: item.comentario || "-" };
            }
          }}
          onDelete={(item) => {
            if (
              usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ||
              usuario?.is_admin === true
            ) {
              handleBorrarExtraordinariaGuardia(item);
            } else {
              alert("No tiene permisos para eliminar esta guardia");
            }
          }}
          renderActions={(item) => {
            if (
              usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ||
              usuario?.is_admin === true
            ) {
              return (
                <button
                  onClick={() => handleBorrarExtraordinariaGuardia(item)}
                  className="m-auto px-2 text-red-600 rounded hover:bg-red-100"
                  title="Eliminar Guardia"
                >
                  <Trash size={18} />
                </button>
              );
            } else {
              return <span className="text-gray-500">Sin acciones.</span>;
            }
          }}
        />
        {modalGuardiaOpen && (
          <ExtraordinariaGuardiaModal
            usuarios={funcionariosOrdenados}
            extraordinariaGuardia={guardiaSeleccionada}
            onClose={() => setModalGuardiaOpen(false)}
            onSubmit={handleGuardarExtraordinariaGuardia}
          />
        )}

        {/*Extraordinarias / Cursos todas*/}
        <div
          className={mostrarTabla ? "bg-gray-100 rounded-md shadow mb-6" : ""}
        >
          {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" || usuario?.is_admin === true ? 
          <div className="flex items-center justify-between">
            <button
              onClick={abrirModalNuevaGuardia}
              className="mx-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={toggleTabla}
              className="m-4 flex ml-auto text-blue-600 hover:underline"
            >
              {mostrarTabla ? "Cerrar" : "Ver todas"}
            </button>
          </div>: ""}

          {mostrarTabla && (
            <Table
              title="Extraordinarias / Cursos (todas)"
              searchable={true}
              columns={["Fecha y horario", "Funcionario", "Tipo", "Comentario"]}
              data={extraordinariaGuardiasTodas.map((g) => ({
                Funcionario: funcionarioNombre(g.usuario_id),
                "fecha y horario": `${dayjs
                  .utc(g.fecha_inicio)
                  .format("DD/MM/YYYY")} de ${dayjs
                  .utc(g.fecha_inicio)
                  .format("HH:mm")} a ${dayjs
                  .utc(g.fecha_fin)
                  .format("HH:mm")}`,
                tipo: g.tipo,
                comentario: g.comentario || "-",
              }))}
            />
          )}
        </div>
      </section>

      {/* Listado de funcionarios por turno */}
      <section className="space-y-10 bg-white rounded-md shadow px-2 mb-6">
        <h1 className="text-xl font-semibold text-blue-900 pt-4 text-center">
          TURNOS
        </h1>
        <main className="space-y-10 ">
          {turnos.map((turno) => {
            const lista = funcionariosPorTurno(turno.id);

            return (
              <section key={turno.id} className="rounded mb-6">
                <Table
                  title={turno.nombre}
                  columns={["Grado", "Nombres", startDate.format("DD/MM/YYYY")]}
                  data={lista}
                  leftAlignColumns={["Nombres"]}
                  minWidthColumns={{
                    Nombres: "min-w-[150px]",
                    [startDate.format("DD/MM/YYYY")]: "min-w-[120px]",
                  }}
                  renderCell={(item, col) => {
                    if (col === "Grado") return { content: `G${item.grado}` };
                    if (col === "Nombres") return { content: item.nombre };
                    if (col === startDate.format("DD/MM/YYYY")) {
                      const valor = getCelda(item, diaActual);

                      let bg = "",
                        text = "text-black",
                        fw = "font-normal",
                        ts = "text-sm";

                      switch (valor) {
                        case "Descanso":
                          bg = "bg-black";
                          text = "text-white";
                          fw = "font-bold";
                          break;
                        case "Licencia":
                        case "Curso":
                        case "CH":
                        case "L.Ext":
                          bg = "bg-green-600";
                          text = "text-white";
                          fw = "font-bold";
                          ts =
                            valor === "Curso" ||
                            valor === "CH" ||
                            valor === "L.Ext"
                              ? "text-xs"
                              : ts;
                          break;
                        case "Licencia médica":
                          bg = "bg-yellow-300";
                          text = "text-black";
                          fw = "font-bold";
                          break;
                        case "En Servicio":
                          bg = "bg-white";
                          break;
                        case "BROU":
                          ts = "text-xs";
                          break;
                        case "Custodia":
                          bg = "bg-blue-600";
                          text = "text-white";
                          fw = "font-bold";
                          ts = "text-xs";
                          break;
                        case "1ro":
                        case "2do":
                        case "3er":
                          bg = "bg-blue-600";
                          text = "text-white";
                          fw = "font-bold";
                          break;
                        case "-":
                          bg = "bg-gray-300";
                          text = "text-gray-300";
                          fw = "font-normal";
                          ts = "text-xs";
                          break;
                      }

                      return {
                        content: valor,
                        className: `${bg} ${text} ${fw} ${ts} `,
                      };
                    }
                  }}
                  renderActions={(item) =>
                    usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ||
                    usuario?.is_admin === true ? (
                      <button
                        onClick={() => abrirModalEditarAsignacion(item)}
                        className="flex items-center m-auto px-2 text-yellow-600 rounded"
                      >
                        <Pencil size={18} />
                      </button>
                    ) : (
                      <span className="text-gray-500">Sin acciones.</span>
                    )
                  }
                />
              </section>
            );
          })}
        </main>
      </section>

      {/* Tabla General */}
      <section className="space-y-10 bg-white rounded-md shadow px-2 mb-6">
        <h1 className="text-xl font-semibold text-blue-900 my-4 py-4  text-center">
          PERSONAL
        </h1>
        <Table
          title="Listado General"
          searchable={true}
          columns={["Grado", "Nombre", "Estado", "Turno", " "]}
          data={funcionariosOrdenados}
          leftAlignColumns={["Nombre", "Turno"]}
          minWidthColumns={{
            Nombre: "min-w-[12rem]",
            Estado: "min-w-[5rem]",
            Turno: "min-w-[10rem]",
          }}
          renderCell={(f, col) => {
            if (col === "Grado") return { content: `G${f.grado}` };
            if (col === "Nombre") return { content: f.nombre };
            if (col === "Estado") {
              const estadoClass =
                f.estado?.toLowerCase() === "activo"
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold";
              return {
                content: (
                  <span className={estadoClass}>
                    {f.estado || "Sin estado"}
                  </span>
                ),
              };
            }
            if (col === " ") {
              {
                return {
                  content: (
                    <>
                      {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" || usuario?.is_admin === true ?
                      <div className="flex justify-around items-center gap-2">
                        <button
                          onClick={() => abrirModalEstadisticas(f)}
                          className="text-blue-600 hover:underline"
                          title="Estadísticas"
                        >
                          <BarChart3 size={18} />
                        </button>
                        <Link
                          to={`/funcionario/${f.id}/detalle`}
                          className="text-blue-600 hover:underline"
                          title="Licencias"
                        >
                          <FileText size={18} />
                        </Link>
                        <button
                          onClick={() => abrirModalEditarAsignacion(f)}
                          className="text-blue-600 hover:underline"
                          title="Editar"
                        >
                          <Pencil size={18} />
                          </button>
                      </div> : "-"}
                    </>
                  ),
                };
              }
            }

            if (col === "Turno") {
              const turnoNombre =
                turnos.find((t) => t.id === f.turno_id)?.nombre ||
                "Sin asignar";
              return { content: turnoNombre };
            }
          }}
        />

        {modalEstadisticas && (
          <ModalEstadisticas
            funcionario={modalEstadisticas.funcionario}
            onClose={() => setModalEstadisticas(null)}
            estadisticas={modalEstadisticas.estadisticas}
          />
        )}

        {asignarModalOpen && (
          <AsignarTurnoModal
            funcionarios={funcionariosOrdenados}
            turnos={turnos}
            asignacion={asignacionSeleccionada}
            isEdit={true}
            onClose={() => setAsignarModalOpen(false)}
            onSubmit={handleGuardarAsignacion}
          />
        )}

        {showConfirm && (
          <ConfirmModal
            open={showConfirm}
            mensaje={mensajeConfirm}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
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
        {usuario?.is_admin === true && (
          <button
            onClick={() => navigate("/funcionario/" + usuario?.id)}
            className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
          >
            ← Volver
          </button>
        )}
      </section>
    </div>
  );
};

export default EscalafonServicio;
