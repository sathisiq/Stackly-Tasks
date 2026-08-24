import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, AlertTriangle, AlertCircle, CheckCircle, Package } from 'lucide-react';
import api from '../../api';
import { formatINR } from '../../utils/currency';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/products/${id}`);
      setActionMessage({ type: 'success', text: 'Product deleted successfully.' });
      setProducts(products.filter(p => p.id !== id));
      setDeleteModalId(null);
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to delete product.'
      });
      setDeleteModalId(null);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
  );

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
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Product Inventory</h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage your store's catalog, stock levels, pricing, and details
          </p>
        </div>

        <Link
          to="/admin/products/add"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus size={18} /> Add New Product
        </Link>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Quick Metrics Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by product name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-4">
          <span>Total: <strong className="text-slate-800">{products.length}</strong> items</span>
          <span className="text-amber-600 flex items-center gap-1">
            <AlertTriangle size={14} /> Low stock: <strong className="text-amber-700">{products.filter(p => p.stock > 0 && p.stock < 5).length}</strong>
          </span>
          <span className="text-rose-600 flex items-center gap-1">
            <AlertCircle size={14} /> Out of stock: <strong className="text-rose-700">{products.filter(p => p.stock <= 0).length}</strong>
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package size={36} className="mx-auto text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800">No products found</h3>
            <p className="text-slate-500 text-xs">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Stock Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  const isLow = product.stock > 0 && product.stock < 5;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-slate-400 line-clamp-1">ID: #{product.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {product.category_name || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatINR(product.price)}
                      </td>

                      <td className="py-4 px-6">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertCircle size={12} /> 0 (Out of Stock)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            <AlertTriangle size={12} /> {product.stock} units (Low Stock)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle size={12} /> {product.stock} in stock
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          <Edit2 size={13} /> Edit
                        </Link>
                        <button
                          onClick={() => setDeleteModalId(product.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Delete Product</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModalId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModalId)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
