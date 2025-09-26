import React from "react";

export default function Input({ label, hint, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-sm font-semibold text-gray-700 mb-2">{label}</span>
      )}
      <input
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-800"
        {...rest}
      />
      {hint && <span className="text-xs text-gray-500 mt-1 block">{hint}</span>}
    </label>
  );
}


