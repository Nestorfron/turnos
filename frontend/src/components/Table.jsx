import React, { useState } from "react";
import { Pencil, Trash2, SearchX, Search, Check } from "lucide-react";

const Table = ({
  columns,
  data,
  onEdit,
  onDelete,
  marcarLeida,
  renderActions,
  title,
  renderCell,
  leftAlignColumns = [],
  minWidthColumns = {},
  searchable = false,
  scrollX = true,
}) => {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  const filteredData = searchable
    ? data.filter((item) =>
        columns.some((col) =>
          String(getCellValue(item, col))
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      )
    : data;

  return (
    <section className="mb-8">
      {title && (
        <div className="flex items-center text-xl font-semibold text-blue-900 border-b border-blue-900 pb-1 mb-4">
          <span>{title}</span>

          {searchable && (
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="ml-2 p-1 rounded hover:bg-gray-200 transition"
              title="Buscar"
            >
              <Search size={20} />
            </button>
          )}
        </div>
      )}

      {searchable && showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-1/3 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
      )}

      <div
        className={`bg-white rounded-md shadow ${
          scrollX ? "overflow-x-auto" : ""
        }`}
      >
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-medium tracking-wide">
              {columns.map((col) => (
                <th
                  key={col}
                  className={`border py-2 px-2 sm:px-4 text-center ${
                    minWidthColumns[col] || ""
                  }`}
                >
                  {col}
                </th>
              ))}
              {(onEdit || onDelete || marcarLeida || renderActions) && (
                <th className="border py-2 px-2 sm:px-4 text-center">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (onEdit || onDelete || marcarLeida || renderActions ? 1 : 0)
                  }
                  className="text-center py-4 text-gray-500"
                >
                  <p className="flex items-center justify-center text-gray-500">
                    <SearchX className="mr-2" />
                    <span>No hay datos disponibles</span>
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  {columns.map((col) => {
                    let cellContent = getCellValue(item, col);
                    let cellClass = minWidthColumns[col] || "";

                    if (renderCell) {
                      const res = renderCell(item, col, cellContent);
                      if (res) {
                        cellContent = res.content;
                        cellClass = `${res.className || ""} ${cellClass}`;
                      }
                    }

                    const alignmentClass = leftAlignColumns.includes(col)
                      ? "text-left"
                      : "text-center";

                    return (
                      <td
                        key={col}
                        className={`border py-1 px-1 sm:py-2 sm:px-4 ${alignmentClass} ${cellClass}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                  {(onEdit || onDelete || marcarLeida || renderActions) && (
                    <td className="border py-1 px-1 sm:py-2 sm:px-4 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                      {renderActions ? (
                        renderActions(item)
                      ) : (
                        <>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-yellow-500 hover:text-yellow-600"
                            >
                              <Pencil size={18} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          {marcarLeida && (
                            <button
                              onClick={() => marcarLeida(item)}
                              className="text-green-500 hover:text-green-600"
                            >
                              <Check size={18} />
                            </button>
                          )}
                        </>
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
