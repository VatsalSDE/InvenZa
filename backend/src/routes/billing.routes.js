import { Router } from 'express';
import * as billingController from '../controllers/billing.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Billing Routes
 * GET /api/billing/order/:orderId - Get bill data for an order
 * GET /api/billing/preview/:orderId - Generate bill preview (HTML)
 * GET /api/billing/download/:orderId - Download bill as HTML file
 * POST /api/billing/send-email - Send bill via email
 */

// All routes require authentication
router.use(requireAuth);

// Get routes
router.get('/order/:orderId', billingController.getBillData);
router.get('/preview/:orderId', billingController.generateBillPreview);
router.get('/download/:orderId', billingController.downloadBill);

// Post routes
router.post('/send-email', billingController.sendBillEmail);

export default router;
