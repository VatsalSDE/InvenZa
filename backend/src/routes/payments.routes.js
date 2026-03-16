import { Router } from 'express';
import * as paymentsController from '../controllers/payments.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Payments Routes
 * GET /api/payments - Get all payments
 * GET /api/payments/next-code - Get next payment code
 * GET /api/payments/order/:orderId - Get payments for an order
 * GET /api/payments/:id - Get payment by ID
 * POST /api/payments - Create a new payment
 * PUT /api/payments/:id - Update a payment
 * DELETE /api/payments/:id - Delete a payment
 */

// All routes require authentication
router.use(requireAuth);

// Get routes - note: specific routes must come before /:id
router.get('/next-code', paymentsController.getNextPaymentCode);
router.get('/order/:orderId', paymentsController.getPaymentsByOrder);
router.get('/', paymentsController.getAllPayments);
router.get('/:id', paymentsController.getPaymentById);

// Create/Update routes
router.post('/', paymentsController.createPayment);
router.put('/:id', paymentsController.updatePayment);

// Delete routes
router.delete('/:id', paymentsController.deletePayment);

export default router;
