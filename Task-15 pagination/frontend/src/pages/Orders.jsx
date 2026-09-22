import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, MapPin, CheckCircle, Truck, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '../api';
import { formatINR } from '../utils/currency';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders/my');
      setOrders(res.data || []);
    } catch (err) {
      setError('Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Order History</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Review details and track the status of all your past purchases
        </p>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Package size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No Orders Yet</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            You haven't placed any orders yet. Discover our latest products and place your first order!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 transition-all hover:shadow-md"
            >
              {/* Order Header */}
              <div className="p-6 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Order Number</span>
                    <span className="font-extrabold text-slate-900">#{order.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Date Placed</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" /> {formatDate(order.ordered_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
                    <span className="font-extrabold text-indigo-600">{formatINR(order.total_amount)}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(order.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="px-6 py-3 bg-white text-xs text-slate-500 flex items-start gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-700 font-semibold">Delivery Address:</strong> {order.address}
                </span>
              </div>

              {/* Items List */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ordered Items ({order.items?.length || 0})
                </h4>
                <div className="divide-y divide-slate-100">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                          alt={item.product_name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                        />
                        <div>
                          <Link
                            to={`/products/${item.product_id}`}
                            className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Purchased at: <strong className="text-slate-700 font-semibold">{formatINR(item.unit_price)}</strong> × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Subtotal</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatINR(parseFloat(item.unit_price) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
