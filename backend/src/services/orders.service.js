import supabase from '../config/supabase.js';
import { generateOrderCode, getTodayDatePattern } from '../utils/codeGenerator.js';
import * as productsService from './products.service.js';

/**
 * Orders Service
 * Handles all order-related business logic and Supabase queries
 */

/**
 * Get all orders with dealer info
 * @param {Object} filters - Optional filters
 * @returns {Array} List of orders
 */
export const getAllOrders = async (filters = {}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      dealers (firm_name, person_name)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('order_status', filters.status);
  }

  if (filters.dealer_id) {
    query = query.eq('dealer_id', filters.dealer_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching orders:', error);
    throw { statusCode: 500, message: 'Failed to fetch orders' };
  }

  // Flatten dealer info
  return (data || []).map((order) => ({
    ...order,
    firm_name: order.dealers?.firm_name,
    dealer_name: order.dealers?.person_name,
    dealers: undefined,
  }));
};

/**
 * Get order by ID with items
 * @param {number} orderId - Order ID
 * @returns {Object} Order with items
 */
export const getOrderById = async (orderId) => {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      dealers (firm_name, person_name, gstin, mobile_number, email, address)
    `)
    .eq('order_id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Order not found' };
    }
    console.error('Error fetching order:', error);
    throw { statusCode: 500, message: 'Failed to fetch order' };
  }

  // Get order items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      products (product_code, product_name, category)
    `)
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
    throw { statusCode: 500, message: 'Failed to fetch order items' };
  }

  return {
    ...order,
    dealer: order.dealers,
    dealers: undefined,
    items: items || [],
  };
};

/**
 * Get order items
 * @param {number} orderId - Order ID
 * @returns {Array} Order items with product info
 */
export const getOrderItems = async (orderId) => {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      products (product_code, product_name, category, price)
    `)
    .eq('order_id', orderId);

  if (error) {
    console.error('Error fetching order items:', error);
    throw { statusCode: 500, message: 'Failed to fetch order items' };
  }

  return (data || []).map((item) => ({
    ...item,
    product_code: item.products?.product_code,
    product_name: item.products?.product_name,
    products: undefined,
  }));
};

/**
 * Generate next order code for today
 * @returns {string} New order code
 */
export const generateNextOrderCode = async () => {
  const datePattern = getTodayDatePattern();

  const { data, error } = await supabase
    .from('orders')
    .select('order_code')
    .like('order_code', `ORD-${datePattern}%`)
    .order('order_code', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generating order code:', error);
    return generateOrderCode(1);
  }

  if (!data || data.length === 0) {
    return generateOrderCode(1);
  }

  // Extract sequence number from last code
  const lastCode = data[0].order_code;
  const lastSeq = parseInt(lastCode.split('-')[2]) || 0;
  return generateOrderCode(lastSeq + 1);
};

/**
 * Create a new order with items
 * @param {Object} orderData - Order data with items
 * @returns {Object} Created order
 */
export const createOrder = async (orderData) => {
  const {
    order_code,
    dealer_id,
    order_status = 'Pending',
    total_amount,
    delivery_date,
    items = []
  } = orderData;

  // Validate required fields
  if (!dealer_id) {
    throw { statusCode: 400, message: 'Dealer is required' };
  }

  if (!items || items.length === 0) {
    throw { statusCode: 400, message: 'At least one item is required' };
  }

  // Verify dealer exists
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('dealer_id')
    .eq('dealer_id', dealer_id)
    .single();

  if (dealerError || !dealer) {
    throw { statusCode: 400, message: 'Dealer not found' };
  }

  // Generate order code if not provided
  const finalOrderCode = order_code || await generateNextOrderCode();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_code: finalOrderCode,
      dealer_id,
      order_status,
      total_amount: total_amount || 0,
      delivery_date,
      bill_sent: false,
    })
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw { statusCode: 500, message: 'Failed to create order' };
  }

  // Insert order items and deduct stock
  for (const item of items) {
    const { product_id, quantity, unit_price } = item;

    // Validate item
    if (!product_id || !quantity) {
      throw { statusCode: 400, message: 'Product ID and quantity are required for each item' };
    }

    // Insert order item
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.order_id,
        product_id,
        quantity,
        unit_price: unit_price || 0,
      });

    if (itemError) {
      console.error('Error creating order item:', itemError);
      throw { statusCode: 500, message: 'Failed to create order item' };
    }

    // Deduct stock
    await productsService.updateProductQuantity(product_id, -quantity);
  }

  return order;
};

/**
 * Update an order
 * @param {number} orderId - Order ID
 * @param {Object} orderData - Updated order data
 * @returns {Object} Updated order
 */
export const updateOrder = async (orderId, orderData) => {
  const {
    order_code,
    dealer_id,
    order_status,
    total_amount,
    delivery_date,
    items
  } = orderData;

  // Update order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      order_code,
      dealer_id,
      order_status,
      total_amount,
      delivery_date,
    })
    .eq('order_id', orderId)
    .select()
    .single();

  if (orderError) {
    if (orderError.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Order not found' };
    }
    console.error('Error updating order:', orderError);
    throw { statusCode: 500, message: 'Failed to update order' };
  }

  // If items provided, update them
  if (items && Array.isArray(items)) {
    // Delete existing items
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    // Insert new items
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;

      await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id,
          quantity,
          unit_price: unit_price || 0,
        });
    }
  }

  return order;
};

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @returns {Object} Updated order
 */
export const updateOrderStatus = async (orderId, status) => {
  const validStatuses = ['Pending', 'Shipping', 'Completed'];
  if (!validStatuses.includes(status)) {
    throw { statusCode: 400, message: 'Invalid status. Must be Pending, Shipping, or Completed' };
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Order not found' };
    }
    console.error('Error updating order status:', error);
    throw { statusCode: 500, message: 'Failed to update order status' };
  }

  return data;
};

/**
 * Delete an order and restore stock
 * @param {number} orderId - Order ID
 * @returns {boolean} Success status
 */
export const deleteOrder = async (orderId) => {
  // Get order items to restore stock
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('Error fetching order items for deletion:', itemsError);
  }

  // Restore stock for each item
  if (items && items.length > 0) {
    for (const item of items) {
      try {
        await productsService.updateProductQuantity(item.product_id, item.quantity);
      } catch (err) {
        console.error('Error restoring stock:', err);
      }
    }
  }

  // Nullify order_id on payments referencing this order (avoid FK constraint)
  await supabase
    .from('payments')
    .update({ order_id: null })
    .eq('order_id', orderId);

  // Delete order items
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  // Delete order
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('order_id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    throw { statusCode: 500, message: 'Failed to delete order' };
  }

  return true;
};

/**
 * Mark order as bill sent
 * @param {number} orderId - Order ID
 * @returns {Object} Updated order
 */
export const markBillSent = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ bill_sent: true })
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error marking bill as sent:', error);
    throw { statusCode: 500, message: 'Failed to mark bill as sent' };
  }

  return data;
};

export default {
  getAllOrders,
  getOrderById,
  getOrderItems,
  generateNextOrderCode,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  markBillSent,
};
