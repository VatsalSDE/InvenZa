import supabase from '../config/supabase.js';

/**
 * AI Tools Service
 * Contains all Supabase queries needed by AI features.
 */

// --- Step 1 Tools ---
export const getWeeklyMetrics = async () => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    // This week revenue
    const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('order_status', 'Completed')
        .gte('created_at', last7Days.toISOString());
    
    const revenue = (revenueData || []).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    // This week order count
    const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last7Days.toISOString());
    
    // Payment collection rate
    const { data: paymentsData } = await supabase
        .from('payments')
        .select('paid_amount')
        .gte('payment_date', last7Days.toISOString());
    
    const payments = (paymentsData || []).reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
    
    const collectionRate = revenue > 0 ? (payments / revenue) * 100 : 0;
    
    return { revenue, orderCount: orderCount || 0, collectionRate };
};

export const get8WeekAverages = async () => {
    const last56Days = new Date();
    last56Days.setDate(last56Days.getDate() - 56);
    
    const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('order_status', 'Completed')
        .gte('created_at', last56Days.toISOString());
    
    const totalRevenue = (revenueData || []).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    const { count: totalOrderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last56Days.toISOString());
    
    const { data: paymentsData } = await supabase
        .from('payments')
        .select('paid_amount')
        .gte('payment_date', last56Days.toISOString());
    
    const totalPayments = (paymentsData || []).reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
    
    return {
        avgRevenue: totalRevenue / 8,
        avgOrderCount: (totalOrderCount || 0) / 8,
        avgCollectionRate: totalRevenue > 0 ? (totalPayments / totalRevenue) * 100 : 0
    };
};

// --- Step 2 Tools ---
export const getDealerRiskData = async () => {
    // 1. Get all dealers
    const { data: dealers } = await supabase
        .from('dealers')
        .select('dealer_id, firm_name');

    if (!dealers) return [];

    const riskData = await Promise.all(dealers.map(async (dealer) => {
        // Signal 1: Payment Delay Score
        const { data: payments } = await supabase
            .from('payments')
            .select('payment_date, order_id, orders(created_at)')
            .eq('dealer_id', dealer.dealer_id)
            .not('payment_date', 'is', null);

        let delayScore = 2; // Default
        if (payments && payments.length > 0) {
            const delays = payments.map(p => {
                const pDate = new Date(p.payment_date);
                const oDate = p.orders ? new Date(p.orders.created_at) : pDate; // Fallback to same day if no order linked
                return Math.max(0, (pDate - oDate) / (1000 * 60 * 60 * 24));
            });
            const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
            delayScore = avgDelay < 30 ? 1 : avgDelay <= 60 ? 2 : 3;
        }

        // Signal 2: Order Frequency Drop
        const now = new Date();
        const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
        const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(now.getDate() - 60);

        const { count: currentOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('dealer_id', dealer.dealer_id)
            .gte('created_at', thirtyDaysAgo.toISOString());

        const { count: previousOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('dealer_id', dealer.dealer_id)
            .gte('created_at', sixtyDaysAgo.toISOString())
            .lt('created_at', thirtyDaysAgo.toISOString());

        const frequencyDrop = (previousOrders >= 2 && currentOrders < (previousOrders * 0.5));

        // Signal 3: Outstanding balance age
        const { data: unpaidOrders } = await supabase
            .from('orders')
            .select('order_id, created_at, total_amount')
            .eq('dealer_id', dealer.dealer_id);
            
        let oldOutstanding = false;
        if (unpaidOrders && unpaidOrders.length > 0) {
            for (const order of unpaidOrders) {
                const { data: orderPayments } = await supabase
                    .from('payments')
                    .select('paid_amount')
                    .eq('order_id', order.order_id);
                
                const totalPaid = (orderPayments || []).reduce((s, p) => s + parseFloat(p.paid_amount || 0), 0);
                if (totalPaid < parseFloat(order.total_amount)) {
                    const ageDays = (now - new Date(order.created_at)) / (1000 * 60 * 60 * 24);
                    if (ageDays > 60) {
                        oldOutstanding = true;
                        break;
                    }
                }
            }
        }

        return {
            dealer_id: dealer.dealer_id,
            firm_name: dealer.firm_name,
            signals: {
                delayScore,
                frequencyDrop,
                oldOutstanding
            }
        };
    }));

    return riskData;
};

// --- Step 3 Tools ---
export const getProductVelocityData = async () => {
    const last60Days = new Date();
    last60Days.setDate(last60Days.getDate() - 60);

    // 1. Get all products
    const { data: products } = await supabase
        .from('products')
        .select('*');

    if (!products) return [];

    // 2. Get sales in last 60 days
    const { data: sales } = await supabase
        .from('order_items')
        .select('product_id, quantity, orders!inner(order_status, created_at)')
        .eq('orders.order_status', 'Completed')
        .gte('orders.created_at', last60Days.toISOString());

    // 3. Get supplier mapping
    const { data: modelMapping, error: mappingError } = await supabase
        .from('supplier_models')
        .select('supplier_id, product_name, suppliers(firm_name)');
    
    // Resilience: If table is missing, use empty mapping instead of crashing
    const mapping = mappingError ? [] : (modelMapping || []);

    const velocityData = products.map(product => {
        const productSales = (sales || [])
            .filter(s => s.product_id === product.product_id)
            .reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);

        const weeklyVelocity = parseFloat((productSales / 8.57).toFixed(2));
        const daysRemaining = weeklyVelocity > 0 ? Math.floor(product.quantity / (weeklyVelocity / 7)) : 999;

        // Supplier mapping: ILIKE match
        let supplierName = "Unknown Supplier";
        if (mapping.length > 0) {
            const match = mapping.find(m => 
                (m.product_name && m.product_name.toLowerCase().includes(product.product_name.toLowerCase())) ||
                (product.product_name && product.product_name.toLowerCase().includes(m.product_name?.toLowerCase()))
            );
            if (match && match.suppliers) {
                supplierName = match.suppliers.firm_name;
            }
        }

        return {
            product_name: product.product_name,
            current_quantity: product.quantity,
            weekly_velocity: weeklyVelocity,
            days_remaining: daysRemaining,
            recommended_order_quantity: Math.ceil(weeklyVelocity * 4),
            supplier_name: supplierName
        };
    });

    return velocityData;
};

// --- Step 4 Tools ---
export const getDashboardAIData = async () => {
    // 1. Pending orders count
    const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('order_status', 'Pending');

    // 2. Low stock product names
    const { data: products } = await supabase
        .from('products')
        .select('product_name, quantity, min_stock_level');
    
    const lowStockNames = (products || [])
        .filter(p => p.quantity <= (p.min_stock_level || 10))
        .map(p => p.product_name);

    // 3. Top 3 dealers with highest outstanding
    const { data: dealers } = await supabase
        .from('dealers')
        .select('dealer_id, firm_name');

    const { data: allOrders } = await supabase
        .from('orders')
        .select('dealer_id, total_amount');

    const { data: allPayments } = await supabase
        .from('payments')
        .select('dealer_id, paid_amount')
        .in('payment_status', ['Completed', 'success', 'paid']);

    const dealerBalances = (dealers || []).map(dealer => {
        const totalBilled = (allOrders || [])
            .filter(o => o.dealer_id === dealer.dealer_id)
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        const totalPaid = (allPayments || [])
            .filter(p => p.dealer_id === dealer.dealer_id)
            .reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
        
        return {
            firm_name: dealer.firm_name,
            outstanding: totalBilled - totalPaid
        };
    });

    const top3Outstanding = dealerBalances
        .filter(d => d.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 3);

    return {
        pendingCount: pendingCount || 0,
        lowStockNames,
        top3Outstanding
    };
};
