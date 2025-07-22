import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Users } from "lucide-react";

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd"];

const DependenciaChart = ({ funcionarios, dependenciaNombre }) => {
  // Solo para un solo valor
  const data = [
    { name: dependenciaNombre, value: funcionarios }
  ];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {funcionarios > 0 ? (
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center text-gray-400">
          <Users size={40} />
          <p className="mt-2 text-sm">Sin funcionarios registrados</p>
        </div>
      )}
    </div>
  );
};

export default DependenciaChart;
