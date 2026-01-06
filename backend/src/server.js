import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/index.js';
import { pool } from './db/pool.js';

dotenv.config();

const app = express();

const allowedHeaders = ['Content-Type', 'Authorization'];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from any origin in demo mode or when no origin provided (same-origin or curl)
    if (!origin || String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true') {
      return callback(null, true);
    }
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length === 0) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Ensure CORS headers are always present (including error responses)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  if (String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true') {
    res.header('Access-Control-Allow-Origin', origin);
  } else if ((process.env.CORS_ORIGIN || '').length > 0) {
    // If specific origins are set, echo back the origin if allowed
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim());
    if (allowed.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', router);

const port = Number(process.env.PORT || 4000);
app.listen(port, async () => {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_sent BOOLEAN DEFAULT false');
    await pool.query("ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('Completed','Pending')) DEFAULT 'Completed'");
  } catch (e) {
    console.error('Failed to ensure bill_sent column:', e);
  }
  console.log(`Server listening on http://localhost:${port}`);
});