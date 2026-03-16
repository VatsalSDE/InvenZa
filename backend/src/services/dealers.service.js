import supabase from '../config/supabase.js';
import { generateDealerCode } from '../utils/codeGenerator.js';

/**
 * Dealers Service
 * Handles all dealer-related business logic and Supabase queries
 */

/**
 * Get all dealers
 * @param {Object} filters - Optional filters
 * @returns {Array} List of dealers
 */
export const getAllDealers = async (filters = {}) => {
  let query = supabase
    .from('dealers')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.or(
      `firm_name.ilike.%${filters.search}%,person_name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching dealers:', error);
    throw { statusCode: 500, message: 'Failed to fetch dealers' };
  }

  return data || [];
};

/**
 * Get dealer by ID
 * @param {number} dealerId - Dealer ID
 * @returns {Object} Dealer data
 */
export const getDealerById = async (dealerId) => {
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('dealer_id', dealerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Dealer not found' };
    }
    console.error('Error fetching dealer:', error);
    throw { statusCode: 500, message: 'Failed to fetch dealer' };
  }

  return data;
};

/**
 * Create a new dealer
 * @param {Object} dealerData - Dealer data
 * @returns {Object} Created dealer
 */
export const createDealer = async (dealerData) => {
  const { dealer_code, firm_name, person_name, gstin, mobile_number, email, address } = dealerData;

  // Validate required fields
  if (!firm_name) {
    throw { statusCode: 400, message: 'Firm name is required' };
  }

  // Generate dealer code if not provided
  let finalDealerCode = dealer_code;
  if (!finalDealerCode) {
    const { count } = await supabase
      .from('dealers')
      .select('*', { count: 'exact', head: true });
    finalDealerCode = generateDealerCode((count || 0) + 1);
  }

  const { data, error } = await supabase
    .from('dealers')
    .insert({
      dealer_code: finalDealerCode,
      firm_name,
      person_name,
      gstin,
      mobile_number,
      email,
      address,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dealer:', error);
    throw { statusCode: 500, message: 'Failed to create dealer' };
  }

  return data;
};

/**
 * Update a dealer
 * @param {number} dealerId - Dealer ID
 * @param {Object} dealerData - Updated dealer data
 * @returns {Object} Updated dealer
 */
export const updateDealer = async (dealerId, dealerData) => {
  const { firm_name, person_name, gstin, mobile_number, email, address } = dealerData;

  const { data, error } = await supabase
    .from('dealers')
    .update({
      firm_name,
      person_name,
      gstin,
      mobile_number,
      email,
      address,
    })
    .eq('dealer_id', dealerId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw { statusCode: 404, message: 'Dealer not found' };
    }
    console.error('Error updating dealer:', error);
    throw { statusCode: 500, message: 'Failed to update dealer' };
  }

  return data;
};

/**
 * Delete a dealer
 * @param {number} dealerId - Dealer ID
 * @returns {boolean} Success status
 */
export const deleteDealer = async (dealerId) => {
  // Get all orders for this dealer to clean up order_items
  const { data: dealerOrders } = await supabase
    .from('orders')
    .select('order_id')
    .eq('dealer_id', dealerId);

  const orderIds = (dealerOrders || []).map(o => o.order_id);

  // Clean up FK references
  if (orderIds.length > 0) {
    await supabase.from('order_items').delete().in('order_id', orderIds);
  }
  await supabase.from('payments').delete().eq('dealer_id', dealerId);
  await supabase.from('orders').delete().eq('dealer_id', dealerId);

  const { error } = await supabase
    .from('dealers')
    .delete()
    .eq('dealer_id', dealerId);

  if (error) {
    console.error('Error deleting dealer:', error);
    throw { statusCode: 500, message: 'Failed to delete dealer' };
  }

  return true;
};

/**
 * Get dealer ledger (orders and payments)
 * @param {number} dealerId - Dealer ID
 * @returns {Object} Ledger with orders, payments, and balance
 */
export const getDealerLedger = async (dealerId) => {
  // Get dealer info
  const dealer = await getDealerById(dealerId);

  // Get all orders for this dealer
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('dealer_id', dealerId)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Error fetching dealer orders:', ordersError);
    throw { statusCode: 500, message: 'Failed to fetch dealer orders' };
  }

  // Get all payments for this dealer
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('dealer_id', dealerId)
    .order('payment_date', { ascending: false });

  if (paymentsError) {
    console.error('Error fetching dealer payments:', paymentsError);
    throw { statusCode: 500, message: 'Failed to fetch dealer payments' };
  }

  // Calculate totals
  const totalOrdered = (orders || []).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const totalPaid = (payments || []).reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);
  const balance = totalOrdered - totalPaid;

  return {
    dealer,
    orders: orders || [],
    payments: payments || [],
    summary: {
      totalOrdered,
      totalPaid,
      balance,
    },
  };
};

/**
 * Get outstanding balances for all dealers
 * @returns {Array} Dealers with their outstanding balances, sorted by highest first
 */
export const getOutstandingBalances = async () => {
  // Get all dealers
  const { data: dealers, error: dealersError } = await supabase
    .from('dealers')
    .select('*');

  if (dealersError) {
    console.error('Error fetching dealers:', dealersError);
    throw { statusCode: 500, message: 'Failed to fetch dealers' };
  }

  // Get all orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('dealer_id, total_amount');

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    throw { statusCode: 500, message: 'Failed to fetch orders' };
  }

  // Get all payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('dealer_id, paid_amount');

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError);
    throw { statusCode: 500, message: 'Failed to fetch payments' };
  }

  // Calculate totals per dealer
  const ordersByDealer = {};
  (orders || []).forEach((o) => {
    ordersByDealer[o.dealer_id] = (ordersByDealer[o.dealer_id] || 0) + (parseFloat(o.total_amount) || 0);
  });

  const paymentsByDealer = {};
  (payments || []).forEach((p) => {
    paymentsByDealer[p.dealer_id] = (paymentsByDealer[p.dealer_id] || 0) + (parseFloat(p.paid_amount) || 0);
  });

  // Build result array
  const result = (dealers || []).map((dealer) => {
    const totalOrdered = ordersByDealer[dealer.dealer_id] || 0;
    const totalPaid = paymentsByDealer[dealer.dealer_id] || 0;
    const balance = totalOrdered - totalPaid;

    return {
      ...dealer,
      total_ordered: totalOrdered,
      total_paid: totalPaid,
      outstanding_balance: balance,
    };
  });

  // Sort by outstanding balance (highest first), filter out zero/negative balances
  return result
    .filter((d) => d.outstanding_balance > 0)
    .sort((a, b) => b.outstanding_balance - a.outstanding_balance);
};

/**
 * Step 2: Get Dealer Payment Behaviour Scores
 * @returns {Array} List of dealers with their payment turnaround scores
 */
export const getPaymentScores = async () => {
  const { data: dealers } = await supabase.from('dealers').select('dealer_id, firm_name');
  const { data: allOrders } = await supabase.from('orders')
    .select('order_id, dealer_id, created_at, total_amount')
    .order('created_at', { ascending: true });
  const { data: allPayments } = await supabase.from('payments')
    .select('payment_id, dealer_id, order_id, payment_date, paid_amount')
    .order('payment_date', { ascending: true });

  const results = (dealers || []).map(dealer => {
    const dealerOrders = (allOrders || []).filter(o => o.dealer_id === dealer.dealer_id);
    const dealerPayments = (allPayments || []).filter(p => p.dealer_id === dealer.dealer_id);

    if (dealerPayments.length === 0) {
      return {
        dealer_id: dealer.dealer_id,
        firm_name: dealer.firm_name,
        average_days: null,
        score: null,
        score_label: 'Unrated'
      };
    }

    // Work with local copies to track balances per order
    const orderBalances = dealerOrders.map(o => ({
      ...o,
      remaining: parseFloat(o.total_amount || 0)
    }));
    const paymentDays = [];

    dealerPayments.forEach(p => {
      const pDate = new Date(p.payment_date);
      let diffDays = null;

      if (p.order_id) {
        // Case 1: Payment linked to a specific order
        const order = orderBalances.find(o => o.order_id === p.order_id);
        if (order) {
          const oDate = new Date(order.created_at);
          diffDays = Math.max(0, Math.ceil((pDate - oDate) / (1000 * 60 * 60 * 24)));
          order.remaining -= parseFloat(p.paid_amount || 0);
        }
      } else {
        // Case 2: Payment not linked to a specific order (General Payment)
        // Find oldest order that was unpaid before this payment date
        const oldestUnpaid = orderBalances.find(o => o.remaining > 0 && new Date(o.created_at) < pDate);
        if (oldestUnpaid) {
          const oDate = new Date(oldestUnpaid.created_at);
          diffDays = Math.max(0, Math.ceil((pDate - oDate) / (1000 * 60 * 60 * 24)));
          
          // Apply the payment amount to reduce outstanding balances in FIFO order
          let amountToApply = parseFloat(p.paid_amount || 0);
          for (let o of orderBalances) {
            if (amountToApply <= 0) break;
            if (o.remaining > 0 && new Date(o.created_at) < pDate) {
              const deduction = Math.min(o.remaining, amountToApply);
              o.remaining -= deduction;
              amountToApply -= deduction;
            }
          }
        }
      }

      if (diffDays !== null) {
        paymentDays.push(diffDays);
      }
    });

    if (paymentDays.length === 0) {
      return {
        dealer_id: dealer.dealer_id,
        firm_name: dealer.firm_name,
        average_days: null,
        score: null,
        score_label: 'Unrated'
      };
    }

    const avgDays = paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length;
    let score = 0;
    let label = '';

    // Scoring logic as per requirements
    if (avgDays <= 15) { score = 100; label = 'Excellent'; }
    else if (avgDays <= 30) { score = 85; label = 'Very Good'; }
    else if (avgDays <= 45) { score = 70; label = 'Good'; }
    else if (avgDays <= 60) { score = 50; label = 'Average'; }
    else if (avgDays <= 90) { score = 30; label = 'Poor'; }
    else { score = 10; label = 'Very Poor'; }

    return {
      dealer_id: dealer.dealer_id,
      firm_name: dealer.firm_name,
      average_days: Math.round(avgDays),
      score,
      score_label: label
    };
  });

  return results.sort((a, b) => (b.score || -1) - (a.score || -1));
};

/**
 * Step 3: Get Dealer's Top 3 Purchased Products
 * @param {number} dealerId - Dealer ID
 * @returns {Array} Top 3 products
 */
export const getDealerTopProducts = async (dealerId) => {
  const { data: orders } = await supabase.from('orders').select('order_id').eq('dealer_id', dealerId);
  if (!orders || orders.length === 0) return [];

  const { data: allItems } = await supabase.from('order_items').select('order_id, product_id, quantity');
  const { data: allProducts } = await supabase.from('products').select('product_id, product_name');

  const orderIdSet = new Set(orders.map(o => o.order_id));
  const dealerItems = (allItems || []).filter(item => orderIdSet.has(item.order_id));

  const productMap = {};
  dealerItems.forEach(item => {
    if (!productMap[item.product_id]) {
      productMap[item.product_id] = 0;
    }
    productMap[item.product_id] += (parseInt(item.quantity) || 0);
  });

  const results = Object.entries(productMap).map(([pid, qty]) => {
    const p = (allProducts || []).find(x => x.product_id == pid);
    return { product_id: pid, product_name: p ? p.product_name : 'Unknown', total_quantity: qty };
  }).sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 3);

  return results;
};

export default {
  getAllDealers,
  getDealerById,
  createDealer,
  updateDealer,
  deleteDealer,
  getDealerLedger,
  getOutstandingBalances,
  getPaymentScores,
  getDealerTopProducts,
};
