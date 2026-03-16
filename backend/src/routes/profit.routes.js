import { Router } from 'express';
import * as profitController from '../controllers/profit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Profit & Loss Routes
 * All routes require authentication
 */
router.use(requireAuth);

router.get('/summary', profitController.getSummary);
router.get('/monthly-trend', profitController.getMonthlyTrend);
router.get('/product-breakdown', profitController.getProductBreakdown);
router.get('/dealer-contribution', profitController.getDealerContribution);

export default router;
