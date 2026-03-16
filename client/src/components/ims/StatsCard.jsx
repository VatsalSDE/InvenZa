import React from "react";

const StatsCard = ({ title, value, icon: Icon, accentColor = "green", change, subtitle }) => {
  const colorMap = {
    green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20", line: "bg-green-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", line: "bg-blue-500" },
    red: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", line: "bg-red-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", line: "bg-orange-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", line: "bg-purple-500" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", line: "bg-yellow-500" },
  };
  const colors = colorMap[accentColor] || colorMap.green;

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-5 hover:border-green-500/30 transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center`}>
          {typeof Icon === 'string' ? (
            <span className="text-lg">{Icon}</span>
          ) : Icon ? (
            <Icon className={`w-4 h-4 ${colors.text}`} />
          ) : null}
        </div>
        {change !== undefined && change !== null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${change >= 0
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
            }`}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-500">{title}</p>
      {subtitle && <p className="text-xs text-zinc-600 mt-1">{subtitle}</p>}
      {/* Accent line */}
      <div className={`mt-3 h-0.5 ${colors.line} rounded-full opacity-40`}></div>
    </div>
  );
};

export default StatsCard;