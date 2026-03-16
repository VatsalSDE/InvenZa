import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AdminNavitems } from "../../data/AdminNavItems";
import { X } from "lucide-react";
import { clearToken } from "../../apiClient";

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="w-[220px] h-full bg-[#111111] flex flex-col border-r border-[#1F1F1F] relative">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">INVENZA</h1>
            <p className="text-[11px] text-zinc-600 mt-0.5">Gas Stove Inventory</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-zinc-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
        {AdminNavitems.map((item, index) => {
          // Section header
          if (item.section) {
            return (
              <div key={`section-${index}`} className="mt-6 mb-2 px-3 first:mt-2">
                <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-[0.15em]">
                  {item.section}
                </span>
              </div>
            );
          }

          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          if (item.isLogout) {
            return (
              <button
                key={item.label}
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors mt-1"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 mt-0.5 relative ${isActive
                  ? "bg-green-500/10 text-green-400 border-l-2 border-green-500 ml-0 pl-[10px]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-400' : ''}`} />
              <span className={`${isActive ? 'font-medium' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom branding */}
      <div className="px-5 py-4 border-t border-[#1F1F1F]">
        <p className="text-[10px] text-zinc-700">Vinayak Lakshmi Gas Stoves</p>
        <p className="text-[10px] text-zinc-700">© 2026 INVENZA</p>
      </div>
    </div>
  );
};

export default Sidebar;
