import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Table from "../components/Table";
import { fetchData } from "../utils/api";

const DetalleDependencia = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(location.state?.sec || null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    if (!dependencia && id) {
      fetchData(`dependencias/${id}`, setDependencia);
    }
  }, [dependencia, id]);

  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);

    fetchData("usuarios", (usuarios) => {
      const filtrados = usuarios.filter(
        (u) => u.dependencia_id === dependencia.id
      );
      setFuncionarios(filtrados);
    });
  }, [dependencia]);

  if (!dependencia) {
    return <p className="text-red-600">Cargando dependencia...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">
          Detalle de Dependencia
        </h1>
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
        <Table
          title="Todos los Funcionarios de la Unidad"
          columns={["Grado", "Nombre", "Estado", "Turno Asignado"]}
          data={funcionarios
            .slice()
            .sort((a, b) => (b.grado || 0) - (a.grado || 0))
            .map((f) => {
              const turno = turnos.find((t) => t.id === f.turno_id);
              return {
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: f.estado || "Sin estado",
                "turno asignado": turno ? turno.nombre : "Sin asignar",
              };
            })}
        />
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
