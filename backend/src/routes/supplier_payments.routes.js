import { Router } from 'express';
import * as supplierPaymentsController from '../controllers/supplier_payments.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Supplier Payments Routes
 */

router.use(requireAuth);

router.get('/next-code', supplierPaymentsController.getNextSupplierPaymentCode);
router.get('/', supplierPaymentsController.getAllSupplierPayments);
router.get('/:id', supplierPaymentsController.getSupplierPaymentById);

router.post('/', supplierPaymentsController.createSupplierPayment);
router.put('/:id', supplierPaymentsController.updateSupplierPayment);

router.delete('/:id', supplierPaymentsController.deleteSupplierPayment);

router.get('/purchase/:purchaseId', supplierPaymentsController.getSupplierPaymentsByPurchase);

export default router;
