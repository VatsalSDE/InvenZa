import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Dashboard Routes
 * GET /api/dashboard/stats - Get comprehensive dashboard statistics
 * GET /api/dashboard/sales - Get sales data for charts
 * GET /api/dashboard/stock-distribution - Get stock distribution by category
 * GET /api/dashboard/business-insights - Get AI-powered business insights
 * GET /api/dashboard/order-patterns - Get daily order patterns
 */

// All routes require authentication
router.use(requireAuth);

// Get routes
router.get('/stats', dashboardController.getStats);
router.get('/sales', dashboardController.getSalesData);
router.get('/stock-distribution', dashboardController.getStockDistribution);
router.get('/business-insights', dashboardController.getBusinessInsights);
router.get('/order-patterns', dashboardController.getOrderPatterns);

export default router;
