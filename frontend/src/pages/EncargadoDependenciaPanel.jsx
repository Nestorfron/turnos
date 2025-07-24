import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import DonutChart from "../components/DonutChart";
import { fetchData } from "../utils/api";

const EncargadoDependenciaPanel = () => {
  const { usuario } = useAppContext();
  const [dependencia, setDependencia] = useState(null);
  const [datosTurnos, setDatosTurnos] = useState([]);

  useEffect(() => {
    if (!usuario?.dependencia_id) return;

    fetchData("dependencias", (deps) => {
        console.log("deps", deps);
      fetchData("usuarios", (usuarios) => {
        console.log("usuarios", usuarios);
        const dep = deps.find((d) => d.id === usuario.dependencia_id);
        if (!dep) {
          setDependencia(null);
          return;
        }

        const usuariosDep = usuarios.filter((u) => u.dependencia_id === dep.id);
        const jefe = usuariosDep.find((u) => u.rol_jerarquico === "JEFE_DEPENDENCIA");
        const funcionarios = usuariosDep.filter((u) => u.rol_jerarquico !== "JEFE_DEPENDENCIA");

        setDependencia({
          ...dep,
          jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          funcionarios_count: funcionarios.length,
        });

        // Contar funcionarios por turno
        const turnoCounts = funcionarios.reduce((acc, funcionario) => {
          const turno = funcionario.turno || "Sin turno";
          acc[turno] = (acc[turno] || 0) + 1;
          return acc;
        }, {});

        const dataDonut = Object.entries(turnoCounts).map(([turno, count]) => ({
          name: turno,
          value: count,
        }));

        setDatosTurnos(dataDonut);
      });
    });
  }, [usuario]);

  if (!usuario) {
    return <p className="p-6">Acceso no autorizado. Por favor inicia sesión.</p>;
  }

  if (!dependencia) {
    return <p className="p-6 text-gray-500">No tienes una dependencia asignada o no está cargada.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8 bg-white rounded-md shadow p-6">
        <h1 className="text-3xl font-semibold mb-2">{dependencia.nombre}</h1>
        <p><strong>Jefe:</strong> {dependencia.jefe_nombre}</p>
        <p><strong>Funcionarios:</strong> {dependencia.funcionarios_count}</p>
      </header>

      <section className="mb-8 bg-white rounded-md shadow p-4">
        <h3 className="text-lg font-semibold text-blue-700 mb-3">
          Funcionarios por Turno
        </h3>
        <DonutChart data={datosTurnos} />
      </section>

      <section className="mb-8 bg-white rounded-md shadow p-4">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
              <th className="border border-gray-300 py-2 px-4 text-left">Nombre</th>
              <th className="border border-gray-300 py-2 px-4 text-left">Jefe</th>
              <th className="border border-gray-300 py-2 px-4 text-left">Funcionarios</th>
              <th className="border border-gray-300 py-2 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-gray-50 hover:bg-blue-50 transition-colors">
              <td className="border border-gray-300 py-2 px-4">{dependencia.nombre}</td>
              <td className="border border-gray-300 py-2 px-4">{dependencia.jefe_nombre}</td>
              <td className="border border-gray-300 py-2 px-4">{dependencia.funcionarios_count}</td>
              <td className="border border-gray-300 py-2 px-4">
                <Link
                  to={`/dependencia-panel/${dependencia.id}`}
                  state={{ sec: dependencia }}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Plus size={16} />
                  Ver más
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default EncargadoDependenciaPanel;
