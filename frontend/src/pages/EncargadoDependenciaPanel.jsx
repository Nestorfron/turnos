import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchData, postData, putData, deleteData } from "../utils/api";
import Table from "../components/Table";
import TurnoModal from "../components/TurnoModal";
import FuncionarioModal from "../components/FuncionarioModal";
import AsignarTurnoModal from "../components/AsignarTurnoModal";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Loading from "../components/Loading";

const EncargadoDependenciaPanel = () => {
  const { id } = useParams();
  const location = useLocation();
  const { usuario } = useAppContext();
  const navigate = useNavigate();
  const [dependencia, setDependencia] = useState(location.state?.sec || null);
  const [turnos, setTurnos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cantidadFuncionarios, setCantidadFuncionarios] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const [funcionarioModalOpen, setFuncionarioModalOpen] = useState(false);
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState(null);

  const [asignarModalOpen, setAsignarModalOpen] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);

  useEffect(() => {
    if (usuario?.rol_jerarquico === "FUNCIONARIO" || usuario?.rol_jerarquico === "JEFE_ZONA") {
      navigate("/");
    }
  }, [usuario, navigate]);
  
  useEffect(() => {
    if (!usuario?.dependencia_id && !id) return;
  
    const cargarDependencia = async () => {
      try {
        // Si tienes la dependencia en location.state, úsala directamente
        if (location.state?.sec) {
          const dep = location.state.sec;
          const jefe = dep.usuarios?.find(u => u.rol_jerarquico === "JEFE_DEPENDENCIA");
          const funcs = dep.usuarios?.filter(u => u.rol_jerarquico !== "JEFE_DEPENDENCIA") || [];
  
          setDependencia({
            id: dep.id,
            nombre: dep.nombre,
            descripcion: dep.descripcion,
            jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
          });
  
          setTurnos(dep.turnos || []);
          setFuncionarios(funcs);
          setCantidadFuncionarios(dep.usuarios?.length || 0);
          setIsLoading(false);
          return;
        }
  
        // Si no, fetch para obtener dependencias (aquí llamo a fetchData que solo recibe endpoint)
        const deps = await fetchData("dependencias");
        if (!deps) return;
  
        let dep;
        if (usuario?.dependencia_id) {
          dep = deps.find(d => d.id === usuario.dependencia_id);
        } else {
          dep = deps.find(d => d.id === parseInt(id, 10));
        }
        if (!dep) return;
  
        const jefe = dep.usuarios?.find(u => u.rol_jerarquico === "JEFE_DEPENDENCIA");
        const funcs = dep.usuarios?.filter(u => u.rol_jerarquico !== "JEFE_DEPENDENCIA") || [];
  
        setDependencia({
          id: dep.id,
          nombre: dep.nombre,
          descripcion: dep.descripcion,
          jefe_nombre: jefe ? `G${jefe.grado} ${jefe.nombre}` : "Sin jefe",
        });
  
        setTurnos(dep.turnos || []);
        setFuncionarios(funcs);
        setCantidadFuncionarios(dep.usuarios?.length || 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error cargando dependencia:", error);
        setIsLoading(false);
      }
    };
  
    cargarDependencia();
  }, [usuario, id, location.state]);
  
  
  if (!dependencia) return <Loading />;
  
  // Filtrados y ordenados
  const funcionariosFiltrados = funcionarios.filter(f =>
    f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const funcionariosOrdenados = [...funcionariosFiltrados].sort(
    (a, b) => (b.grado || 0) - (a.grado || 0)
  );
  
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
      // Suponiendo que el token está en usuario.token
      const resultado = await putData(
        `usuarios/${asignacionForm.usuario_id}`,
        {
          turno_id: asignacionForm.turno_id,
          estado: asignacionForm.estado,
        },
        usuario?.token // o null si no hay token
      );
  
      if (resultado) {
        setFuncionarios(prev =>
          prev.map(f => (f.id === resultado.id ? resultado : f))
        );
      }
  
      setAsignarModalOpen(false);
    } catch (error) {
      console.error("Error guardando asignación:", error);
    }
  };
  
  
  const abrirModalEditarFuncionario = (funcionario) => {
    setFuncionarioSeleccionado(funcionario);
    setFuncionarioModalOpen(true);
  };
  
  const handleGuardarFuncionario = async (funcionarioForm) => {
    try {
      const resultado = await putData(
        `usuarios/${funcionarioSeleccionado.id}`,
        funcionarioForm,
        usuario?.token
      );
      if (resultado) {
        setFuncionarios(prev =>
          prev.map(f => (f.id === resultado.id ? resultado : f))
        );
      }
    } catch (error) {
      console.error("Error guardando funcionario:", error);
    }
    setFuncionarioModalOpen(false);
  };
  
  
  const abrirModalNuevoTurno = () => {
    setTurnoSeleccionado(null);
    setModalOpen(true);
  };
  
  const abrirModalEditarTurno = (turno) => {
    setTurnoSeleccionado(turno);
    setModalOpen(true);
  };
  
  const handleGuardarTurno = async (turnoForm) => {
    try {
      let resultado = null;
  
      if (turnoForm?.id) {
        // Si tiene id, editar
        resultado = await putData(
          `turnos/${turnoForm.id}`,
          turnoForm,
          usuario?.token
        );
        if (resultado) {
          setTurnos(prev =>
            prev.map(t => (t.id === resultado.id ? resultado : t))
          );
        }
      } else {
        // Crear nuevo turno
        resultado = await postData(
          `turnos`,
          {
            ...turnoForm,
            dependencia_id: dependencia.id,
          },
          usuario?.token
        );
        if (resultado) {
          setTurnos(prev => [...prev, resultado]);
        }
      }
    } catch (error) {
      console.error("Error guardando turno:", error);
    }
    setModalOpen(false);
  };
  
  
  
  const handleBorrarTurno = async (id) => {
    if (window.confirm("¿Estás seguro de borrar este turno?")) {
      try {
        const ok = await deleteData(`turnos/${id}`, usuario?.token);
        if (ok) {
          setTurnos(prev => prev.filter(t => t.id !== id));
        }
      } catch (error) {
        console.error("Error borrando turno:", error);
      }
    }
  };
  
  
  // Función para colorear estado
  const EstadoConColor = ({ estado }) => {
    const estadoLower = (estado || "").toLowerCase();
    const colorClass =
      estadoLower === "activo"
        ? "text-green-600 font-semibold"
        : "text-red-600 font-semibold";
    return <span className={colorClass}>{estado || "Sin estado"}</span>;
  };
  
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
        {/* Header Turnos con botón alineado */}
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

        {/* Tabla turnos */}
        <Table
          title={null}
          columns={[
            "Nombre",
            "Hora Inicio",
            "Hora Fin",
            "Descripción",
            "Acciones",
          ]}
          data={turnos.map((t) => ({
            nombre: t.nombre,
            "hora inicio": t.hora_inicio?.slice(0, 5),
            "hora fin": t.hora_fin?.slice(0, 5),
            descripción: t.descripcion || "-",
            acciones: (
              <div className="flex gap-2">
                {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" && (
                  <>
                    <button
                      onClick={() => abrirModalEditarTurno(t)}
                      className="p-1 hover:bg-yellow-200 rounded"
                    >
                      <Pencil size={16} className="text-yellow-600" />
                    </button>
                    <button
                      onClick={() => handleBorrarTurno(t.id)}
                      className="p-1 hover:bg-red-200 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </>
                )}
                {usuario.rol_jerarquico !== "JEFE_DEPENDENCIA" && (
                  <span className="text-gray-500">Sin acciones.</span>
                )}
              </div>
            ),
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
              title={`${turno.nombre}`}
              columns={["Grado", "Nombre", "Estado", "Acciones"]}
              data={funcionariosTurno.map((f) => ({
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: <EstadoConColor estado={f.estado} />,
                acciones: (
                  <div className="flex gap-2">
                    {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ? (
                      <button
                        onClick={() => abrirModalEditarAsignacion(f)}
                        className="text-yellow-600 hover:text-yellow-700 p-1 rounded"
                      >
                        <Pencil size={18} />
                      </button>
                    ) : (
                      <span className="text-gray-500">Sin acciones.</span>
                    )}
                  </div>
                ),
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
                estado: <EstadoConColor estado={f.estado} />,
              }))}
          />
        )}

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
            columns={[
              "Grado",
              "Nombre",
              "Estado",
              "Turno Asignado",
              "Acciones",
            ]}
            data={funcionariosOrdenados.map((f) => {
              const turno = turnos.find((t) => t.id === f.turno_id);
              return {
                grado: f.grado ?? "No especificado",
                nombre: f.nombre,
                estado: <EstadoConColor estado={f.estado} />,
                "turno asignado": turno ? turno.nombre : "Sin asignar",
                acciones: (
                  <div className="flex gap-2">
                    {usuario?.rol_jerarquico === "JEFE_DEPENDENCIA" ? (
                      <button
                        onClick={() => abrirModalNuevaAsignacion(f)}
                        className="p-1 text-yellow-600 rounded"
                      >
                        <Pencil size={18} />
                      </button>
                    ) : (
                      <span className="text-gray-500">Sin acciones.</span>
                    )}
                  </div>
                ),
              };
            })}
          />
        </section>
      </main>

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

      {funcionarioModalOpen && (
        <FuncionarioModal
          isOpen={funcionarioModalOpen}
          funcionario={funcionarioSeleccionado}
          onClose={() => setFuncionarioModalOpen(false)}
          onSubmitted={handleGuardarFuncionario}
        />
      )}

      {/* Modal Turno */}
      {modalOpen && (
        <TurnoModal
          isOpen={modalOpen}
          isEdit={!!turnoSeleccionado}
          turnoData={turnoSeleccionado || {}}
          onChange={setTurnoSeleccionado}
          onClose={() => setModalOpen(false)}
          onSubmit={() => handleGuardarTurno(turnoSeleccionado)}
        />
      )}
    </div>
  );
};

export default EncargadoDependenciaPanel;
