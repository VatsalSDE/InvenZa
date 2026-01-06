import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

const router = Router();

// Helper function to validate and sanitize payment data
const validatePaymentData = (data) => {
  const errors = [];
  const sanitized = {};

  // Validate dealer_id
  if (!data.dealer_id || data.dealer_id === '' || data.dealer_id === null || data.dealer_id === undefined) {
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
  if (!data.paid_amount || data.paid_amount === '' || data.paid_amount === null || data.paid_amount === undefined) {
    errors.push('Paid amount is required');
  } else {
    const paidAmount = parseFloat(data.paid_amount);
    if (isNaN(paidAmount) || paidAmount <= 0) {
      errors.push('Paid amount must be a valid positive number');
    } else {
      sanitized.paid_amount = paidAmount;
    }
  }

  // Validate and sanitize order_id (optional)
  if (data.order_id && data.order_id !== '' && data.order_id !== null && data.order_id !== undefined) {
    const orderId = parseInt(data.order_id);
    if (isNaN(orderId) || orderId <= 0) {
      errors.push('Order ID must be a valid positive number if provided');
    } else {
      sanitized.order_id = orderId;
    }
  } else {
    sanitized.order_id = null;
  }

  // Validate and sanitize payment_method
  const allowedMethods = ['Cash', 'UPI', 'Card', 'NEFT', 'Online', 'Bank Transfer', 'Cheque'];
  if (!data.payment_method || !allowedMethods.includes(data.payment_method)) {
    sanitized.payment_method = 'Cash'; // Default value
  } else {
    sanitized.payment_method = data.payment_method;
  }

  // Validate payment_status (Completed or Pending)
  const allowedStatus = ['Completed', 'Pending'];
  if (!data.payment_status || !allowedStatus.includes(data.payment_status)) {
    sanitized.payment_status = 'Completed';
  } else {
    sanitized.payment_status = data.payment_status;
  }

  // Generate transaction_id if not provided
  sanitized.transaction_id = data.reference_number || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Validate and sanitize payment_date
  if (data.payment_date && data.payment_date !== '') {
    const date = new Date(data.payment_date);
    if (isNaN(date.getTime())) {
      errors.push('Payment date must be a valid date');
    } else {
      sanitized.payment_date = data.payment_date;
    }
  } else {
    sanitized.payment_date = null; // Will use CURRENT_TIMESTAMP
  }

  // Sanitize notes
  sanitized.notes = data.notes || null;

  return { errors, sanitized };
};

router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT 
        p.payment_id,
        p.dealer_id,
        p.order_id,
        p.paid_amount,
        p.method as payment_method,
        p.transaction_id,
        p.payment_date,
        COALESCE(p.payment_status, 'Completed') as payment_status,
        d.firm_name as dealer_name,
        o.order_code
       FROM payments p
       LEFT JOIN dealers d ON d.dealer_id = p.dealer_id
       LEFT JOIN orders o ON o.order_id = p.order_id
       ORDER BY p.payment_date DESC`);
    res.json(rows);
  } catch (e) {
    console.error('❌ Failed to fetch payments:', e);
    res.status(500).json({ message: 'Failed to fetch payments: ' + e.message });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Payment creation request body:', req.body);
    
    // Validate and sanitize input data
    const { errors, sanitized } = validatePaymentData(req.body);
    
    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors,
        received: req.body
      });
    }

    console.log('✅ Validation passed, sanitized data:', sanitized);

    // Check if dealer exists
    const dealerCheck = await query('SELECT dealer_id FROM dealers WHERE dealer_id = $1', [sanitized.dealer_id]);
    if (dealerCheck.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Dealer not found',
        dealer_id: sanitized.dealer_id
      });
    }

    // Check if order exists (if provided)
    if (sanitized.order_id) {
      const orderCheck = await query('SELECT order_id FROM orders WHERE order_id = $1', [sanitized.order_id]);
      if (orderCheck.rows.length === 0) {
        return res.status(400).json({ 
          message: 'Order not found',
          order_id: sanitized.order_id
        });
      }
    }

    // Insert payment with proper error handling
    const sql = `
      INSERT INTO payments (
        dealer_id, 
        order_id, 
        paid_amount, 
        method, 
        transaction_id, 
        payment_date,
        payment_status
      ) VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_TIMESTAMP), $7) 
      RETURNING *
    `;
    
    const values = [
      sanitized.dealer_id,
      sanitized.order_id,
      sanitized.paid_amount,
      sanitized.payment_method,
      sanitized.transaction_id,
      sanitized.payment_date,
      sanitized.payment_status
    ];

    console.log('📤 Executing SQL:', sql);
    console.log('📤 With values:', values);

    const { rows } = await query(sql, values);
    
    console.log('✅ Payment created successfully:', rows[0]);
    res.status(201).json(rows[0]);
    
  } catch (e) {
    console.error('❌ Payment creation error:', e);
    
    // Provide specific error messages for common database errors
    let errorMessage = 'Failed to create payment';
    
    if (e.code === '23505') { // Unique constraint violation
      errorMessage = 'Transaction ID already exists';
    } else if (e.code === '23503') { // Foreign key constraint violation
      errorMessage = 'Referenced dealer or order does not exist';
    } else if (e.code === '22P02') { // Invalid text representation
      errorMessage = 'Invalid data format provided';
    } else if (e.code === '23514') { // Check constraint violation
      errorMessage = 'Payment method not allowed';
    }
    
    res.status(500).json({ 
      message: errorMessage + ': ' + e.message,
      code: e.code,
      detail: e.detail
    });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate payment ID
    const paymentId = parseInt(id);
    if (isNaN(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }

    console.log('🔍 Payment update request for ID:', id, 'Body:', req.body);
    
    // Validate and sanitize input data
    const { errors, sanitized } = validatePaymentData(req.body);
    
    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors
      });
    }

    // Check if payment exists
    const existingPayment = await query('SELECT payment_id FROM payments WHERE payment_id = $1', [paymentId]);
    if (existingPayment.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if dealer exists
    const dealerCheck = await query('SELECT dealer_id FROM dealers WHERE dealer_id = $1', [sanitized.dealer_id]);
    if (dealerCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Dealer not found' });
    }

    // Check if order exists (if provided)
    if (sanitized.order_id) {
      const orderCheck = await query('SELECT order_id FROM orders WHERE order_id = $1', [sanitized.order_id]);
      if (orderCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Order not found' });
      }
    }

    // Update payment
    const sql = `
      UPDATE payments 
      SET dealer_id = $1, 
          order_id = $2, 
          paid_amount = $3, 
          method = $4, 
          payment_date = COALESCE($5, CURRENT_TIMESTAMP),
          payment_status = $6
      WHERE payment_id = $7 
      RETURNING *
    `;
    
    const values = [
      sanitized.dealer_id,
      sanitized.order_id,
      sanitized.paid_amount,
      sanitized.payment_method,
      sanitized.payment_date,
      sanitized.payment_status,
      paymentId
    ];

    const { rows } = await query(sql, values);
    
    console.log('✅ Payment updated successfully:', rows[0]);
    res.json(rows[0]);
    
  } catch (e) {
    console.error('❌ Payment update error:', e);
    res.status(500).json({ message: 'Failed to update payment: ' + e.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate payment ID
    const paymentId = parseInt(id);
    if (isNaN(paymentId) || paymentId <= 0) {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }

    // Check if payment exists
    const existingPayment = await query('SELECT payment_id FROM payments WHERE payment_id = $1', [paymentId]);
    if (existingPayment.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Delete payment
    await query('DELETE FROM payments WHERE payment_id = $1', [paymentId]);
    
    console.log('✅ Payment deleted successfully, ID:', paymentId);
    res.status(204).send();
    
  } catch (e) {
    console.error('❌ Payment deletion error:', e);
    res.status(500).json({ message: 'Failed to delete payment: ' + e.message });
  }
});

export default router;