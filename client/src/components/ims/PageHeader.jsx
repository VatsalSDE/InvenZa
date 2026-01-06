import React from "react";

export default function PageHeader({ icon, title, description, subtitle, right, action, count }) {
  const renderIcon = () => {
    if (!icon) return null;
    // If it's already a valid React element, render as-is
    if (React.isValidElement(icon)) return icon;
    // Handle component types including forwardRef objects from icon libraries
    const isComponentType =
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && icon.$$typeof && icon.render);
    if (isComponentType) {
      const IconComp = icon;
      return <IconComp className="w-8 h-8 text-white" />;
    }
    // Fallback for emoji/text
    return <span className="text-white text-2xl">{icon}</span>;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-2xl flex items-center justify-center shadow-xl">
            {renderIcon()}
          </div>
          {typeof count === 'number' && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{count}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h1>
          {(description || subtitle) && (
            <p className="text-gray-600 mt-2 text-lg">{description || subtitle}</p>
          )}
        </div>
        {action || right}
      </div>
    </div>
  );
}


