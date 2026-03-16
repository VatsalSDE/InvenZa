import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Orders Routes
 * GET /api/orders - Get all orders
 * GET /api/orders/next-code - Get next order code
 * GET /api/orders/:id - Get order by ID
 * GET /api/orders/:id/items - Get order items
 * POST /api/orders - Create a new order (deducts stock)
 * PUT /api/orders/:id - Update an order
 * PUT /api/orders/:id/status - Update order status
 * DELETE /api/orders/:id - Delete an order (restores stock)
 */

// All routes require authentication
router.use(requireAuth);

// Get routes - note: /next-code must come before /:id
router.get('/next-code', ordersController.getNextOrderCode);
router.get('/', ordersController.getAllOrders);
router.get('/:id', ordersController.getOrderById);
router.get('/:id/items', ordersController.getOrderItems);

// Create/Update routes
router.post('/', ordersController.createOrder);
router.put('/:id', ordersController.updateOrder);
router.put('/:id/status', ordersController.updateOrderStatus);

// Delete routes
router.delete('/:id', ordersController.deleteOrder);

export default router;
