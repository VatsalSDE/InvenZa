import { Router } from 'express';
import * as dealersController from '../controllers/dealers.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Dealers Routes
 * GET /api/dealers - Get all dealers
 * GET /api/dealers/outstanding - Get dealers with outstanding balances
 * GET /api/dealers/:id - Get dealer by ID
 * GET /api/dealers/:id/ledger - Get dealer ledger (orders, payments, balance)
 * POST /api/dealers - Create a new dealer
 * PUT /api/dealers/:id - Update a dealer
 * DELETE /api/dealers/:id - Delete a dealer
 */

// All routes require authentication
router.use(requireAuth);

// Get routes - note: /outstanding, /payment-scores must come before /:id
router.get('/outstanding', dealersController.getOutstandingBalances);
router.get('/payment-scores', dealersController.getPaymentScores);
router.get('/', dealersController.getAllDealers);
router.get('/:id', dealersController.getDealerById);
router.get('/:id/ledger', dealersController.getDealerLedger);
router.get('/:id/top-products', dealersController.getDealerTopProducts);

// Create/Update routes
router.post('/', dealersController.createDealer);
router.put('/:id', dealersController.updateDealer);

// Delete routes
router.delete('/:id', dealersController.deleteDealer);

export default router;
