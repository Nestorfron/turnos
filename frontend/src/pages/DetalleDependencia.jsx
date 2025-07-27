import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Table from "../components/Table";
import { fetchData } from "../utils/api";
import Loading from "../components/Loading";

const DetalleDependencia = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(location.state?.sec || null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoading(true);

      try {
        if (!dependencia && id) {
          await new Promise((resolve) =>
            fetchData(`dependencias/${id}`, (data) => {
              setDependencia(data);
              resolve();
            })
          );
        }

        if (dependencia?.id) {
          await Promise.all([
            new Promise((resolve) =>
              fetchData(`turnos?dependencia_id=${dependencia.id}`, (data) => {
                setTurnos(data);
                resolve();
              })
            ),
            new Promise((resolve) =>
              fetchData("usuarios", (usuarios) => {
                const filtrados = usuarios.filter(
                  (u) => u.dependencia_id === dependencia.id
                );
                setFuncionarios(filtrados);
                resolve();
              })
            ),
          ]);
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatos();
  }, [dependencia, id]);

  if (isLoading) {
    return <Loading />
  }

  const funcionariosFiltrados = funcionarios
    .filter((f) => f.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.grado || 0) - (a.grado || 0));

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">Detalle de Dependencia</h1>
        <div className="bg-white rounded-md shadow p-6 mb-10">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            {dependencia.nombre}
          </h2>
          <p>
            <strong>Jefe:</strong> {dependencia.jefe_nombre || "Sin jefe"}
          </p>
          <p>
            <strong>Descripción:</strong> {dependencia.descripcion || "-"}
          </p>
          <p>
            <strong>Total de funcionarios:</strong> {funcionarios.length}
          </p>
        </div>
      </header>

      <main className="space-y-10">
        {/* Turnos */}
        <Table
          title="Turnos Actuales"
          columns={["Nombre", "Hora Inicio", "Hora Fin", "Descripción"]}
          data={turnos.map((t) => ({
            nombre: t.nombre,
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
              title={`Funcionarios del turno ${turno.nombre}`}
              columns={["Grado", "Nombre", "Estado"]}
              data={funcionariosTurno.map((f) => ({
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: f.estado || "Sin estado",
              }))}
            />
          );
        })}

        {/* Tabla final de todos los funcionarios */}
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
                "turno asignado": turno ? turno.nombre : "Sin asignar",
              };
            })}
          />
        </section>
      </main>

      <button
        onClick={() => navigate("/jefe-zona")}
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>
    </div>
  );
};

export default DetalleDependencia;
