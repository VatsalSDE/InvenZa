import {
    LayoutDashboard, Warehouse, Package, Users, Truck, PackageCheck, ShoppingCart,
    CreditCard, FileText, Settings, LogOut, IndianRupee
} from 'lucide-react';
import React from 'react';

export const AdminNavitems = [
    // MENU section
    { section: 'MENU' },
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Inventory', icon: Warehouse, path: '/admin/inventory' },
    { label: 'Products', icon: Package, path: '/admin/products' },
    { label: 'Dealers', icon: Users, path: '/admin/dealers' },
    { label: 'Suppliers', icon: Truck, path: '/admin/suppliers' },
    { label: 'Purchases', icon: PackageCheck, path: '/admin/purchases' },
    { label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { label: 'Billing', icon: FileText, path: '/admin/billing' },
    { label: 'Profit & Loss', icon: IndianRupee, path: '/admin/profit' },

    // OTHER section
    { section: 'OTHER' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
    { label: 'Logout', icon: LogOut, path: '/login', isLogout: true },
];

