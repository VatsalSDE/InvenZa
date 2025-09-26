import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminNavitems } from "../../data/AdminNavItems";
import { X } from "lucide-react";
import logo from '../../assets/images/logo.png'

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <div className="w-80 h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl border-r border-white/10 flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent"></div>
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Close Button for Mobile */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Logo Section */}
      {/* <div className="relative z-10 flex flex-col items-center pt-8 pb-8 px-6">
        <div className="relative group">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
            <span className="text-white font-bold text-2xl"></span>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300"></div>
        </div>
        <div className="text-center mt-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            INVENZA
          </h1>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Gas Stove Inventory
          </p>
        </div>
      </div> */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-8 px-6">
    <div className="relative group">
    <div className="w- h-20">
  <img
    src={logo}
    alt="Invenza Logo"
    className="w-500 h-20 object-contain rounded-xl bg-white p-2 cursor-pointer"
    onClick={() => handleNavigation('/admin/dashboard')}
  />
</div>
  </div>
  <div className="text-center mt-4">
    <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
      INVENZA
    </h1>
    <p className="text-sm text-slate-300 mt-1 font-medium">
      Gas Stove Inventory
    </p>
  </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex flex-col px-4 space-y-2 flex-1 overflow-y-auto scrollbar-hide">
        {AdminNavitems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <div
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`group relative flex items-center gap-4 px-6 py-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 shadow-lg"
                  : "hover:bg-white/10 hover:backdrop-blur-sm hover:border hover:border-white/10"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full"></div>
              )}

              {/* Icon container */}
              <div
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg"
                    : "bg-white/10 group-hover:bg-white/20"
                }`}
              >
                <img
                  src={item.icon}
                  alt={`${item.label} icon`}
                  className="w-6 h-6 object-contain filter brightness-0 invert"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl opacity-50 blur-sm"></div>
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <span
                  className={`text-lg font-semibold transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-slate-200 group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-1 opacity-60"></div>
                )}
              </div>

              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-300"></div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
    </div>
  );
};

export default Sidebar;
