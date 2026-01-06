import dotenv from 'dotenv';
import { pool } from './pool.js';
import { generateDemoData } from '../services/demoDataService.js';

dotenv.config();

async function run() {
  const client = await pool.connect();
  try {
    const seed = process.env.DEMO_SEED || 1234;
    const bundle = generateDemoData({ seed, numProducts: 40, numDealers: 8, months: 6 });

    await client.query('BEGIN');
    await client.query('DELETE FROM payments');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM dealers');

    // Dealers
    for (const d of bundle.dealers) {
      await client.query(
        `INSERT INTO dealers (dealer_id, dealer_code, firm_name, gstin, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [d.dealer_id, d.dealer_code, d.firm_name, d.gstin, d.created_at]
      );
    }

    // Products
    for (const p of bundle.products) {
      await client.query(
        `INSERT INTO products (product_id, product_code, product_name, category, no_burners, type_burner, price, quantity, created_at, min_stock_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [p.product_id, p.product_code, p.product_name, p.category, p.no_burners, p.type_burner, p.price, p.quantity, p.created_at, p.min_stock_level]
      );
    }

    // Orders
    for (const o of bundle.orders) {
      await client.query(
        `INSERT INTO orders (order_id, order_code, dealer_id, order_status, total_amount, delivery_date, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [o.order_id, o.order_code, o.dealer_id, o.order_status, o.total_amount, o.delivery_date, o.created_at]
      );
    }

    // Order Items
    for (const oi of bundle.orderItems) {
      await client.query(
        `INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [oi.order_item_id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price]
      );
    }

    // Payments
    for (const p of bundle.payments) {
      await client.query(
        `INSERT INTO payments (payment_id, dealer_id, order_id, paid_amount, method, transaction_id, payment_date, payment_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [p.payment_id, p.dealer_id, p.order_id, p.paid_amount, p.method, p.transaction_id, p.payment_date, p.payment_status]
      );
    }

    await client.query('COMMIT');
    console.log('Demo data seeded successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to seed demo data:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    pool.end();
  }
}

run();


