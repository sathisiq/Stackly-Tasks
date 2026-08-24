import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
          <ShoppingBag size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900">Your Cart is Empty</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Looks like you haven't added any products to your cart yet. Explore our curated store to find great items!
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95"
        >
          <ArrowLeft size={16} /> Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Shopping Cart</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            You have <span className="font-bold text-slate-800">{cartCount}</span> {cartCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Cart Items Table/List */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {cartItems.map((item) => (
            <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              
              {/* Product Info */}
              <div className="flex items-center gap-4 flex-1">
                <Link to={`/products/${item.id}`} className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                    alt={item.name}
                    className="w-full h-full object-cover object-center"
                  />
                </Link>
                <div className="space-y-1 flex-1">
                  {item.category_name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {item.category_name}
                    </span>
                  )}
                  <Link to={`/products/${item.id}`} className="block">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500">
                    Unit Price: <span className="font-semibold text-slate-700">{formatINR(item.price)}</span>
                  </p>
                </div>
              </div>

              {/* Quantity Stepper & Price Calculation */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Stepper */}
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => updateQuantity(item.id, item.qty - 1)}
                    className="p-2 text-slate-600 hover:bg-slate-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-xs sm:text-sm font-bold text-slate-800">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                    disabled={item.stock !== undefined && item.qty >= item.stock}
                    className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal for Item */}
                <div className="text-right min-w-[100px]">
                  <span className="text-xs text-slate-400 block font-medium">Subtotal</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatINR(item.price * item.qty)}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 sticky top-24">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
            Order Summary
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatINR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST / Taxes</span>
              <span className="font-semibold text-slate-900">₹0.00 (Inclusive)</span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Grand Total</span>
              <span className="text-2xl font-extrabold text-indigo-600">{formatINR(cartTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95"
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium pt-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Guaranteed Safe & Secure Checkout</span>
          </div>
        </div>

      </div>
    </div>
  );
}
