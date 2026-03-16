import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout.jsx";
import Login from "../auth/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Products from "../pages/Products.jsx";
import Inventory from "../pages/Inventory.jsx";
// Catalogue page removed - using PDF catalogue instead
import Dealers from "../pages/Dealers.jsx";
import Orders from "../pages/Orders.jsx";
import Payments from "../pages/Payments.jsx";
import Billing from "../pages/Billing.jsx";
import SuppliersPage from "../pages/SuppliersPage.jsx";
import PurchasesPage from "../pages/PurchasesPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import ProfitPage from "../pages/ProfitPage.jsx";
import React from "react";
import LandingPage from "../pages/LandingPage.jsx";
import { isAuthenticated } from "../apiClient";

function ProtectedRoute({ children }) {
  const location = useLocation();
  // Default: do NOT require auth unless explicitly enabled via VITE_REQUIRE_AUTH=true
  const REQUIRE_AUTH = import.meta.env.VITE_REQUIRE_AUTH === "true";

  if (!REQUIRE_AUTH && location.pathname.startsWith("/admin")) {
    return children;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

const Adminroutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="inventory" element={<Inventory />} />
        {/* Catalogue route removed - using PDF catalogue instead */}
        <Route path="dealers" element={<Dealers />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="billing" element={<Billing />} />
        <Route path="profit" element={<ProfitPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/login" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default Adminroutes;
