import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Customer Pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <Routes>
          {/* Public Storefront Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Customer Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/add"
            element={
              <AdminRoute>
                <ProductForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/edit/:id"
            element={
              <AdminRoute>
                <ProductForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ApexMart E-Commerce Platform. Built with React + Context API + Flask + MySQL.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Catalog</Link>
            <Link to="/cart" className="hover:text-indigo-600 transition-colors">Shopping Cart</Link>
            <Link to="/orders" className="hover:text-indigo-600 transition-colors">My Purchases</Link>
            <Link to="/admin/dashboard" className="hover:text-purple-600 font-semibold transition-colors">Admin Area</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
