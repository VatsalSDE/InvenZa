import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { pool, query } from '../db/pool.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT o.*, d.firm_name, COALESCE(o.bill_sent, false) AS bill_sent
      FROM orders o
      JOIN dealers d ON d.dealer_id = o.dealer_id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.get('/:id/items', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT oi.*, p.product_code, p.product_name FROM order_items oi
       JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id=$1`,
      [id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch order items' });
  }
});

// Create an order with items in a single transaction
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { order_code, dealer_id, order_status = 'Pending', total_amount, delivery_date, items = [] } = req.body;

    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (order_code, dealer_id, order_status, total_amount, delivery_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [order_code, dealer_id, order_status, total_amount, delivery_date]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [order.order_id, product_id, quantity, unit_price]
      );

      // decrease stock
      await client.query(
        `UPDATE products SET quantity = quantity - $1 WHERE product_id=$2`,
        [quantity, product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to create order' });
  } finally {
    client.release();
  }
});

router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status } = req.body;
    const { rows } = await query('UPDATE orders SET order_status=$1 WHERE order_id=$2 RETURNING *', [order_status, id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Edit order details
router.put('/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { order_code, dealer_id, order_status, total_amount, delivery_date, items = [] } = req.body;

    await client.query('BEGIN');

    // Update order
    const orderResult = await client.query(
      `UPDATE orders SET order_code=$1, dealer_id=$2, order_status=$3, total_amount=$4, delivery_date=$5 WHERE order_id=$6 RETURNING *`,
      [order_code, dealer_id, order_status, total_amount, delivery_date, id]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    // Delete existing order items
    await client.query('DELETE FROM order_items WHERE order_id=$1', [id]);

    // Add new order items
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4)`,
        [id, product_id, quantity, unit_price]
      );
    }

    await client.query('COMMIT');
    res.json(orderResult.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Order update error:', e);
    res.status(500).json({ message: 'Failed to update order' });
  } finally {
    client.release();
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM orders WHERE order_id=$1', [id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete order' });
  }
});

export default router;


