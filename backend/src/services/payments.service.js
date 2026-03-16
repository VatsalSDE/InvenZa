import supabase from '../config/supabase.js';
import { generatePaymentCode, getTodayDatePattern } from '../utils/codeGenerator.js';

/**
 * Payments Service
 * Handles all payment-related business logic and Supabase queries
 */

const ALLOWED_METHODS = ['Cash', 'UPI', 'Card', 'NEFT', 'Online', 'Bank Transfer', 'Cheque'];
const ALLOWED_STATUSES = ['Completed', 'Pending'];

/**
 * Validate payment data
 * @param {Object} data - Payment data to validate
 * @returns {Object} Validation result with errors and sanitized data
 */
const validatePaymentData = (data) => {
  const errors = [];
  const sanitized = {};

  // Validate dealer_id
  if (!data.dealer_id) {
    errors.push('Dealer ID is required');
  } else {
    const dealerId = parseInt(data.dealer_id);
    if (isNaN(dealerId) || dealerId <= 0) {
      errors.push('Dealer ID must be a valid positive number');
    } else {
      sanitized.dealer_id = dealerId;
    }
  }

  // Validate paid_amount
  if (!data.paid_amount) {
    errors.push('Paid amount is required');
  } else {
    const paidAmount = parseFloat(data.paid_amount);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      errors.push('Paid amount must be a valid positive number');
    } else {
      sanitized.paid_amount = paidAmount;
    }
  }

  // Validate order_id (optional)
  if (data.order_id) {
    const orderId = parseInt(data.order_id);
    if (isNaN(orderId) || orderId <= 0) {
      errors.push('Order ID must be a valid positive number if provided');
    } else {
      sanitized.order_id = orderId;
    }
  } else {
    sanitized.order_id = null;
  }

  // Validate payment_method
  sanitized.method = ALLOWED_METHODS.includes(data.payment_method) 
    ? data.payment_method 
    : 'Cash';

  // Validate payment_status
  sanitized.payment_status = ALLOWED_STATUSES.includes(data.payment_status)
    ? data.payment_status
    : 'Completed';

  // Validate payment_date
  if (data.payment_date) {
    const date = new Date(data.payment_date);
    if (isNaN(date.getTime())) {
      errors.push('Payment date must be a valid date');
    } else {
      sanitized.payment_date = data.payment_date;
    }
  }

  // Sanitize reference and notes
  sanitized.reference_number = data.reference_number || null;
  sanitized.notes = data.notes || null;

  return { errors, sanitized };
};

/**
 * Get all payments with dealer and order info
 * @param {Object} filters - Optional filters
 * @returns {Array} List of payments
 */
export const getAllPayments = async (filters = {}) => {
  let query = supabase
    .from('payments')
    .select(`
      *,
      dealers (firm_name),
      orders (order_code)
    `)
    .order('payment_date', { ascending: false });

  if (filters.status) {
    query = query.eq('payment_status', filters.status);
  }

  if (filters.dealer_id) {
    query = query.eq('dealer_id', filters.dealer_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching payments:', error);
    throw { statusCode: 500, message: 'Failed to fetch payments' };
  }

  // Flatten related data
  return (data || []).map((payment) => ({
    payment_id: payment.payment_id,
    dealer_id: payment.dealer_id,
    order_id: payment.order_id,
    paid_amount: payment.paid_amount,
    payment_method: payment.method,
    transaction_id: payment.transaction_id,
    payment_date: payment.payment_date,
    payment_status: payment.payment_status || 'Completed',
    reference_number: payment.reference_number,
    notes: payment.notes,
    dealer_name: payment.dealers?.firm_name,
    order_code: payment.orders?.order_code,
  }));
};

/**
 * Get payment by ID
 * @param {number} paymentId - Payment ID
 * @returns {Object} Payment data
 */
export const getPaymentById = async (paymentId) => {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      dealers (firm_name, person_name),
      orders (order_code, total_amount)
    `)
    .eq('payment_id', paymentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Payment not found' };
    }
    console.error('Error fetching payment:', error);
    throw { statusCode: 500, message: 'Failed to fetch payment' };
  }

  return data;
};

/**
 * Generate next payment transaction ID for today
 * @returns {string} New payment code
 */
export const generateNextPaymentCode = async () => {
  const datePattern = getTodayDatePattern();
  
  const { data, error } = await supabase
    .from('payments')
    .select('transaction_id')
    .like('transaction_id', `PAY-${datePattern}%`)
    .order('transaction_id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generating payment code:', error);
    return generatePaymentCode(1);
  }

  if (!data || data.length === 0) {
    return generatePaymentCode(1);
  }

  const lastCode = data[0].transaction_id;
  const lastSeq = parseInt(lastCode.split('-')[2]) || 0;
  return generatePaymentCode(lastSeq + 1);
};

/**
 * Create a new payment
 * @param {Object} paymentData - Payment data
 * @returns {Object} Created payment
 */
export const createPayment = async (paymentData) => {
  // Validate input
  const { errors, sanitized } = validatePaymentData(paymentData);
  
  if (errors.length > 0) {
    throw { statusCode: 400, message: 'Validation failed', errors };
  }

  // Verify dealer exists
  const { data: dealer, error: dealerError } = await supabase
    .from('dealers')
    .select('dealer_id')
    .eq('dealer_id', sanitized.dealer_id)
    .single();

  if (dealerError || !dealer) {
    throw { statusCode: 400, message: 'Dealer not found' };
  }

  // Verify order exists if provided
  if (sanitized.order_id) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_id')
      .eq('order_id', sanitized.order_id)
      .single();

    if (orderError || !order) {
      throw { statusCode: 400, message: 'Order not found' };
    }
  }

  // Generate transaction ID
  const transaction_id = await generateNextPaymentCode();

  const { data, error } = await supabase
    .from('payments')
    .insert({
      dealer_id: sanitized.dealer_id,
      order_id: sanitized.order_id,
      paid_amount: sanitized.paid_amount,
      method: sanitized.method,
      transaction_id,
      payment_date: sanitized.payment_date || new Date().toISOString(),
      payment_status: sanitized.payment_status
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    throw { statusCode: 500, message: 'Failed to create payment' };
  }

  return data;
};

/**
 * Update a payment
 * @param {number} paymentId - Payment ID
 * @param {Object} paymentData - Updated payment data
 * @returns {Object} Updated payment
 */
export const updatePayment = async (paymentId, paymentData) => {
  const { errors, sanitized } = validatePaymentData(paymentData);
  
  // For updates, allow partial validation
  const updateData = {};
  
  if (paymentData.dealer_id && !errors.includes('Dealer ID must be a valid positive number')) {
    updateData.dealer_id = sanitized.dealer_id;
  }
  if (paymentData.order_id !== undefined) {
    updateData.order_id = sanitized.order_id;
  }
  if (paymentData.paid_amount && !errors.includes('Paid amount must be a valid positive number')) {
    updateData.paid_amount = sanitized.paid_amount;
  }
  if (paymentData.payment_method) {
    updateData.method = sanitized.method;
  }
  if (paymentData.payment_status) {
    updateData.payment_status = sanitized.payment_status;
  }
  if (paymentData.payment_date) {
    updateData.payment_date = sanitized.payment_date;
  }
  // Removed reference_number and notes as they are not present in the current Supabase schema.

  const { data, error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('payment_id', paymentId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Payment not found' };
    }
    console.error('Error updating payment:', error);
    throw { statusCode: 500, message: 'Failed to update payment' };
  }

  return data;
};

/**
 * Delete a payment
 * @param {number} paymentId - Payment ID
 * @returns {boolean} Success status
 */
export const deletePayment = async (paymentId) => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('payment_id', paymentId);

  if (error) {
    console.error('Error deleting payment:', error);
    throw { statusCode: 500, message: 'Failed to delete payment' };
  }

  return true;
};

/**
 * Get payments for a specific order
 * @param {number} orderId - Order ID
 * @returns {Array} Payments for the order
 */
export const getPaymentsByOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('Error fetching payments by order:', error);
    throw { statusCode: 500, message: 'Failed to fetch payments' };
  }

  return data || [];
};

export default {
  getAllPayments,
  getPaymentById,
  generateNextPaymentCode,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByOrder,
};
