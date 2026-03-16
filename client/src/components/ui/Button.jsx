import React from "react";

const variantToClasses = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300",
};

const sizeToClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  ...rest
}) {
  const classes = `${variantToClasses[variant] || variantToClasses.primary} ${
    sizeToClasses[size] || sizeToClasses.md
  } rounded-2xl transition-all duration-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black ${className}`;

  return (
    <button className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}


