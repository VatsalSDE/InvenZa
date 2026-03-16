import { Router } from 'express';
import * as suppliersController from '../controllers/suppliers.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Suppliers Routes
 * GET /api/suppliers - Get all non-archived suppliers with models
 * GET /api/suppliers/active - Get active suppliers for dropdowns
 * GET /api/suppliers/archived - Get archived suppliers
 * GET /api/suppliers/:id - Get supplier by ID
 * POST /api/suppliers - Create a new supplier with models
 * POST /api/suppliers/:id/restore - Restore an archived supplier
 * PUT /api/suppliers/:id - Update supplier and models
 * DELETE /api/suppliers/:id - Soft delete (archive) a supplier
 * GET /api/suppliers/:id/ledger - Get supplier ledger (purchase history)
 */

// All routes require authentication
router.use(requireAuth);

// Get routes - note: specific routes must come before /:id
router.get('/active', suppliersController.getActiveSuppliers);
router.get('/archived', suppliersController.getArchivedSuppliers);
router.get('/', suppliersController.getAllSuppliers);
router.get('/:id', suppliersController.getSupplierById);
router.get('/:id/ledger', suppliersController.getSupplierLedger);
router.get('/:id/models', suppliersController.getSupplierModels);

// Create/Update routes
router.post('/', suppliersController.createSupplier);
router.post('/:id/restore', suppliersController.restoreSupplier);
router.put('/:id', suppliersController.updateSupplier);

// Delete routes (soft delete)
router.delete('/:id', suppliersController.deleteSupplier);

export default router;
