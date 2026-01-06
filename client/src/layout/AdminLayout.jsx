// ---------------------------------------------------------------- All Imports ----------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import TopBar from "../components/common/TopBar.jsx";
import CommandPalette from "../components/common/CommandPalette.jsx";

// ---------------------------------------------------------------- Admin Layout Component ----------------------------------------------------------------

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Global keyboard shortcut: Ctrl/Cmd + K to open command palette
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;
      if ((isMac ? e.metaKey : e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCmdOpen(true);
      } else if (e.key === 'Escape') {
        setIsCmdOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  return (
    <div className="w-full h-screen bg-[#F5F5F5] flex overflow-hidden relative">
      {/* ---------------------------------------------------------------- Sidebar Section  (Desktop: always visible, Mobile/Tablet: toggle ) ---------------------------------------------------------------- */}

      <div className="hidden lg:block fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </div>

      {/* ---------------------------------------------------------------- Sidebar Drawer for Mobile/Tablet ---------------------------------------------------------------- */}
      {isSidebarOpen && (
        <>
          <div className="fixed top-0 left-0 z-[60] w-[260px] h-full bg-gradient-to-b from-secondary to-primary text-white lg:hidden transition-transform duration-300">
            <Sidebar onClose={closeSidebar} />{" "}
          </div>

          <div
            className="fixed inset-0 bg-black opacity-50 z-[50] lg:hidden"
            onClick={closeSidebar}
          />
        </>
      )}

      {/* ---------------------------------------------------------------- Main Content Area ---------------------------------------------------------------- */}

      <main className="flex-1 flex flex-col lg:ml-[325px] h-full overflow-hidden">
        {/* ---------------------------------------------------------------- Top Bar Section ---------------------------------------------------------------- */}

        <header className="flex items-center justify-between h-[70px] w-full mobile:h-[80px] desktop:h-[100px]  shrink-0">
          <TopBar onToggleSidebar={toggleSidebar} />
        </header>

        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-medium shadow-md">
            Demo Mode is ON — data is synthetic for preview purposes
          </div>
        )}

        {/* Command Palette */}
        <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

        {/* ---------------------------------------------------------------- Page Content Outlet ---------------------------------------------------------------- */}
        <div className="flex-1 overflow-auto p-0 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// ---------------------------------------------------------------- Export ----------------------------------------------------------------

export default AdminLayout;
