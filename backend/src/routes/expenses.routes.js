import { Router } from 'express';
import * as expensesController from '../controllers/expenses.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Expenses Routes
 * All routes require authentication
 */
router.use(requireAuth);

router.get('/', expensesController.getAll);
router.post('/', expensesController.create);
router.put('/:id', expensesController.update);
router.delete('/:id', expensesController.remove);

export default router;
