import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar.jsx";
import TopBar from "../components/common/TopBar.jsx";
import CommandPalette from "../components/common/CommandPalette.jsx";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
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
    <div className="w-full h-screen bg-[#0F0F0F] flex overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {isSidebarOpen && (
        <>
          <div className="fixed top-0 left-0 z-[60] h-full lg:hidden">
            <Sidebar onClose={closeSidebar} />
          </div>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
            onClick={closeSidebar}
          />
        </>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:ml-[220px] h-full overflow-hidden">
        <TopBar onToggleSidebar={toggleSidebar} />

        {/* Command Palette */}
        <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
