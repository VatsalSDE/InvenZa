import seedrandom from 'seedrandom';

function makeRng(seed) {
  const rng = seedrandom(String(seed || 1234));
  return () => rng();
}

function pick(arr, rnd) {
  return arr[Math.floor(rnd() * arr.length)];
}

export function generateDemoData(options = {}) {
  const {
    seed = 1234,
    numProducts = 40,
    numDealers = 8,
    months = 6
  } = options;

  const rnd = makeRng(seed);
  const today = new Date();

  // Products
  const categories = ['steel', 'glass'];
  const burnerTypes = ['Brass', 'Alloy'];
  const products = Array.from({ length: numProducts }).map((_, i) => {
    const price = Math.round(1500 + rnd() * 6500);
    const quantity = Math.max(0, Math.round(10 + rnd() * 90));
    const min_stock_level = 10 + Math.floor(rnd() * 10);
    return {
      product_id: i + 1,
      product_code: `PRD-${String(i + 1).padStart(3, '0')}`,
      product_name: `Gas Stove ${i + 1}`,
      category: pick(categories, rnd),
      no_burners: 1 + Math.floor(rnd() * 4),
      type_burner: pick(burnerTypes, rnd),
      price,
      quantity,
      min_stock_level,
      created_at: today.toISOString()
    };
  });

  // Dealers
  const dealers = Array.from({ length: numDealers }).map((_, i) => ({
    dealer_id: i + 1,
    dealer_code: `DLR-${String(i + 1).padStart(3, '0')}`,
    firm_name: `Dealer ${i + 1}`,
    gstin: `GSTIN${i + 1}`,
    created_at: today.toISOString()
  }));

  // Daily sales over last N months
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  const days = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

  const payments = [];
  const orders = [];
  const orderItems = [];

  let orderId = 1;
  let paymentId = 1;

  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const dow = date.getDay(); // 0 Sun .. 6 Sat
    const weekendFactor = (dow === 0 || dow === 6) ? 0.75 : 1.0;
    const seasonal = 0.85 + rnd() * 0.5; // 0.85..1.35

    // number of orders that day
    const numOrders = Math.max(0, Math.round((2 + rnd() * 5) * weekendFactor * seasonal));

    for (let o = 0; o < numOrders; o++) {
      const dealer = pick(dealers, rnd);
      const itemsCount = 1 + Math.floor(rnd() * 3);
      let total_amount = 0;
      const thisOrderId = orderId++;

      for (let k = 0; k < itemsCount; k++) {
        const product = pick(products, rnd);
        const qty = 1 + Math.floor(rnd() * 4);
        const unit_price = product.price;
        total_amount += qty * unit_price;
        orderItems.push({
          order_item_id: orderItems.length + 1,
          order_id: thisOrderId,
          product_id: product.product_id,
          quantity: qty,
          unit_price
        });
        product.quantity = Math.max(0, product.quantity - qty);
      }

      orders.push({
        order_id: thisOrderId,
        order_code: `ORD-${String(thisOrderId).padStart(4, '0')}`,
        dealer_id: dealer.dealer_id,
        order_status: rnd() < 0.85 ? 'Completed' : 'Pending',
        total_amount,
        delivery_date: date.toISOString(),
        created_at: date.toISOString(),
        firm_name: dealer.firm_name,
        bill_sent: false
      });

      // Payment for the order (most of the time)
      if (rnd() < 0.9) {
        const paid_amount = Math.round(total_amount * (0.6 + rnd() * 0.4));
        payments.push({
          payment_id: paymentId++,
          dealer_id: dealer.dealer_id,
          order_id: thisOrderId,
          paid_amount,
          method: pick(['Cash','UPI','Card','NEFT','Online'], rnd),
          transaction_id: `TXN-${date.getTime()}-${paymentId}`,
          payment_date: date.toISOString(),
          payment_status: 'Completed',
          dealer_name: dealer.firm_name,
          order_code: `ORD-${String(thisOrderId).padStart(4, '0')}`
        });
      }
    }
  }

  // Derived dashboard bundles
  const totalRevenue = payments.reduce((s, p) => s + Number(p.paid_amount), 0);
  const totalInventoryValue = products.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0);
  const lowStockProducts = products.filter(p => p.quantity <= (p.min_stock_level || 10));

  // Sales data grouped by weekday label for current dashboard
  const weekdayMap = {};
  payments.forEach(p => {
    const label = new Date(p.payment_date).toLocaleDateString('en-US', { weekday: 'short' });
    if (!weekdayMap[label]) weekdayMap[label] = { sales: 0, target: 0 };
    weekdayMap[label].sales += Number(p.paid_amount);
    weekdayMap[label].target = Math.round(weekdayMap[label].sales * 0.8);
  });
  const salesData = Object.entries(weekdayMap).map(([name, data]) => ({
    name,
    sales: Math.round(data.sales),
    target: Math.round(data.target)
  }));

  // Top selling products by value
  const valueByProduct = new Map();
  orderItems.forEach(oi => {
    const key = oi.product_id;
    valueByProduct.set(key, (valueByProduct.get(key) || 0) + (Number(oi.unit_price) * Number(oi.quantity)));
  });
  const topSellingItems = Array.from(valueByProduct.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product_id, value]) => {
      const prod = products.find(p => p.product_id === product_id);
      const quantity = orderItems.filter(oi => oi.product_id === product_id).reduce((s, x) => s + x.quantity, 0);
      return {
        name: prod?.product_name || `Product ${product_id}`,
        quantity,
        value: `₹${Math.round(value).toLocaleString()}`,
        trend: `+${Math.floor(5 + rnd() * 15)}%`
      };
    });

  const recentActivities = orders.slice(-8).reverse().map(o => ({
    type: 'order',
    description: `New order #${o.order_code} received`,
    timestamp: new Date(o.created_at).toLocaleString()
  }));

  return {
    products,
    dealers,
    orders,
    orderItems,
    payments,
    stats: {
      totalProducts: products.length,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.order_status === 'Pending').length,
      completedOrders: orders.filter(o => o.order_status === 'Completed').length,
      totalRevenue,
      totalInventoryValue,
      lowStockProducts: lowStockProducts.length
    },
    salesData,
    topSellingItems,
    lowStock: lowStockProducts.map(p => ({
      product_id: p.product_id,
      product_name: p.product_name,
      product_code: p.product_code,
      quantity: p.quantity,
      min_stock_level: p.min_stock_level,
      price: p.price
    })),
    recentActivities
  };
}

export function computeVelocityFromOrders(orders, orderItems, productId) {
  // basic velocity over last 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const items = orderItems.filter(oi => oi.product_id === productId);
  const byDay = new Map();
  items.forEach(oi => {
    const order = orders.find(o => o.order_id === oi.order_id);
    if (!order) return;
    const dt = new Date(order.created_at);
    if (dt < cutoff) return;
    const key = dt.toISOString().slice(0,10);
    byDay.set(key, (byDay.get(key) || 0) + oi.quantity);
  });
  const days = Math.max(1, (new Date() - cutoff) / (1000*60*60*24));
  const total = Array.from(byDay.values()).reduce((s,x)=>s+x,0);
  return { velocity30d: total / days };
}

export function buildAIRecommendations(bundle) {
  const { products, orders } = bundle;
  // naive: suggested reorder = (min_stock_level + 20) - quantity if positive
  return products.map(p => {
    const leadTimeDays = 7;
    const safetyStock = Math.ceil((p.min_stock_level || 10) * 0.5);
    const targetStock = (p.min_stock_level || 10) + safetyStock + 10;
    const suggested = Math.max(0, targetStock - Number(p.quantity));
    return {
      product_id: p.product_id,
      product_name: p.product_name,
      current_stock: p.quantity,
      target_stock: targetStock,
      suggested_reorder_qty: suggested
    };
  }).filter(r => r.suggested_reorder_qty > 0).slice(0, 10);
}


