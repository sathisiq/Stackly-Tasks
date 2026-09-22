import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, AlertCircle, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-amber-500" />
        <h2 className="text-2xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-slate-500 text-sm">Please add products to your cart before proceeding to checkout.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft size={16} /> Return to Store
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    const fullAddress = `${formData.fullName}, Phone: ${formData.phone}, ${formData.street}, ${formData.city}, ${formData.state} - ${formData.zip}`.trim();

    if (!formData.street || !formData.city || !formData.zip) {
      setError('Please complete all required address fields.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        address: fullAddress,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.qty
        }))
      };

      const res = await api.post('/api/orders', payload);
      
      // Clear cart immediately
      clearCart();
      setOrderSuccess(res.data);

    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to place order. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-6 animate-fadeIn">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <CheckCircle2 size={44} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Order Confirmed!
            </h2>
            <p className="text-slate-500 text-sm">
              Thank you for your purchase. Your order has been placed and is currently being processed.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 text-left text-sm space-y-2 border border-slate-100">
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-bold text-slate-800">#{orderSuccess.order_id}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Total Paid:</span>
              <span className="font-bold text-indigo-600">{formatINR(orderSuccess.total_amount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-slate-500">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {orderSuccess.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/orders')}
              className="flex-1 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              View Order History
            </button>
            <Link
              to="/"
              className="flex-1 py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Checkout</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Complete your delivery details to finalize your order
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Address Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Truck className="text-indigo-600" size={20} />
            <h2 className="text-lg font-bold text-slate-900">Delivery Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Recipient Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Sathish Kumar"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Mobile Number (for delivery updates) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                House / Flat / Street Address *
              </label>
              <input
                type="text"
                name="street"
                required
                value={formData.street}
                onChange={handleChange}
                placeholder="e.g. Flat 402, Green Meadows, MG Road"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                City / Town *
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Bengaluru / Chennai / Mumbai"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Karnataka"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  name="zip"
                  required
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="e.g. 560001"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Review */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
            Items in Order ({cartItems.length})
          </h2>

          <div className="max-h-60 overflow-y-auto space-y-3 pr-2 divide-y divide-slate-100">
            {cartItems.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-xs line-clamp-1">{item.name}</p>
                    <p className="text-[11px] text-slate-400">Qty: {item.qty} × {formatINR(item.price)}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-xs">
                  {formatINR(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatINR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Total Payable</span>
              <span className="text-2xl font-extrabold text-indigo-600">{formatINR(cartTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Lock size={16} /> Pay & Place Order ({formatINR(cartTotal)})
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            Safe 256-bit SSL encrypted checkout. UPI / NetBanking / Cards supported.
          </p>
        </div>

      </form>
    </div>
  );
}
