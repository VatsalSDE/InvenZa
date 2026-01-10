import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { pool } from './db/pool.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

const port = Number(process.env.PORT || 4000);
app.listen(port, async () => {
  const shouldRunStartupDbSync = String(process.env.STARTUP_DB_SYNC || 'false').toLowerCase() === 'true';
  if (shouldRunStartupDbSync) {
    try {
      await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_sent BOOLEAN DEFAULT false');
      await pool.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Completed','Pending')) DEFAULT 'Completed'");
    } catch (e) {
      console.error('Startup DB sync failed:', e);
    }
  }
  console.log(`Server listening on http://localhost:${port}`);
});