import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#1e40af", "#2563eb"];

const DonutChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} funcionario${value > 1 ? "s" : ""}`, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DonutChart;
