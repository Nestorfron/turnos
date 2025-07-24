import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { fetchData } from "../utils/api";
import Table from "../components/Table";
import { Link } from "react-router-dom";

const EncargadoDependenciaPanel = () => {
  const { usuario } = useAppContext();
  const [dependencia, setDependencia] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cantidadFuncionarios, setCantidadFuncionarios] = useState(0);

  useEffect(() => {
    if (!usuario?.dependencia_id) return;

    fetchData("dependencias", (deps) => {
      const dep = deps.find((d) => d.id === usuario.dependencia_id);
      if (!dep) return;

      // Separar jefe
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
      });

      setTurnos(dep.turnos || []);
      setFuncionarios(funcs);
      setCantidadFuncionarios(dep.usuarios.length);
    });
  }, [usuario]);

  if (!usuario) return <p>Acceso no autorizado</p>;
  if (!dependencia) return <p>Cargando...</p>;

  const funcionariosFiltrados = funcionarios.filter((f) =>
    f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {/* Turnos actuales */}
        <Table
          title="Turnos Actuales"
          columns={["Nombre", "Hora Inicio", "Hora Fin", "Descripción"]}
          data={turnos.map((t) => ({
            nombre: t.descripcion,
            "hora inicio": t.hora_inicio?.slice(0, 5),
            "hora fin": t.hora_fin?.slice(0, 5),
            descripción: t.descripcion || "-",
          }))}
        />

        {/* Funcionarios por turno */}
        {turnos.map((turno) => {
          const funcionariosTurno = funcionarios
            .filter((f) => f.turno_id === turno.id)
            .sort((a, b) => (b.grado || 0) - (a.grado || 0));

          return (
            <Table
              key={turno.id}
              title={`Funcionarios del turno ${turno.descripcion}`}
              columns={["Grado", "Nombre", "Estado"]}
              data={funcionariosTurno.map((f) => ({
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: f.estado || "Sin estado",
              }))}
            />
          );
        })}

        {/* Funcionarios sin turno */}
        {funcionarios.filter((f) => !f.turno_id).length > 0 && (
          <Table
            title="Funcionarios sin turno asignado"
            columns={["Grado", "Nombre", "Estado"]}
            data={funcionarios
              .filter((f) => !f.turno_id)
              .sort((a, b) => (b.grado || 0) - (a.grado || 0))
              .map((f) => ({
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: f.estado || "Sin estado",
              }))}
          />
        )}

        {/* Tabla final de todos los funcionarios con buscador */}
        <section className="bg-white rounded-md shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-700 mb-2 md:mb-0">
              Todos los Funcionarios de la Unidad
            </h3>
            <input
              type="text"
              placeholder="Buscar funcionario por nombre..."
              className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table
            title={null}
            columns={["Grado", "Nombre", "Estado", "Turno Asignado"]}
            data={funcionariosFiltrados.map((f) => {
              const turno = turnos.find((t) => t.id === f.turno_id);
              return {
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: f.estado || "Sin estado",
                "turno asignado": turno ? turno.descripcion : "Sin asignar",
              };
            })}
          />
        </section>
      </main>
    </div>
  );
};

export default EncargadoDependenciaPanel;
