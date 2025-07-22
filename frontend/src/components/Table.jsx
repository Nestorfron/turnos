import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const Table = ({ columns, data, onEdit, onDelete, title }) => {
  const getCellValue = (item, col) => {
    const keysToTry = [
      col.toLowerCase().replace(/\s+/g, "_"),
      col.toLowerCase().replace(/\s+/g, ""),
      col.toLowerCase(),
      col,
    ];
    for (const key of keysToTry) {
      if (item[key] !== undefined) return item[key];
    }
    return "-";
  };

  return (
    <section className="mb-8">
      {title && (
        <div className="flex items-center justify-between text-xl font-semibold text-blue-900 border-b border-blue-900 pb-1 mb-4">
          {title}
        </div>
      )}

      <div className="bg-white rounded-md shadow p-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
              {columns.map((col) => (
                <th
                  key={col}
                  className="border border-gray-300 py-3 px-4 text-left"
                >
                  {col}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="border border-gray-300 py-3 px-4 text-left">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                  className="text-center py-4 text-gray-500"
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="border border-gray-300 py-2 px-4"
                      title={getCellValue(item, col)}
                    >
                      {getCellValue(item, col)}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="border border-gray-300 py-2 px-4 space-x-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-yellow-500 hover:text-yellow-600"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-500 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Table;
