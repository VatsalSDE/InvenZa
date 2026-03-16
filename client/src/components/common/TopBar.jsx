import React, { useState } from "react";
import { Search, Bell, User, ChevronDown, Menu } from "lucide-react";

const TopBar = ({ onToggleSidebar }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="w-full h-16 bg-[#0F0F0F] border-b border-[#1F1F1F] flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm text-zinc-500">Hello!</p>
          <p className="text-sm font-medium text-white">{dateStr}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[#2A2A2A]">
          <div className="w-8 h-8 bg-[#222222] rounded-full flex items-center justify-center border border-[#2A2A2A]">
            <User className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">Admin</p>
            <p className="text-[11px] text-zinc-500 leading-tight">Owner</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;