import React from "react";

const colorToClasses = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  purple: "bg-purple-100 text-purple-800",
};

export default function Badge({ children, color = "gray", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        colorToClasses[color] || colorToClasses.gray
      } ${className}`}
    >
      {children}
    </span>
  );
}


