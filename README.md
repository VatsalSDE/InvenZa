# 🚀 Inventory Management System

Modern, full‑stack inventory management for retailers and distributors. This monorepo contains a Node.js/Express + PostgreSQL backend and a React + Vite frontend. It supports secure authentication, inventory and order workflows, image uploads to Cloudinary, and email notifications.

## ✨ Features

- 🔐 Authentication and authorization (JWT)
- 📦 Products, dealers, orders, payments CRUD
- 🚨 Low‑stock thresholds and alerts
- 🖼️ Image uploads via Cloudinary
- ✉️ Email notifications (Nodemailer/Gmail SMTP)
- 📊 Dashboard with charts and KPIs
- 🧱 Opinionated project structure and reusable APIs

## 🧰 Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT, Multer, Cloudinary SDK
- **Frontend:** React 19, React Router, Vite, Tailwind CSS, Recharts
- **Tooling:** ESLint, Nodemon

## 📁 Repository Structure

```
Inventory-Management-System/
├─ backend/           # Express API, DB, migrations, seeders
│  ├─ src/
│  ├─ env.template    # Example backend environment
│  └─ README.md       # Backend-specific docs and API
├─ client/            # React app (Vite)
│  ├─ src/
│  ├─ env.sample      # Example frontend environment
│  └─ public/
└─ README.md          # You are here
```

## ✅ Prerequisites

- Node.js 18+
- PostgreSQL 13+

## ⚙️ Environment Configuration

- Backend: copy `backend/env.template` to `backend/.env` and fill values
- Frontend: copy `client/env.sample` to `client/.env` and fill values

Backend variables (high level; see `backend/env.template` for the canonical list):

```
PGHOST=...
PGPORT=5432
PGDATABASE=...
PGUSER=...
PGPASSWORD=...
PGSSLMODE=prefer
PORT=4000
NODE_ENV=development
JWT_SECRET=...
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
ADMIN_PASSWORD=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
```

Frontend variables (see `client/env.sample`):

```
VITE_API_BASE_URL=http://localhost:4000
```

## 📦 Installation

```bash
git clone <your-repo-url>
cd Inventory-Management-System

# Backend
cd backend && npm install

# Frontend
cd ../client && npm install
```

## 🗄️ Database Setup

Run migrations and seed initial data from the backend directory:

```bash
cd backend
npm run migrate
npm run seed
```

This seeds an initial admin user; see `backend/README.md` for defaults and details.

## ▶️ Running Locally

- Backend (with reload):
```bash
cd backend
npm run dev
```

- Frontend:
```bash
cd client
npm run dev
```

App UI: `http://localhost:5173` (proxy to API configured via CORS)

## 🧪 Useful Scripts

- Backend
  - `npm run dev` – start API with Nodemon
  - `npm start` – start API
  - `npm run migrate` – apply database schema
  - `npm run migrate:images` – backfill product image metadata
  - `npm run seed` – seed initial data
- Frontend
  - `npm run dev` – start Vite dev server
  - `npm run build` – production build
  - `npm run preview` – preview production build

## 🔌 API Overview

See `backend/README.md` for detailed routes. Examples:

- Auth: `POST /api/auth/login`
- Products: `GET/POST/PUT/DELETE /api/products`
- Dealers: `GET/POST/PUT/DELETE /api/dealers`
- Orders: `GET/POST/PUT/DELETE /api/orders`
- Payments: `GET/POST /api/payments`

All protected endpoints require `Authorization: Bearer <token>`.

## 🧭 Architecture

- Express server exposes REST endpoints and connects to PostgreSQL via `pg`.
- Middleware handles auth, uploads, and logging.
- Cloudinary stores images; metadata is persisted in DB.
- React SPA consumes the API, with routes under `/src/pages` and shared UI under `/src/components`.

## 📈 Monitoring & Logs

- API logging via Morgan (dev format)
- Frontend errors captured by `ErrorBoundary` in `client/src/components/ErrorBoundary.jsx`

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/short-name`
2. Commit with conventional messages
3. Open a pull request

## 🔐 Security

- Never commit `.env` files; use the provided templates
- Rotate `JWT_SECRET` and email app passwords periodically

## 📄 License

MIT

---

For backend setup details and full endpoint docs, see `backend/README.md`.