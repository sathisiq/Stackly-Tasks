import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, AlertTriangle, Users, TrendingUp, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../api';
import { formatINR } from '../../utils/currency';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Store Performance & Sales</h1>
          <p className="text-slate-500 text-sm font-medium">
            Real-time analytics, Indian Rupee revenue metrics, and inventory alerts
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition-colors"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
              ₹
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {formatINR(stats?.total_revenue)}
          </p>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} /> Real-time settled orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {stats?.total_orders || 0}
          </p>
          <p className="text-xs text-slate-400 font-medium">Customer checkouts recorded</p>
        </div>

        {/* Catalog Size */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Products</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {stats?.total_products || 0}
          </p>
          <p className="text-xs text-slate-400 font-medium">Listed in store catalog</p>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock Alert</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">
            {stats?.low_stock_count || 0}
          </p>
          <p className="text-xs text-amber-700 font-semibold">Items with &lt; 5 units remaining</p>
        </div>

      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Top Performing Products</h2>
          <Link to="/admin/products" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            View All Catalog <ArrowRight size={14} />
          </Link>
        </div>

        {stats?.top_products?.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No product sales data recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats?.top_products?.map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100"
                  />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-400">Units Sold: <strong className="text-slate-700">{item.units_sold}</strong></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Revenue Generated</span>
                  <span className="text-sm font-extrabold text-emerald-600">{formatINR(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
