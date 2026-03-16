import * as ordersService from '../services/orders.service.js';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/responseHelper.js';

/**
 * Orders Controller
 * Handles order-related HTTP requests
 */

/**
 * Get all orders
 * GET /api/orders
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      dealer_id: req.query.dealer_id,
    };
    const orders = await ordersService.getAllOrders(filters);
    return sendSuccess(res, orders);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderById(req.params.id);
    return sendSuccess(res, order);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Get order items
 * GET /api/orders/:id/items
 */
export const getOrderItems = async (req, res, next) => {
  try {
    const items = await ordersService.getOrderItems(req.params.id);
    return sendSuccess(res, items);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Create a new order
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body);
    return sendCreated(res, order, 'Order created successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update an order
 * PUT /api/orders/:id
 */
export const updateOrder = async (req, res, next) => {
  try {
    const order = await ordersService.updateOrder(req.params.id, req.body);
    return sendSuccess(res, order, 200, 'Order updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update order status
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { order_status } = req.body;
    const order = await ordersService.updateOrderStatus(req.params.id, order_status);
    return sendSuccess(res, order, 200, 'Order status updated');
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Delete an order (restores stock)
 * DELETE /api/orders/:id
 */
export const deleteOrder = async (req, res, next) => {
  try {
    await ordersService.deleteOrder(req.params.id);
    return sendNoContent(res);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Generate next order code
 * GET /api/orders/next-code
 */
export const getNextOrderCode = async (req, res, next) => {
  try {
    const code = await ordersService.generateNextOrderCode();
    return sendSuccess(res, { code });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export default {
  getAllOrders,
  getOrderById,
  getOrderItems,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getNextOrderCode,
};
