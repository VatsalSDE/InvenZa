import supabase from '../config/supabase.js';

/**
 * Dashboard Service
 * Handles all dashboard statistics and analytics
 */

/**
 * Get comprehensive dashboard statistics
 * @returns {Object} Dashboard stats
 */
export const getStats = async () => {
  try {
    // Fetch all data in parallel for efficiency
    const [
      productsResult,
      dealersResult,
      ordersResult,
      paymentsResult,
      orderItemsResult,
    ] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('dealers').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('order_items').select('product_id, quantity'),
    ]);

    const products = productsResult.data || [];
    const dealersCount = dealersResult.count || 0;
    const orders = ordersResult.data || [];
    const payments = paymentsResult.data || [];
    const orderItems = orderItemsResult.data || [];

    // Calculate product stats
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity < (p.min_stock_level || 10));
    const outOfStockProducts = products.filter(p => p.quantity === 0);
    const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    // Calculate order stats
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.order_status === 'Pending').length;
    const completedOrders = orders.filter(o => o.order_status === 'Completed').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    // Calculate outstanding payments (total billed - total paid)
    const totalBilled = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);
    const outstandingPayments = Math.max(0, totalBilled - totalPaid);

    // Calculate top selling products
    const productSales = {};
    orderItems.forEach((item) => {
      productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
    });

    const topSellingIds = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, quantity]) => ({ product_id: parseInt(id), total_sold: quantity }));

    // Get product details for top sellers
    const topSellingProducts = topSellingIds.map((item) => {
      const product = products.find(p => p.product_id === item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.product_name || 'Unknown',
        product_code: product?.product_code || '',
        total_sold: item.total_sold,
      };
    });

    // Calculate monthly revenue for last 6 months
    const monthlyRevenue = calculateMonthlyRevenue(orders);

    // Get recent activities (last 10 orders and payments combined)
    const recentActivities = getRecentActivities(orders, payments);

    return {
      overview: {
        totalProducts,
        totalDealers: dealersCount,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        inventoryValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        outstandingPayments,
      },
      lowStockProducts: lowStockProducts.slice(0, 10).map(p => ({
        product_id: p.product_id,
        product_code: p.product_code,
        product_name: p.product_name,
        quantity: p.quantity,
        min_stock_level: p.min_stock_level,
      })),
      topSellingProducts,
      monthlyRevenue,
      recentActivities,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw { statusCode: 500, message: 'Failed to fetch dashboard statistics' };
  }
};

/**
 * Calculate monthly revenue for last 6 months
 * @param {Array} orders - List of orders
 * @returns {Array} Monthly revenue data
 */
const calculateMonthlyRevenue = (orders) => {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthOrders = orders.filter((o) => {
      if (o.order_status !== 'Completed') return false;
      const orderDate = new Date(o.created_at);
      return (
        orderDate.getFullYear() === date.getFullYear() &&
        orderDate.getMonth() === date.getMonth()
      );
    });

    const revenue = monthOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    months.push({
      month: monthName,
      monthKey,
      revenue,
      orderCount: monthOrders.length,
    });
  }

  return months;
};

/**
 * Get recent activities from orders and payments
 * @param {Array} orders - List of orders
 * @param {Array} payments - List of payments
 * @returns {Array} Recent activities
 */
const getRecentActivities = (orders, payments) => {
  const activities = [];

  // Add orders as activities
  orders.slice(0, 10).forEach((order) => {
    activities.push({
      type: 'order',
      id: order.order_id,
      code: order.order_code,
      status: order.order_status,
      amount: order.total_amount,
      date: order.created_at,
      description: `Order ${order.order_code} - ${order.order_status}`,
    });
  });

  // Add payments as activities
  payments.slice(0, 10).forEach((payment) => {
    activities.push({
      type: 'payment',
      id: payment.payment_id,
      code: payment.transaction_id,
      status: payment.payment_status || 'Completed',
      amount: payment.paid_amount,
      date: payment.payment_date,
      description: `Payment ${payment.transaction_id} - ₹${payment.paid_amount}`,
    });
  });

  // Sort by date and return top 10
  return activities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
};

/**
 * Get sales data for charts — always returns last 6 months
 * @param {string} period - Time period (ignored, always 6 months)
 * @returns {Array} Sales data points with { month, revenue, orders }
 */
export const getSalesData = async (period = 'month') => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('order_id, total_amount, order_status, created_at')
    .eq('order_status', 'Completed')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching sales data:', error);
    throw { statusCode: 500, message: 'Failed to fetch sales data' };
  }

  // Always generate last 6 months
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const monthOrders = (orders || []).filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.getFullYear() === date.getFullYear() && orderDate.getMonth() === date.getMonth();
    });

    const revenue = monthOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    months.push({
      month: monthName,
      revenue,
      orders: monthOrders.length,
    });
  }

  return months;
};

/**
 * Get stock distribution data
 * @returns {Array} Stock distribution by category
 */
export const getStockDistribution = async () => {
  const { data: products, error } = await supabase
    .from('products')
    .select('category, quantity, price');

  if (error) {
    console.error('Error fetching stock distribution:', error);
    throw { statusCode: 500, message: 'Failed to fetch stock distribution' };
  }

  const distribution = {};
  (products || []).forEach((product) => {
    const category = product.category || 'Other';
    if (!distribution[category]) {
      distribution[category] = { category, quantity: 0, value: 0 };
    }
    distribution[category].quantity += product.quantity || 0;
    distribution[category].value += (product.quantity || 0) * (product.price || 0);
  });

  return Object.values(distribution);
};

/**
 * Step 1: Get Business Insights for the 4 Dashboard Cards
 */
export const getBusinessInsights = async () => {
  try {
    const [
      ordersRes,
      dealersRes,
      productsRes,
      orderItemsRes,
      paymentsRes
    ] = await Promise.all([
      supabase.from('orders').select('dealer_id, order_status, total_amount'),
      supabase.from('dealers').select('dealer_id, firm_name'),
      supabase.from('products').select('product_id, product_name, min_stock_level, quantity'),
      supabase.from('order_items').select('product_id, quantity'),
      supabase.from('payments').select('paid_amount, payment_status')
    ]);

    const orders = ordersRes.data || [];
    const dealers = dealersRes.data || [];
    const products = productsRes.data || [];
    const orderItems = orderItemsRes.data || [];
    const payments = paymentsRes.data || [];

    // Card 1: Top 3 Dealers by Revenue
    const completedOrders = orders.filter(o => o.order_status === 'Completed');
    const dealerRevenueMap = {};
    completedOrders.forEach(o => {
      dealerRevenueMap[o.dealer_id] = (dealerRevenueMap[o.dealer_id] || 0) + (parseFloat(o.total_amount) || 0);
    });

    const topDealers = Object.entries(dealerRevenueMap)
      .map(([dealer_id, total_revenue]) => {
        const d = dealers.find(d => d.dealer_id == dealer_id);
        return { firm_name: d ? d.firm_name : 'Unknown', total_revenue };
      })
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 3);

    // Card 2: Slowest Moving Products
    const productSalesMap = {};
    orderItems.forEach(item => {
      productSalesMap[item.product_id] = (productSalesMap[item.product_id] || 0) + (parseInt(item.quantity) || 0);
    });

    const slowestProducts = products
      .map(p => ({
        product_name: p.product_name,
        total_sold: productSalesMap[p.product_id] || 0
      }))
      .sort((a, b) => a.total_sold - b.total_sold)
      .slice(0, 3);

    // Card 3: Payment Collection Rate
    const totalPaid = payments
      .filter(p => p.payment_status === 'Completed')
      .reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);

    const totalOrdered = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    const collectionRate = totalOrdered > 0 ? ((totalPaid / totalOrdered) * 100).toFixed(1) : "0.0";

    // Card 4: Stock Health Summary
    let healthy = 0, low = 0, out = 0;
    products.forEach(p => {
      const minStock = p.min_stock_level || 0;
      if (p.quantity === 0) out++;
      else if (p.quantity <= minStock) low++;
      else healthy++;
    });

    return {
      topDealers,
      slowestProducts,
      collectionRate: parseFloat(collectionRate),
      stockHealth: { healthy, low, out }
    };
  } catch (error) {
    console.error("Error in getBusinessInsights:", error);
    throw error;
  }
};

/**
 * Step 5: Get Order Patterns
 */
export const getOrderPatterns = async () => {
  try {
    const { data: orders, error } = await supabase.from('orders').select('created_at');
    if (error) throw error;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = { 'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0 };

    (orders || []).forEach(o => {
      if (o.created_at) {
        const date = new Date(o.created_at);
        const dayName = days[date.getDay()];
        counts[dayName]++;
      }
    });

    return days.map(day_name => ({ day_name, order_count: counts[day_name] }));
  } catch (error) {
    console.error("Error in getOrderPatterns:", error);
    throw error;
  }
};

export default {
  getStats,
  getSalesData,
  getStockDistribution,
  getBusinessInsights,
  getOrderPatterns,
};

