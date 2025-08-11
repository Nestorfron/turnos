import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchData } from "../utils/api";
import Table from "../components/Table";
import Loading from "../components/Loading";
import dayjs from "dayjs";
import { estaTokenExpirado } from "../utils/tokenUtils.js";

const FuncionarioPanel = () => {
  const { usuario, logout } = useAppContext();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [licencias, setLicencias] = useState([]);

  useEffect(() => {
    if (usuario?.rol_jerarquico !== "FUNCIONARIO" || estaTokenExpirado(usuario.token)) {
      navigate("/");
      return;
    }

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

        const [guardiasData, licenciasData] = await Promise.all([
          fetchData("guardias"),
          fetchData("licencias"),
        ]);

        if (guardiasData) {
          const guardiasFiltradas = guardiasData.filter((g) =>
            funcs.some((f) => f.id === g.usuario_id)
          );
          setGuardias(guardiasFiltradas);
        }

        if (licenciasData) {
          const licenciasFiltradas = licenciasData
            .filter((l) => funcs.some((f) => f.id === l.usuario_id))
            .map((l) => ({ ...l, tipo: "licencia" }));
          setLicencias(licenciasFiltradas);
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
          // Primero por grado (mayor primero)
          const diffGrado = (b.grado || 0) - (a.grado || 0);
          if (diffGrado !== 0) return diffGrado;
  
          // Luego por fecha_ingreso (más antiguo primero)
          const fechaA = a.fecha_ingreso ? new Date(a.fecha_ingreso) : new Date(9999, 0, 1);
          const fechaB = b.fecha_ingreso ? new Date(b.fecha_ingreso) : new Date(9999, 0, 1);
          return fechaA - fechaB;
        });
    },
    [funcionarios]
  );
  

  // OPTIMIZA lookups
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

  const getCelda = useCallback(
    (usuario, dia) => {
      const fecha = dia.format("YYYY-MM-DD");
      const key = `${usuario.id}_${fecha}`;

      if (licenciasMap.has(key)) return "L";

      const registro = guardiasMap.get(key);
      if (registro) {
        if (registro.tipo === "guardia") return "T";
        if (registro.tipo === "descanso") return "D";
        return registro.tipo;
      }

      return "-";
    },
    [licenciasMap, guardiasMap]
  );

  if (!dependencia) return <Loading />;

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

      <main className="space-y-10">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">
          Mi Turno Actual
        </h3>
        {miTurno ? (
          <Table
            title={null}
            columns={["Nombre", "Hora Inicio", "Hora Fin", "Descripción"]}
            data={[
              {
                nombre: miTurno.nombre,
                "hora inicio": miTurno.hora_inicio?.slice(0, 5),
                "hora fin": miTurno.hora_fin?.slice(0, 5),
                descripción: miTurno.descripcion || "-",
              },
            ]}
          />
        ) : (
          <p>No tienes un turno asignado actualmente.</p>
        )}

        <h3 className="text-xl font-semibold text-blue-900 mb-4">
          Mis Próximas Guardias
        </h3>

        {miTurno && (
          <div className="bg-white rounded shadow p-4 mb-6 overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm text-center">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2 py-1 w-48">
                    <h2 className="text-lg font-semibold text-blue-800">
                      {miTurno.nombre}
                    </h2>
                  </th>
                  {dias.map((d) => (
                    <th
                      key={d.format("YYYY-MM-DD")}
                      className="border px-2 py-1"
                    >
                      {d.format("ddd")} <br /> {d.format("D")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funcionariosPorTurno(miTurno.id).map((f) => (
                  <tr key={f.id}>
                    <td className="border px-2 text-left whitespace-nowrap w-48 min-w-48">
                      G{f.grado} {f.nombre}
                    </td>
                    {dias.map((d) => {
                      const valor = getCelda(f, d);

                      let bgBase = "";
                      let textColor = "text-black";
                      let fontWeight = "font-normal";
                      let textSize = "text-sm";

                      if (valor === "D") {
                        bgBase = "bg-black";
                        textColor = "text-white";
                        fontWeight = "font-bold";
                      } else {
                        switch (valor) {
                          case "T":
                            bgBase = "bg-white";
                            break;
                          case "L":
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
                          case "Curso":
                            bgBase = "bg-green-600";
                            textColor = "text-white";
                            fontWeight = "font-bold";
                            textSize = "text-xs";
                            break;
                          case "BROU":
                            textSize = "text-xs";
                            break;
                          case "Custodia":
                            bgBase = "bg-blue-600";
                            textColor = "text-white";
                            fontWeight = "font-bold";
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
                      }

                      return (
                        <td
                          key={d.format("YYYY-MM-DD")}
                          className={`border py-1 h-5 ${bgBase} ${textColor} ${fontWeight} ${textSize}`}
                        >
                          {valor}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default FuncionarioPanel;
