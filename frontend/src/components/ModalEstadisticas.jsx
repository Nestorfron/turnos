import React, { useState } from "react";
import dayjs from "dayjs";
import DonutChart from "./DonutChart";

const ModalEstadisticas = ({ funcionario, onClose, estadisticas }) => {
  if (!funcionario) return null;

  const { totalGuardias } = estadisticas;
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

  const DESCANSOS = ["d", "descanso"];

  const Cursos = ["curso", "Curso", "Cursos", "c"];

  const Custodia = ["custodia", "Custodia", "Custodias", "c"];

  const Extras = ["l.ext", "l ext", "lext", "L.Ext"];

  const normalizarTipo = (tipo) =>
    (tipo ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s+/g, "");

  const guardiasMes = totalGuardias.filter(
    (item) =>
      item.fecha_inicio &&
      dayjs.utc(item.fecha_inicio).format("YYYY-MM") === selectedMonth &&
      !Extras.includes(normalizarTipo(item.tipo)) && !Custodia.includes(normalizarTipo(item.tipo)) && !DESCANSOS.includes(normalizarTipo(item.tipo))
  );

  const descansosMes = totalGuardias.filter(
    (item) =>
      item.fecha_inicio &&
      dayjs(item.fecha_inicio).format("YYYY-MM") === selectedMonth &&
      DESCANSOS.includes(normalizarTipo(item.tipo))
  );

  const cursosMes = totalGuardias.filter(
    (item) =>
      item.fecha_inicio &&
      dayjs(item.fecha_inicio).format("YYYY-MM") === selectedMonth &&
      Cursos.includes(normalizarTipo(item.tipo))
  );

  const custodiasMes = totalGuardias.filter(
    (item) =>
      item.fecha_inicio &&
      dayjs(item.fecha_inicio).format("YYYY-MM") === selectedMonth &&
      Custodia.includes(normalizarTipo(item.tipo))
  );


  const chartData = [
    { name: "Guardias", value: guardiasMes.length },
    { name: "Descansos", value: descansosMes.length },
    { name: "Cursos", value: cursosMes.length },
    { name: "Custodias", value: custodiasMes.length },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-96 p-6 relative">
        <h2 className="text-xl font-semibold mb-4 text-center">
          G{funcionario.grado} {funcionario.nombre}
        </h2>

        {/* Selector de mes */}
        <div className="mb-4 flex justify-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        {/* Totales */}
        <ul className="space-y-3 mb-6">
          <li className="flex justify-between">
            <span className="font-medium">Guardias en Secccional:</span>
            <span>{guardiasMes.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="font-medium">Descansos:</span>
            <span>{descansosMes.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="font-medium">Cursos:</span>
            <span>{cursosMes.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="font-medium">Custodias:</span>
            <span>{custodiasMes.length}</span>
          </li>
        </ul>

        {/* Gráfico */}
        <div className="flex justify-center">
          <DonutChart
            data={chartData}
            colors={["#93c5fd", "#9ca3af", "#2563eb", "#f59e0b"]}
          />
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ✖
        </button>
      </div>
    </div>
  );
};

export default ModalEstadisticas;
