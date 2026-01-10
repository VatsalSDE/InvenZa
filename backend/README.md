# Inventory Management System - Backend

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database (can be remote)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend root directory:

```env
# Database Configuration (Supabase or any managed Postgres)
# Recommended: use a single connection URL (includes SSL)
# Supabase example (found under Project Settings → Database → Connection string):
# postgres://USER:PASSWORD@HOST:6543/DBNAME?sslmode=require
DATABASE_URL=postgres://...your_supabase_connection_string...

# Optional: fallback individual fields (used only if DATABASE_URL is empty)
# PGHOST=YOUR_DB_HOST
# PGPORT=5432
# PGDATABASE=storedb
# PGUSER=postgres
# PGPASSWORD=YOUR_DB_PASSWORD
# PGSSLMODE=require

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Admin Password for seeding
ADMIN_PASSWORD=admin123
```

### 3. Database Setup

#### Option A: Remote Database (Your Current Setup)
1. Ensure your PostgreSQL server allows remote connections
2. Update `pg_hba.conf` to allow connections from your development machine
3. Configure firewall rules to allow port 5432
4. Use the IP address of your database server in `PGHOST`

#### Option B: Local Database
1. Install PostgreSQL locally
2. Create database: `CREATE DATABASE storedb;`
3. Set `PGHOST=localhost` in `.env`

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Seed Initial Data
```bash
npm run seed
```
This creates an admin user with credentials: `admin` / `admin123`

### 6. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:4000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── pool.js          # Database connection
│   │   ├── migrate.js       # Database schema setup
│   │   ├── seed.js          # Initial data seeding
│   │   └── sql/
│   │       └── schema.sql   # Database schema
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   ├── routes/
│   │   ├── auth.js          # Login/logout
│   │   ├── products.js      # Product CRUD
│   │   ├── dealers.js       # Dealer CRUD
│   │   ├── orders.js        # Order management
│   │   └── payments.js      # Payment tracking
│   └── server.js            # Express server
├── package.json
└── .env
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Dealers
- `GET /api/dealers` - Get all dealers
- `POST /api/dealers` - Create dealer
- `PUT /api/dealers/:id` - Update dealer
- `DELETE /api/dealers/:id` - Delete dealer

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order with items
- `GET /api/orders/:id/items` - Get order items
- `PUT /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment

## 🔒 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Schema

The system includes tables for:
- **login** - User authentication
- **products** - Inventory items
- **dealers** - Customer information
- **orders** - Order management
- **order_items** - Order line items
- **payments** - Payment tracking

## 🚨 Troubleshooting

### Connection Issues
1. Verify your Supabase project is up (check Status page)
2. Use the exact connection string from Supabase ("sslmode=require")
3. Ensure `DATABASE_URL` is set in `backend/.env` and server restarted
4. If using individual fields instead of `DATABASE_URL`, set `PGSSLMODE=require`
5. Confirm your IP is allowed if you use the direct host/port option

### Supabase Setup Quick Steps
1. In Supabase, go to Project Settings → Database → Connection pooling or Connection string
2. Copy the `URI` for Node.js (or psql). It often looks like:
   `postgres://USER:PASSWORD@HOST:6543/DBNAME?sslmode=require`
3. Set it as `DATABASE_URL` in `backend/.env`
4. Run migrations if needed using your schema files or Supabase SQL editor
5. Start the backend. `pool.js` auto-enables SSL and supports `DATABASE_URL`

### Common Errors
- `ECONNREFUSED`: Database server not accessible
- `password authentication failed`: Wrong credentials
- `relation does not exist`: Run migrations first

## 📝 Development Notes

- The backend uses ES modules (`import/export`)
- Database queries use parameterized statements for security
- JWT tokens expire after 24 hours by default
- CORS is configured to allow frontend connections
- All database operations are wrapped in try-catch blocks
