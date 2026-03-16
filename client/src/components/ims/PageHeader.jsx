import React from "react";

const PageHeader = ({ title, subtitle, icon: Icon, count, action, children }) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-green-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
              {count !== undefined && (
                <span className="bg-[#222222] border border-[#2A2A2A] text-zinc-400 text-xs font-medium px-2 py-0.5 rounded-md">
                  {count}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {action}
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
