# ApexMart — Full Stack E-Commerce Platform

A production-grade E-Commerce Web Application built with **React (Vite)**, **Flask REST API**, **MySQL**, and **React Context API** for global state management.

---

## 🌟 Features Overview

### Customer Storefront:
- **Product Catalog (`/`)**: Real-time category filtering pills, keyword search, and dynamic sorting (`price_asc`, `price_desc`, `newest`).
- **Product Details (`/products/:id`)**: High-resolution image viewing, live inventory stock indicators ("In Stock", "Only X left", "Out of Stock"), quantity stepper capped at available stock, and instant cart additions.
- **Global Shopping Cart (`/cart`)**: Accessible across all pages via `CartContext`, featuring persistent localStorage state, quantity adjustments (+ / -), automatic subtotal & grand total calculation.
- **Secure Checkout (`/checkout`)**: Multi-field delivery address form, complete order summary breakdown, and atomic transaction ordering.
- **Strict Stock Validation**: Backend verifies `stock >= requested_qty` for every single cart line item before placing the order or deducting stock. If any item exceeds stock, the system returns `HTTP 400` with an exact error message.
- **Order History (`/orders`)**: Card view of all customer orders, color-coded status badges, delivery destinations, and **historical unit prices** preserved from the moment of checkout.
- **Authentication (`/login`, `/register`)**: Bcrypt hashed password credentials, session management, and **1-click Quick Demo Fill** buttons for instant testing.

### Admin Management Panel (`role = 'admin'`):
- **Inventory Management (`/admin/products`)**: Live data table of all products with instant search filter, stock badges (amber for low stock < 5, red for 0 stock), Add, Edit, and Delete actions with confirmation modals.
- **Product Creation & Editing (`/admin/products/add`, `/admin/products/edit/:id`)**: Form with live URL image preview, category selector, price, and stock controls.
- **Customer Order Management (`/admin/orders`)**: Complete view of all customer orders, customer details, ordered items breakdown, and **inline Status Dropdown** (`Pending` ➔ `Confirmed` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled`) with immediate API synchronization.
- **Sales Analytics Dashboard (`/admin/dashboard`)**: Total revenue generated, total orders count, catalog size, low-stock alerts, and top 5 best-selling products.

---

## 🏗️ Project Architecture & Folder Structure

```
E-commerce/
├── backend/
│   ├── app.py              # Flask RESTful API (Auth, Products, Orders, Admin CRUD, Analytics)
│   ├── seed.py             # Database creation & seeding script (5 categories, 24 products, demo accounts)
│   ├── db.py               # MySQL connection helper and environment configuration
│   └── requirements.txt    # Python backend dependencies
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── api.js          # Configured Axios instance with credentials
│       ├── context/
│       │   ├── AuthContext.jsx   # Global user auth state, role check, login/register/logout
│       │   └── CartContext.jsx   # Global cart state (add, remove, update qty, clear, count, total)
│       ├── components/
│       │   ├── Navbar.jsx        # Navigation bar with live cart count badge and user menu
│       │   ├── ProductCard.jsx   # Reusable product card with stock badges & add to cart
│       │   ├── ProtectedRoute.jsx# Auth guard redirecting to /login
│       │   └── AdminRoute.jsx    # Role guard redirecting non-admins to /
│       ├── pages/
│       │   ├── Home.jsx          # Catalog with search, category filter, and sort
│       │   ├── ProductDetail.jsx # Product view, stock status, quantity picker
│       │   ├── Cart.jsx          # Shopping cart with quantity steppers & totals
│       │   ├── Checkout.jsx      # Delivery address form & atomic checkout
│       │   ├── Orders.jsx        # Order history with snapshot purchase prices
│       │   ├── Login.jsx         # Sign in with instant demo fill buttons
│       │   ├── Register.jsx      # Customer registration
│       │   └── admin/
│       │       ├── AdminProducts.jsx  # Inventory management table
│       │       ├── ProductForm.jsx    # Add / Edit product form with preview
│       │       ├── AdminOrders.jsx    # Order management with inline status change
│       │       └── AdminDashboard.jsx # Sales revenue and top products metrics
│       ├── App.jsx
│       └── main.jsx
├── WRITEUP.md              # Conceptual questions and technical write-up
└── README.md
```

---

## 🛠️ Prerequisites & Setup Guide

### 1. Requirements:
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **MySQL Server 8.0+** running locally

---

### 2. Backend Setup:

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Database Credentials (if different from default `root` / `Sathis@2002`):
   Set environment variables or edit `backend/db.py`:
   - `DB_HOST` (default: `localhost`)
   - `DB_USER` (default: `root`)
   - `DB_PASSWORD` (default: `Sathis@2002`)
   - `DB_NAME` (default: `ecommerce`)
   - `DB_PORT` (default: `3306`)

5. Initialize and seed the MySQL database:
   ```bash
   python seed.py
   ```
   *This automatically creates database `ecommerce`, all 5 tables (`users`, `categories`, `products`, `orders`, `order_items`), seeds 5 categories, 24 realistic products with images, and demo accounts.*

6. Start the Flask Backend Server:
   ```bash
   python app.py
   ```
   *The backend runs at `http://localhost:5000`.*

---

### 3. Frontend Setup:

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite Development Server:
   ```bash
   npm run dev
   ```
   *The frontend runs at `http://localhost:5173`.*

---

## 🔑 Demo Test Accounts

You can log in directly using the 1-click test buttons on the `/login` page or use these credentials:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ecommerce.com` | `admin123` | Storefront + Full Admin Panel (`/admin/*`) |
| **Customer** | `customer@ecommerce.com` | `customer123` | Storefront, Shopping Cart, Checkout, My Orders |

---

## 📡 API Endpoints Specification

### Authentication:
- `POST /api/register` — Register a new account (`name`, `email`, `password`, `role`).
- `POST /api/login` — Sign in with email and password.
- `GET /api/logout` — End session.
- `GET /api/me` — Return current authenticated user profile.

### Public Products & Categories:
- `GET /api/categories` — List all categories and product counts.
- `GET /api/products` — List products with filters: `?category=`, `?search=`, `?sort=price_asc|price_desc|newest`.
- `GET /api/products/<id>` — Get single product details.

### Admin Product Management (Admin Only — 403 otherwise):
- `POST /api/products` — Create a new product.
- `PUT /api/products/<id>` — Update existing product.
- `DELETE /api/products/<id>` — Delete product.

### Customer Orders (Auth Required):
- `POST /api/orders` — Place order with stock availability check and atomic stock deduction.
- `GET /api/orders/my` — Fetch current customer's order history with snapshot unit prices.

### Admin Orders & Stats (Admin Only — 403 otherwise):
- `GET /api/orders` — View all orders from all customers.
- `PUT /api/orders/<id>/status` — Update order fulfillment status (`Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`).
- `GET /api/admin/stats` — Real-time revenue, order totals, and top-selling products.

---

## 🧪 Testing

Run the automated backend test suite:
```bash
python scratch/test_api.py
```
This tests:
1. Public category and product endpoints with search & sort.
2. User registration, login, and session validation.
3. Strict stock rule: rejects orders exceeding available stock with HTTP 400.
4. Order placement, stock deduction, and snapshot pricing.
5. Admin route restrictions (403 for customers) and admin order status updates.
