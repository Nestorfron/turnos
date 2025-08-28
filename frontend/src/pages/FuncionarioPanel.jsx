import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchData } from "../utils/api";
import Table from "../components/Table";
import Loading from "../components/Loading";
import dayjs from "dayjs";
import { estaTokenExpirado } from "../utils/tokenUtils.js";
import { SearchX, Users } from "lucide-react";

const FuncionarioPanel = () => {
  const { usuario, getNotificaciones } = useAppContext();
  const navigate = useNavigate();
  const fechaActual = new Date();

  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [licenciasMedicas, setLicenciasMedicas] = useState([]);
  const [extraordinariaGuardias, setExtraordinariaGuardias] = useState([]);

  useEffect(() => {
    if (usuario?.rol_jerarquico !== "FUNCIONARIO") {
      navigate("/");
      return;
    }

    if (estaTokenExpirado(usuario?.token)) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      localStorage.removeItem("usuario");
      navigate("/");
      return;
    }

    getNotificaciones();

    const cargarDatos = async () => {
      if (!usuario?.dependencia_id) return;

      try {
        const deps = await fetchData("dependencias");
        if (!deps) return;

        const dep = deps.find((d) => d.id === usuario.dependencia_id);
        if (!dep) return;

        const jefe = dep.usuarios.find(
          (u) => u.rol_jerarquico === "JEFE_DEPENDENCIA"
        );
        const funcs = dep.usuarios.filter(
          (u) => u.rol_jerarquico !== "JEFE_DEPENDENCIA"
        );

        setDependencia({
          id: dep.id,
          nombre: dep.nombre,
          descripcion: dep.descripcion,
          jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          turnos: dep.turnos,
          usuarios: dep.usuarios,
        });

        setTurnos(dep.turnos || []);
        setFuncionarios(funcs);

        const [
          guardiasData,
          licenciasData,
          licenciasMedicasData,
          extraordinariaGuardiasData,
        ] = await Promise.all([
          fetchData("guardias"),
          fetchData("licencias"),
          fetchData("licencias-medicas"),
          fetchData("extraordinaria-guardias"),
        ]);

        if (guardiasData) {
          const guardiasFiltradas = guardiasData.filter((g) =>
            funcs.some((f) => f.id === g.usuario_id)
          );
          setGuardias(guardiasFiltradas);
        }

        if (licenciasMedicasData) {
          const licenciasFiltradasMedicas = licenciasMedicasData
            .filter((l) => funcs.some((f) => f.id === l.usuario_id))
            .map((l) => ({ ...l, tipo: "licencia_medica" }));
          setLicenciasMedicas(licenciasFiltradasMedicas);
        }

        if (licenciasData) {
          const licenciasFiltradas = licenciasData
            .filter((l) => funcs.some((f) => f.id === l.usuario_id))
            .map((l) => ({ ...l, tipo: "licencia" }));
          setLicencias(licenciasFiltradas);
        }

        if (extraordinariaGuardiasData) {
          const extraordinariaGuardiasFiltradas =
            extraordinariaGuardiasData.filter(
              (l) => l.usuario_id === usuario.id
            );
          const extraordinariaGuardiasActuales =
            extraordinariaGuardiasFiltradas.filter((g) => {
              const inicio = dayjs(g.fecha_inicio).utc();
              return inicio >= fechaActual;
            });
          setExtraordinariaGuardias(extraordinariaGuardiasActuales);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };
    cargarDatos();
  }, [usuario, navigate]);

  const miTurno = useMemo(() => {
    return turnos.find((t) => t.id === usuario?.turno_id);
  }, [turnos, usuario]);

  const dias = useMemo(() => {
    const hoy = dayjs().startOf("day");
    return Array.from({ length: 7 }).map((_, i) => hoy.add(i, "day"));
  }, []);

  const cantidadFuncionarios = useMemo(
    () => dependencia?.usuarios?.length || 0,
    [dependencia]
  );

  const funcionariosPorTurno = useCallback(
    (turnoId) => {
      return funcionarios
        .filter((f) => f.turno_id === turnoId)
        .sort((a, b) => {
          const diffGrado = (b.grado || 0) - (a.grado || 0);
          if (diffGrado !== 0) return diffGrado;

          const fechaA = a.fecha_ingreso
            ? new Date(a.fecha_ingreso)
            : new Date(9999, 0, 1);
          const fechaB = b.fecha_ingreso
            ? new Date(b.fecha_ingreso)
            : new Date(9999, 0, 1);
          return fechaA - fechaB;
        });
    },
    [funcionarios]
  );

  const licenciasMap = useMemo(() => {
    const map = new Map();
    licencias.forEach((l) => {
      const inicio = dayjs(l.fecha_inicio).utc();
      const fin = dayjs(l.fecha_fin).utc();
      for (let d = inicio; d.isSameOrBefore(fin); d = d.add(1, "day")) {
        const key = `${l.usuario_id}_${d.format("YYYY-MM-DD")}`;
        map.set(key, l);
      }
    });
    return map;
  }, [licencias]);

  const guardiasMap = useMemo(() => {
    const map = new Map();
    guardias.forEach((g) => {
      const inicio = dayjs(g.fecha_inicio).utc();
      const fin = dayjs(g.fecha_fin).utc();
      for (let d = inicio; d.isSameOrBefore(fin); d = d.add(1, "day")) {
        const key = `${g.usuario_id}_${d.format("YYYY-MM-DD")}`;
        map.set(key, g);
      }
    });
    return map;
  }, [guardias]);

  const licenciasMedicasMap = useMemo(() => {
    const map = new Map();
    licenciasMedicas.forEach((l) => {
      const inicio = dayjs(l.fecha_inicio).utc();
      const fin = dayjs(l.fecha_fin).utc();
      for (let d = inicio; d.isSameOrBefore(fin); d = d.add(1, "day")) {
        const key = `${l.usuario_id}_${d.format("YYYY-MM-DD")}`;
        map.set(key, l);
      }
    });
    return map;
  }, [licenciasMedicas]);

  const getCelda = useCallback(
    (usuario, dia) => {
      const fecha = dia.format("YYYY-MM-DD");
      const key = `${usuario.id}_${fecha}`;

      if (licenciasMap.has(key)) return "L";
      if (licenciasMedicasMap.has(key)) return "L.Medica";

      const registro = guardiasMap.get(key);
      if (registro) {
        if (registro.tipo === "guardia") return "T";
        if (registro.tipo === "descanso") return "D";
        return registro.tipo;
      }

      return "-";
    },
    [licenciasMap, guardiasMap, licenciasMedicasMap]
  );

  if (!dependencia || !turnos || !funcionarios || !guardias || !licencias || !licenciasMedicas || !extraordinariaGuardias) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <div className="flex bg-white rounded-md shadow p-6 mb-4">
          <div>
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

          {usuario?.is_admin === true && (
            <div className="flex justify-end items-center ml-auto">
              <Link
                to={`/escalafon-servicio`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                <Users size={24} />
              </Link>
            </div>
          )}
        </div>

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
      </header>

      <main className="space-y-10 rounded mb-6 overflow-x-auto">

        {/* Extraordinarias / Cursos */}
        <Table
          title="Extraordinarias / Cursos"
          columns={["Fecha y horario", "Tipo", "Comentario"]}
          data={extraordinariaGuardias.map((g) => ({
            "fecha y horario": `${dayjs
              .utc(g.fecha_inicio)
              .format("DD/MM/YYYY")} de ${dayjs
              .utc(g.fecha_inicio)
              .format("HH:mm")} a ${dayjs.utc(g.fecha_fin).format("HH:mm")}`,
            tipo: g.tipo,
            comentario: g.comentario || "-",
          }))}
        />

        {/* Mi Turno Actual */}
        <Table
          title="Mi Turno Actual"
          columns={["Nombre", "Hora inicio", "Hora fin", "Descripción"]}
          data={[
            {
              Nombre: miTurno.nombre,
              "Hora inicio": miTurno.hora_inicio?.slice(0, 5) || "-",
              "Hora fin": miTurno.hora_fin?.slice(0, 5) || "-",
              Descripción: miTurno.descripcion || "-",
            },
          ]}
          leftAlignColumns={["Nombre"]}
          renderCell={(item, col, value) => ({
            content: value,
            className: "text-sm text-black",
          })}
        />

        {/* Mis Próximas Guardias */}
        <Table
          title={`Mis Próximas Guardias`}
          columns={["Funcionario", ...dias.map((d) => d.format("DD/MM"))]}
          data={funcionariosPorTurno(miTurno.id).map((f) => {
            const row = { Funcionario: `G${f.grado} ${f.nombre}` };
            dias.forEach((d) => {
              row[d.format("DD/MM")] = getCelda(f, d);
            });
            return row;
          })}
          leftAlignColumns={["Funcionario"]}
          renderCell={(item, col, value) => {
            let bgBase = "";
            let textColor = "text-black";
            let fontWeight = "font-normal";
            let textSize = "";
            let minWidthClass = "min-w-[50px]";

            if (col === "Funcionario") {
              minWidthClass = "min-w-[190px]";
            }

            switch (value) {
              case "D":
                bgBase = "bg-black";
                textColor = "text-white";
                fontWeight = "font-bold";
                textSize = "text-xs";
                break;
              case "T":
                bgBase = "bg-white";
                textSize = "text-xs";
                break;
              case "L":
              case "L.Ext":
                bgBase = "bg-green-600";
                textColor = "text-white";
                fontWeight = "font-bold";
                textSize = "text-xs";
                break;
              case "L.Medica":
                bgBase = "bg-yellow-300";
                textColor = "text-black";
                fontWeight = "font-bold";
                textSize = "text-xs";
                break;
              case "1ro":
              case "2do":
              case "3er":
              case "Custodia":
                bgBase = "bg-blue-600";
                textColor = "text-white";
                fontWeight = "font-bold";
                textSize = "text-xs";
                break;
              case "Curso":
                bgBase = "bg-green-600";
                textColor = "text-white";
                fontWeight = "font-bold";
                textSize = "text-xs";
                break;
              case "BROU":
                textSize = "text-xs";
                break;
              case "-":
                bgBase = "bg-gray-300";
                textColor = "text-gray-300";
                fontWeight = "font-normal";
                textSize = "text-xs";
                break;
              default:
                break;
            }
            return {
              content: value,
              className: `${bgBase} ${textColor} ${fontWeight} ${textSize} ${minWidthClass}`,
            };
          }}
        />
      </main>
    </div>
  );
};

export default FuncionarioPanel;
