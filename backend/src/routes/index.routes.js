import { Router } from 'express';
import authRoutes from './auth.routes.js';
import productsRoutes from './products.routes.js';
import dealersRoutes from './dealers.routes.js';
import ordersRoutes from './orders.routes.js';
import paymentsRoutes from './payments.routes.js';
import billingRoutes from './billing.routes.js';
import suppliersRoutes from './suppliers.routes.js';
import purchasesRoutes from './purchases.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import supplierPaymentsRoutes from './supplier_payments.routes.js';
import profitRoutes from './profit.routes.js';
import expensesRoutes from './expenses.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

/**
 * API Routes Index
 * Mounts all route modules under /api prefix
 */

// Authentication
router.use('/auth', authRoutes);

// Core business modules
router.use('/products', productsRoutes);
router.use('/dealers', dealersRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/billing', billingRoutes);

// New modules
router.use('/suppliers', suppliersRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/supplier-payments', supplierPaymentsRoutes);

// Dashboard & Analytics
router.use('/dashboard', dashboardRoutes);
router.use('/ai', aiRoutes);

// Profit & Loss
router.use('/profit', profitRoutes);
router.use('/expenses', expensesRoutes);

export default router;
