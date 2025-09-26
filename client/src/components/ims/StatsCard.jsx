import React from "react";

export default function StatsCard({ icon, label, title, value, badge, color = "gray" }) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const isComponentType = typeof icon === 'function' || (typeof icon === 'object' && icon && icon.$$typeof && icon.render);
    if (isComponentType) {
      const IconComp = icon;
      return <IconComp className="w-6 h-6 text-white" />;
    }
    return <span className="text-white text-base">{icon}</span>;
  };

  const colorMap = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    purple: "bg-purple-600",
    gray: "bg-gray-800/90",
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorMap[color] || colorMap.gray} rounded-2xl flex items-center justify-center shadow-lg text-white`}>
          {renderIcon()}
        </div>
        {badge && (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label || title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}