# INVENZA Backend

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- Supabase account with a project
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file by copying `.env.example`:

```env
# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (for billing emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### 3. Database Setup (Supabase)

1. Go to your Supabase project's SQL Editor
2. Run the schema files in order:
   - `src/db/sql/schema.sql` - Core tables
   - `src/db/sql/billing_schema.sql` - Billing tables
   - `src/db/sql/suppliers_purchases_schema.sql` - Suppliers & Purchases tables

### 4. Seed Initial Data
```bash
npm run seed
```
Creates an admin user with credentials: `admin` / `admin123`

### 5. Start Development Server
```bash
npm run dev
```

Server starts on `http://localhost:4000`

## 📁 Project Structure (Routes/Controllers/Services)
```
backend/
├── src/
│   ├── config/
│   │   ├── supabase.js       # Supabase client initialization
│   │   └── cloudinary.js     # Cloudinary configuration
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.js
│   │   ├── products.controller.js
│   │   ├── dealers.controller.js
│   │   ├── orders.controller.js
│   │   ├── payments.controller.js
│   │   ├── billing.controller.js
│   │   ├── suppliers.controller.js
│   │   ├── purchases.controller.js
│   │   └── dashboard.controller.js
│   ├── services/             # Business logic & Supabase queries
│   │   ├── auth.service.js
│   │   ├── products.service.js
│   │   ├── dealers.service.js
│   │   ├── orders.service.js
│   │   ├── payments.service.js
│   │   ├── billing.service.js
│   │   ├── suppliers.service.js
│   │   ├── purchases.service.js
│   │   └── dashboard.service.js
│   ├── routes/               # API route definitions
│   │   ├── index.routes.js   # Main router
│   │   ├── auth.routes.js
│   │   ├── products.routes.js
│   │   ├── dealers.routes.js
│   │   ├── orders.routes.js
│   │   ├── payments.routes.js
│   │   ├── billing.routes.js
│   │   ├── suppliers.routes.js
│   │   ├── purchases.routes.js
│   │   └── dashboard.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── upload.middleware.js  # Multer for images
│   │   └── error.middleware.js   # Global error handler
│   ├── utils/
│   │   ├── codeGenerator.js      # Auto-generate codes (ORD-, PAY-, PO-, etc.)
│   │   └── responseHelper.js     # Standardized API responses
│   ├── db/
│   │   ├── seed.js               # Database seeding
│   │   └── sql/                  # SQL schema files
│   └── server.js                 # Express server entry point
├── package.json
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product (with image) |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Dealers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dealers` | Get all dealers |
| GET | `/api/dealers/outstanding-balances` | Get dealer balances |
| GET | `/api/dealers/:id` | Get dealer by ID |
| POST | `/api/dealers` | Create dealer |
| PUT | `/api/dealers/:id` | Update dealer |
| DELETE | `/api/dealers/:id` | Delete dealer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get order by ID |
| GET | `/api/orders/:id/items` | Get order items |
| POST | `/api/orders` | Create order (deducts stock) |
| PUT | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete order (restores stock) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | Get all payments |
| GET | `/api/payments/:id` | Get payment by ID |
| POST | `/api/payments` | Create payment |
| DELETE | `/api/payments/:id` | Delete payment |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | Get active suppliers |
| GET | `/api/suppliers/all` | Get all suppliers |
| GET | `/api/suppliers/archived` | Get archived suppliers |
| GET | `/api/suppliers/:id` | Get supplier by ID |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Soft delete (archive) |
| POST | `/api/suppliers/:id/restore` | Restore archived supplier |

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchases` | Get all purchases |
| GET | `/api/purchases/:id` | Get purchase by ID |
| GET | `/api/purchases/:id/items` | Get purchase items |
| POST | `/api/purchases` | Create purchase order |
| PUT | `/api/purchases/:id/status` | Update status (increases stock on Received) |
| DELETE | `/api/purchases/:id` | Delete purchase |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/bills` | Get all bills |
| GET | `/api/billing/bills/:id` | Get bill by ID |
| POST | `/api/billing/bills` | Create bill |
| POST | `/api/billing/bills/:id/send-email` | Email bill to dealer |
| GET | `/api/billing/settings` | Get billing settings |
| PUT | `/api/billing/settings` | Update billing settings |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

## 🔒 Authentication

All protected endpoints require a JWT token:
```
Authorization: Bearer <your-jwt-token>
```

Demo mode: Use `demo_mode=true` in request body for development.

## 🗄️ Database Schema

### Core Tables
- **login** - User authentication
- **products** - Inventory items with stock tracking
- **dealers** - Customer information
- **orders** - Sales orders
- **order_items** - Order line items
- **payments** - Payment records

### Billing Tables
- **bills** - Generated invoices
- **bill_settings** - Company billing configuration

### Procurement Tables
- **suppliers** - Supplier management (soft delete supported)
- **purchases** - Purchase orders
- **purchase_items** - Purchase line items

## 📊 Business Logic

### Stock Management
- **Order Creation**: Automatically deducts product quantities
- **Order Deletion**: Restores product quantities
- **Purchase Received**: Increases product quantities when status = 'Received'

### Code Generation
All entity codes are auto-generated:
- Orders: `ORD-YYMMDD-XXX`
- Payments: `PAY-YYMMDD-XXX`
- Purchases: `PO-YYMMDD-XXX`
- Suppliers: `SUP-XXX`
- Dealers: `DLR-XXX`

### Outstanding Balances
Calculated as: `SUM(order amounts) - SUM(payment amounts)` per dealer

## 🚨 Troubleshooting

### Supabase Connection
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
2. Check Supabase project is active
3. Ensure tables exist (run SQL schemas)

### Common Errors
- `Invalid API key`: Wrong `SUPABASE_ANON_KEY`
- `relation does not exist`: Run SQL schema files
- `JWT expired`: Token validity exceeded, re-login

## 📝 Development Notes

- Uses ES modules (`import/export`)
- All services export functions for AI integration
- Standardized API responses via `responseHelper.js`
- Global error handling with `asyncHandler` wrapper
- JWT tokens expire after 7 days by default
- CORS configured for frontend at `localhost:5173`

## 🚀 Deployment

### Railway/Render
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy automatically

### Environment Variables for Production
```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=strong-production-secret
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```
