import { Router } from 'express';
import authRoutes from './auth.js';
import productsRoutes from './products.js';
import dealersRoutes from './dealers.js';
import ordersRoutes from './orders.js';
import paymentsRoutes from './payments.js';
import billingRoutes from './billing.js';
import { Router as ExpressRouter } from 'express';
import { generateDemoData, buildAIRecommendations } from '../services/demoDataService.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/dealers', dealersRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/billing', billingRoutes);

// Demo + AI endpoints (read-only) mounted under /dashboard
const demoMode = String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true';
const demoBundle = demoMode ? generateDemoData({ seed: process.env.DEMO_SEED || 1234 }) : null;

router.get('/dashboard/stats', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      return res.json(demoBundle.stats);
    }
    // In real mode, client computes stats from /products, /orders, /payments as it already does
    res.status(501).json({ message: 'Not implemented in real mode. Client computes from existing endpoints.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

router.get('/dashboard/sales', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      return res.json(demoBundle.salesData);
    }
    res.status(501).json({ message: 'Not implemented in real mode.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch sales data' });
  }
});

router.get('/dashboard/top-selling', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      return res.json(demoBundle.topSellingItems);
    }
    res.status(501).json({ message: 'Not implemented in real mode.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch top selling' });
  }
});

router.get('/dashboard/low-stock', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      return res.json(demoBundle.lowStock);
    }
    res.status(501).json({ message: 'Not implemented in real mode.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch low stock' });
  }
});

router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      return res.json(demoBundle.recentActivities);
    }
    res.status(501).json({ message: 'Not implemented in real mode.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// AI endpoints
router.get('/dashboard/velocity', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      const now = new Date();
      const cutoff7 = new Date(); cutoff7.setDate(now.getDate() - 7);
      const cutoff30 = new Date(); cutoff30.setDate(now.getDate() - 30);
      const itemsByProduct = new Map();
      demoBundle.orderItems.forEach(oi => {
        const order = demoBundle.orders.find(o => o.order_id === oi.order_id);
        if (!order) return;
        const dt = new Date(order.created_at);
        const key = oi.product_id;
        let rec = itemsByProduct.get(key);
        if (!rec) { rec = { q7: 0, q30: 0 }; itemsByProduct.set(key, rec); }
        if (dt >= cutoff30) rec.q30 += oi.quantity;
        if (dt >= cutoff7) rec.q7 += oi.quantity;
      });
      const result = demoBundle.products.map(p => {
        const rec = itemsByProduct.get(p.product_id) || { q7: 0, q30: 0 };
        return {
          product_id: p.product_id,
          product_name: p.product_name,
          velocity_7d: +(rec.q7 / 7).toFixed(2),
          velocity_30d: +(rec.q30 / 30).toFixed(2)
        };
      });
      return res.json(result);
    }
    res.status(501).json({ message: 'Not implemented in real mode.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to compute velocity' });
  }
});

router.get('/dashboard/recommendations', async (req, res) => {
  try {
    if (demoMode && demoBundle) {
      const recs = buildAIRecommendations(demoBundle);
      return res.json(recs);
    }
    res.status(501).json({ message: 'Not implemented in real mode.' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to compute recommendations' });
  }
});

export default router;