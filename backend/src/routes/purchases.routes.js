import { Router } from 'express';
import * as purchasesController from '../controllers/purchases.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Purchases Routes
 * GET /api/purchases - Get all purchases with supplier info
 * GET /api/purchases/next-code - Get next purchase code
 * GET /api/purchases/supplier/:supplierId - Get purchases by supplier
 * GET /api/purchases/:id - Get purchase by ID with items
 * GET /api/purchases/:id/items - Get purchase items
 * POST /api/purchases - Create purchase (auto-increases stock if Received)
 * PUT /api/purchases/:id - Update a purchase
 * PUT /api/purchases/:id/status - Update status (triggers stock increase if Received)
 * DELETE /api/purchases/:id - Delete a purchase
 */

// All routes require authentication
router.use(requireAuth);

// Get routes - note: specific routes must come before /:id
router.get('/next-code', purchasesController.getNextPurchaseCode);
router.get('/supplier/:supplierId', purchasesController.getPurchasesBySupplier);
router.get('/', purchasesController.getAllPurchases);
router.get('/:id', purchasesController.getPurchaseById);
router.get('/:id/items', purchasesController.getPurchaseItems);

// Create/Update routes
router.post('/', purchasesController.createPurchase);
router.put('/:id', purchasesController.updatePurchase);
router.put('/:id/status', purchasesController.updatePurchaseStatus);

// Delete routes
router.delete('/:id', purchasesController.deletePurchase);

export default router;
