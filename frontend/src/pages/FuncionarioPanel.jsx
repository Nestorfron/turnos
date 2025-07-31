import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchData } from "../utils/api";
import Table from "../components/Table";
import Loading from "../components/Loading";
import dayjs from "dayjs";

const FuncionarioPanel = () => {
  const { usuario } = useAppContext();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [guardias, setGuardias] = useState([]);
  const [licencias, setLicencias] = useState([]);
  const [cantidadFuncionarios, setCantidadFuncionarios] = useState(0);

  useEffect(() => {
    if (usuario?.rol_jerarquico !== "FUNCIONARIO") {
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
        setCantidadFuncionarios(dep.usuarios.length);

        // Guardias y licencias
        const guardiasData = await fetchData("guardias");
        const licenciasData = await fetchData("licencias");

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
    return Array.from({ length: 7 }).map((_, i) => dayjs().add(i, "day"));
  }, []);


  const funcionariosPorTurno = useCallback(
    (turnoId) => {
      return funcionarios.filter((f) => f.turno_id === turnoId).sort((a, b) => (b.grado || 0) - (a.grado || 0));
    },
    [funcionarios]
  );



  

  const getCelda = useCallback(
    (usuario, dia) => {
      const fecha = dia.format("YYYY-MM-DD");

      const licencia = licencias.find((l) => {
        const inicio = dayjs(l.fecha_inicio).utc().format("YYYY-MM-DD");
        const fin = dayjs(l.fecha_fin).utc().format("YYYY-MM-DD");
        return l.usuario_id === usuario.id && fecha >= inicio && fecha <= fin;
      });

      if (licencia) return "L";

      const registro = guardias.find((g) => {
        const inicio = dayjs(g.fecha_inicio).utc().format("YYYY-MM-DD");
        const fin = dayjs(g.fecha_fin).utc().format("YYYY-MM-DD");
        return g.usuario_id === usuario.id && fecha >= inicio && fecha <= fin;
      });

      if (registro) {
        if (registro.tipo === "guardia") return "T";
        return registro.tipo;
      }

      return "D";
    },
    [guardias, licencias]
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

        <Link
          to={`/guardias`}
          state={{ sec: dependencia }}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Ver Escalafón
        </Link>
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
                          case "CURSO":
                            bgBase = "bg-green-600";
                            textColor = "text-white";
                            fontWeight = "font-bold";
                            textSize = "text-xs";
                            break;
                          case "BROU":
                            textSize = "text-xs";
                            break;
                          case "CUSTODIA":
                            bgBase = "bg-blue-600";
                            textColor = "text-white";
                            fontWeight = "font-bold";
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
