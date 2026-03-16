import supabase from '../config/supabase.js';

/**
 * Profit Service
 * Handles all P&L calculation logic using Supabase queries
 * Uses Last Purchase Price method for COGS
 */

/**
 * Get the last purchase unit_cost for a product (before or on a given date)
 */
const getLastPurchaseCost = async (productId, beforeDate) => {
    // Get the most recent purchase_item for this product from a Received purchase
    const { data, error } = await supabase
        .from('purchase_items')
        .select('unit_cost, purchases!inner(purchase_id, status, created_at)')
        .eq('product_id', productId)
        .eq('purchases.status', 'received')
        .lte('purchases.created_at', beforeDate)
        .order('purchases(created_at)', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }
    return parseFloat(data[0].unit_cost);
};

/**
 * Fallback: get ANY last purchase cost for a product (no date filter)
 */
const getAnyLastPurchaseCost = async (productId) => {
    const { data, error } = await supabase
        .from('purchase_items')
        .select('unit_cost, purchases!inner(purchase_id, status, created_at)')
        .eq('product_id', productId)
        .eq('purchases.status', 'received')
        .order('purchases(created_at)', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) {
        return null;
    }
    return parseFloat(data[0].unit_cost);
};

/**
 * GET /api/profit/summary
 */
export const getProfitSummary = async (startDate, endDate) => {
    // 1. Total Revenue — sum of total_amount from completed orders in range
    const { data: orders, error: ordersErr } = await supabase
        .from('orders')
        .select('order_id, total_amount, created_at')
        .eq('order_status', 'Completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

    if (ordersErr) {
        console.error('Error fetching orders for summary:', ordersErr);
        throw { statusCode: 500, message: 'Failed to fetch revenue data' };
    }

    const totalRevenue = (orders || []).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    // 2. COGS — for each order_item in those orders, find last purchase cost
    let totalCOGS = 0;
    const orderIds = (orders || []).map(o => o.order_id);

    if (orderIds.length > 0) {
        const { data: orderItems, error: oiErr } = await supabase
            .from('order_items')
            .select('product_id, quantity, unit_price')
            .in('order_id', orderIds);

        if (oiErr) {
            console.error('Error fetching order items:', oiErr);
            throw { statusCode: 500, message: 'Failed to fetch order items' };
        }

        // Get all products for fallback pricing
        const productIds = [...new Set((orderItems || []).map(oi => oi.product_id))];
        const { data: products } = await supabase
            .from('products')
            .select('product_id, price')
            .in('product_id', productIds);

        const productPriceMap = {};
        (products || []).forEach(p => { productPriceMap[p.product_id] = parseFloat(p.price) || 0; });

        // Build a cache for purchase costs
        const costCache = {};
        for (const oi of (orderItems || [])) {
            if (costCache[oi.product_id] === undefined) {
                const cost = await getAnyLastPurchaseCost(oi.product_id);
                costCache[oi.product_id] = cost !== null ? cost : productPriceMap[oi.product_id] || 0;
            }
            totalCOGS += costCache[oi.product_id] * (parseInt(oi.quantity) || 0);
        }
    }

    // 3. Total Expenses
    const { data: expenses, error: expErr } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

    if (expErr) {
        console.error('Error fetching expenses:', expErr);
        // Don't throw — expenses table might not exist yet
    }

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const profitMarginPercentage = totalRevenue > 0
        ? Math.round((netProfit / totalRevenue) * 1000) / 10
        : 0;

    return {
        total_revenue: totalRevenue,
        total_cost_of_goods: totalCOGS,
        total_expenses: totalExpenses,
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin_percentage: profitMarginPercentage,
    };
};

/**
 * GET /api/profit/monthly-trend
 */
export const getMonthlyTrend = async (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];

    // Generate month buckets
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
        months.push({
            year: cursor.getFullYear(),
            month: cursor.getMonth(),
            label: cursor.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    // Fetch all completed orders in the full range
    const { data: orders } = await supabase
        .from('orders')
        .select('order_id, total_amount, created_at')
        .eq('order_status', 'Completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

    // Fetch all order items for those orders
    const orderIds = (orders || []).map(o => o.order_id);
    let orderItems = [];
    if (orderIds.length > 0) {
        const { data } = await supabase
            .from('order_items')
            .select('order_id, product_id, quantity, unit_price')
            .in('order_id', orderIds);
        orderItems = data || [];
    }

    // Build product cost cache
    const productIds = [...new Set(orderItems.map(oi => oi.product_id))];
    const costCache = {};
    const { data: products } = await supabase
        .from('products')
        .select('product_id, price')
        .in('product_id', productIds.length > 0 ? productIds : [0]);
    const productPriceMap = {};
    (products || []).forEach(p => { productPriceMap[p.product_id] = parseFloat(p.price) || 0; });

    for (const pid of productIds) {
        const cost = await getAnyLastPurchaseCost(pid);
        costCache[pid] = cost !== null ? cost : productPriceMap[pid] || 0;
    }

    // Fetch all expenses in range
    const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

    // Map orders to months
    const orderMonthMap = {};
    (orders || []).forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!orderMonthMap[key]) orderMonthMap[key] = [];
        orderMonthMap[key].push(o);
    });

    // Map order items by order_id
    const oiByOrder = {};
    orderItems.forEach(oi => {
        if (!oiByOrder[oi.order_id]) oiByOrder[oi.order_id] = [];
        oiByOrder[oi.order_id].push(oi);
    });

    // Map expenses to months
    const expMonthMap = {};
    (expenses || []).forEach(e => {
        const d = new Date(e.expense_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!expMonthMap[key]) expMonthMap[key] = 0;
        expMonthMap[key] += parseFloat(e.amount) || 0;
    });

    return months.map(m => {
        const key = `${m.year}-${m.month}`;
        const monthOrders = orderMonthMap[key] || [];
        const revenue = monthOrders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);

        let cogs = 0;
        monthOrders.forEach(o => {
            const items = oiByOrder[o.order_id] || [];
            items.forEach(oi => {
                cogs += (costCache[oi.product_id] || 0) * (parseInt(oi.quantity) || 0);
            });
        });

        const monthExpenses = expMonthMap[key] || 0;
        const netProfit = revenue - cogs - monthExpenses;

        return {
            month_label: m.label,
            revenue,
            cost_of_goods: cogs,
            expenses: monthExpenses,
            net_profit: netProfit,
        };
    });
};

/**
 * GET /api/profit/product-breakdown
 */
export const getProductBreakdown = async (startDate, endDate) => {
    // Get completed orders in range
    const { data: orders } = await supabase
        .from('orders')
        .select('order_id')
        .eq('order_status', 'Completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

    const orderIds = (orders || []).map(o => o.order_id);
    if (orderIds.length === 0) return [];

    // Get order items with product info
    const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, unit_price, products(product_name, price)')
        .in('order_id', orderIds);

    // Group by product
    const productMap = {};
    (orderItems || []).forEach(oi => {
        const pid = oi.product_id;
        if (!productMap[pid]) {
            productMap[pid] = {
                product_name: oi.products?.product_name || 'Unknown',
                fallback_price: parseFloat(oi.products?.price) || 0,
                units_sold: 0,
                revenue: 0,
                items: [],
            };
        }
        productMap[pid].units_sold += parseInt(oi.quantity) || 0;
        productMap[pid].revenue += (parseInt(oi.quantity) || 0) * (parseFloat(oi.unit_price) || 0);
        productMap[pid].items.push(oi);
    });

    // Calculate costs
    const result = [];
    for (const [pid, info] of Object.entries(productMap)) {
        const purchaseCost = await getAnyLastPurchaseCost(parseInt(pid));
        const unitCost = purchaseCost !== null ? purchaseCost : info.fallback_price;
        const isEstimated = purchaseCost === null;
        const cost = unitCost * info.units_sold;
        const grossProfit = info.revenue - cost;
        const marginPercentage = info.revenue > 0
            ? Math.round((grossProfit / info.revenue) * 1000) / 10
            : 0;

        result.push({
            product_name: info.product_name,
            units_sold: info.units_sold,
            revenue: info.revenue,
            cost,
            gross_profit: grossProfit,
            margin_percentage: marginPercentage,
            cost_estimated: isEstimated,
        });
    }

    result.sort((a, b) => b.gross_profit - a.gross_profit);
    return result;
};

/**
 * GET /api/profit/dealer-contribution
 */
export const getDealerContribution = async (startDate, endDate) => {
    // Get completed orders with dealer info
    const { data: orders } = await supabase
        .from('orders')
        .select('dealer_id, total_amount, dealers(firm_name)')
        .eq('order_status', 'Completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

    if (!orders || orders.length === 0) return [];

    const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);

    // Group by dealer
    const dealerMap = {};
    orders.forEach(o => {
        const did = o.dealer_id;
        if (!dealerMap[did]) {
            dealerMap[did] = {
                firm_name: o.dealers?.firm_name || 'Unknown',
                total_revenue: 0,
            };
        }
        dealerMap[did].total_revenue += parseFloat(o.total_amount) || 0;
    });

    const result = Object.values(dealerMap).map(d => ({
        firm_name: d.firm_name,
        total_revenue: d.total_revenue,
        revenue_percentage: totalRevenue > 0
            ? Math.round((d.total_revenue / totalRevenue) * 1000) / 10
            : 0,
    }));

    result.sort((a, b) => b.total_revenue - a.total_revenue);
    return result;
};

export default {
    getProfitSummary,
    getMonthlyTrend,
    getProductBreakdown,
    getDealerContribution,
};
