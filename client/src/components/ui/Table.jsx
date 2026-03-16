import React from "react";

export function Table({ columns = [], data = [], keyField, emptyMessage = "No records found" }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              {columns.map((col) => (
                <th key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {data.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-zinc-600" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
            {data.map((row, index) => (
              <tr key={keyField ? row[keyField] : index} className="hover:bg-white/[0.02]">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-3 text-sm text-zinc-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
