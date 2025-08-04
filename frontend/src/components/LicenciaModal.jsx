import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

const LicenciaModal = ({ usuario, fechaInicio, onClose, onSubmit }) => {
  const inicioFormateado = dayjs(fechaInicio).format("YYYY-MM-DD");

  const [motivo, setMotivo] = useState("");
  const [fechaFin, setFechaFin] = useState(inicioFormateado);
  const [esMedica, setEsMedica] = useState(false);

  useEffect(() => {
    setMotivo("Licencia agregada manualmente");
    setFechaFin(inicioFormateado);
    setEsMedica(false);
  }, [fechaInicio]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-blue-800">Agregar Licencia</h2>
        <p className="text-gray-700">
          Funcionario: <strong>{usuario?.nombre}</strong>
        </p>
        <p className="text-gray-700">
          Fecha de inicio: <strong>{inicioFormateado}</strong>
        </p>

        <div className="flex items-center space-x-2">
          <input
            id="esMedica"
            type="checkbox"
            checked={esMedica}
            onChange={(e) => setEsMedica(e.target.checked)}
          />
          <label htmlFor="esMedica" className="text-sm text-gray-700">
            Es licencia médica
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha de fin</label>
          <input
            type="date"
            value={dayjs(fechaFin).format("YYYY-MM-DD")}
            min={inicioFormateado}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Motivo</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded w-full"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onSubmit({
                fechaFin: dayjs(fechaFin).format("YYYY-MM-DD"),
                motivo,
                esMedica, 
              })
            }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenciaModal;
