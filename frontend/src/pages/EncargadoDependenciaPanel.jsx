import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Table from "../components/Table";
import TurnoModal from "../components/TurnoModal";
import AsignarTurnoModal from "../components/AsignarTurnoModal";
import { fetchData, putData, postData, deleteData } from "../utils/api";

const EncargadoDependenciaPanel = () => {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [dependencia, setDependencia] = useState(location.state?.sec || null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);

  const [asignacionTurno, setAsignacionTurno] = useState(null);

  const [guardias, setGuardias] = useState([]);

  const [turnoEdit, setTurnoEdit] = useState(null);
  const [nuevoTurno, setNuevoTurno] = useState(null);

  useEffect(() => {
    if (!dependencia && id) {
      fetchData(`dependencias/${id}`, setDependencia);
    }
  }, [dependencia, id]);

  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);
  }, [dependencia]);

  useEffect(() => {
    if (!dependencia?.id) return;

    fetchData(`usuarios`, (allUsuarios) => {
      const filtrados = allUsuarios.filter(
        (u) => u.dependencia_id === dependencia.id
      );
      setFuncionarios(filtrados);
    });
  }, [dependencia]);

  useEffect(() => {
    if (!turnos.length) {
      setGuardias([]);
      return;
    }

    fetchData(`guardias`, (allGuardias) => {
      const turnoIds = new Set(turnos.map((t) => t.id));
      const filtradas = allGuardias.filter((g) => turnoIds.has(g.turno_id));
      setGuardias(filtradas);
    });
  }, [turnos]);

  const closeModal = () => setTurnoEdit(null);
  const closeNuevoModal = () => setNuevoTurno(null);

  const handleUpdate = async () => {
    if (!turnoEdit) return;

    const updatedData = {
      ...turnoEdit,
      dependencia_id: dependencia.id,
    };

    const updated = await putData(`turnos/${turnoEdit.id}`, updatedData);

    if (updated) {
      alert("Turno actualizado");
      closeModal();
      fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);
    } else {
      alert("Error al actualizar");
    }
  };

  const handleCreate = async () => {
    if (!nuevoTurno) return;

    const created = await postData(`turnos`, {
      ...nuevoTurno,
      dependencia_id: dependencia.id,
    });

    if (created) {
      alert("Turno creado");
      closeNuevoModal();
      fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);
    } else {
      alert("Error al crear");
    }
  };

  const handleDelete = async (turno) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${turno.nombre}"?`))
      return;

    const deleted = await deleteData(`turnos/${turno.id}`);

    if (deleted) {
      alert("Turno eliminado");
      fetchData(`turnos?dependencia_id=${dependencia.id}`, setTurnos);
    } else {
      alert("Error al eliminar");
    }
  };

  const handleAsignarTurno = async () => {
    const { usuario_id, turno_id, estado } = asignacionTurno;

    if (!usuario_id || !turno_id) {
      alert("Debe seleccionar un funcionario y un turno");
      return;
    }

    const result = await postData("turnos_asignados", {
      usuario_id,
      turno_id,
      estado,
    });

    if (result) {
      alert("Turno asignado");
      setAsignacionTurno(null);
      // Si quieres refrescar guardias:
      fetchData("guardias", (allGuardias) => {
        const turnoIds = new Set(turnos.map((t) => t.id));
        const filtradas = allGuardias.filter((g) => turnoIds.has(g.turno_id));
        setGuardias(filtradas);
      });
    } else {
      alert("Error al asignar turno");
    }
  };

  if (!dependencia) {
    return <p className="text-red-600">Cargando dependencia...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 relative">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold mb-1">
          Panel Encargado de Dependencia
        </h1>
        <div className="bg-white rounded-md shadow p-6 mb-10">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            {dependencia.nombre}
          </h2>
          <p>
            <strong>Jefe:</strong> {dependencia.jefe_nombre || "Sin jefe"}
          </p>
          <p>
            <strong>Cantidad de funcionarios:</strong>{" "}
            {dependencia.funcionarios_count || 0}
          </p>
          <p>
            <strong>Descripción:</strong> {dependencia.descripcion || "-"}
          </p>
        </div>
      </header>

      <main className="space-y-10">
        <Table
          title={
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-blue-900">
                Turnos Actuales
              </h2>
              <button
                onClick={() =>
                  setNuevoTurno({
                    nombre: "",
                    hora_inicio: "",
                    hora_fin: "",
                    descripcion: "",
                  })
                }
                className="ml-4 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Agregar Turno
              </button>
            </div>
          }
          columns={["Nombre", "Hora Inicio", "Hora Fin", "Descripcion"]}
          data={turnos.map((t) => ({
            nombre: t.nombre,
            hora_inicio: t.hora_inicio?.slice(0, 5),
            hora_fin: t.hora_fin?.slice(0, 5),
            descripcion: t.descripcion,
            id: t.id,
          }))}
          onEdit={(turno) => setTurnoEdit(turno)}
          onDelete={handleDelete}
        />

        <Table
          title="Guardias Asignadas"
          columns={["Funcionario", "Turno", "Fecha Inicio", "Fecha Fin"]}
          data={guardias.map((g) => ({
            funcionario: g.usuario_id,
            turno: g.turno_id,
            fecha_inicio: new Date(g.fecha_inicio).toLocaleString(),
            fecha_fin: new Date(g.fecha_fin).toLocaleString(),
          }))}
        />

        <Table
          title="Funcionarios de la Unidad"
          columns={["Nombre", "Grado"]}
          data={funcionarios.map((f) => ({
            nombre: `${f.nombre}`,
            grado: f.grado || "No especificado",
          }))}
        />
        <button
          onClick={() =>
            setAsignacionTurno({
              usuario_id: "",
              turno_id: "",
              estado: "asignado",
            })
          }
          className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Asignar Turno
        </button>
      </main>

      <button
        onClick={() => navigate("/jefe-zona")}
        className="fixed bottom-6 right-6 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-full shadow-lg text-lg font-bold transition"
      >
        ← Volver
      </button>

      {turnoEdit && (
        <TurnoModal
          isEdit={true}
          turnoData={turnoEdit}
          onChange={setTurnoEdit}
          onClose={closeModal}
          onSubmit={handleUpdate}
        />
      )}

      {nuevoTurno && (
        <TurnoModal
          turnoData={nuevoTurno}
          onChange={setNuevoTurno}
          onClose={closeNuevoModal}
          onSubmit={handleCreate}
        />
      )}

      {asignacionTurno && (
        <AsignarTurnoModal
          funcionarios={funcionarios}
          turnos={turnos}
          asignacion={asignacionTurno}
          setAsignacion={setAsignacionTurno}
          onClose={() => setAsignacionTurno(null)}
          onSubmit={handleAsignarTurno}
        />
      )}
    </div>
  );
};

export default EncargadoDependenciaPanel;
