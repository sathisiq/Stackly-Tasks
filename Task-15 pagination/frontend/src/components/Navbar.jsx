import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Package, Shield, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <ShoppingBag size={20} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 bg-clip-text text-transparent">
                  ApexMart
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600 -mt-1">
                  Store & Admin
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/') 
                    ? 'text-indigo-600 bg-indigo-50/80' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                Storefront
              </Link>
              {isAuthenticated && (
                <Link
                  to="/orders"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/orders') 
                      ? 'text-indigo-600 bg-indigo-50/80' 
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                  }`}
                >
                  My Orders
                </Link>
              )}
              {isAdmin && (
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200">
                  <Link
                    to="/admin/products"
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-purple-100 text-purple-800'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Shield size={14} /> Admin Portal
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Cart Button with Count Badge */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all active:scale-95"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md animate-scaleIn">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Auth State */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors text-slate-800 text-sm font-semibold"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold leading-tight line-clamp-1">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1">
                      {isAdmin && <Shield size={10} className="text-purple-600 inline" />}
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>

                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <Package size={16} /> My Orders
                      </Link>

                      {isAdmin && (
                        <>
                          <div className="my-1 border-t border-slate-100"></div>
                          <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Admin Operations
                          </div>
                          <Link
                            to="/admin/products"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            <Shield size={16} /> Manage Products
                          </Link>
                          <Link
                            to="/admin/orders"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            <Package size={16} /> Customer Orders
                          </Link>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            <Shield size={16} /> Sales & Analytics
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-slate-100"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-200 transition-all active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
              Storefront
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                My Orders
              </Link>
            )}
            {isAdmin && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="px-4 text-xs font-bold uppercase tracking-wider text-purple-600">Admin Area</span>
                <Link
                  to="/admin/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                >
                  Product Management
                </Link>
                <Link
                  to="/admin/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                >
                  Manage All Orders
                </Link>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                >
                  Sales Dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
