import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Image, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../api';
import { formatINR } from '../../utils/currency';

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: '',
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data || []);
      if (!isEditing && res.data?.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/api/products/${id}`);
      const p = res.data;
      setFormData({
        name: p.name || '',
        description: p.description || '',
        price: p.price || '',
        stock: p.stock !== undefined ? p.stock : '',
        category_id: p.category_id || '',
        image_url: p.image_url || '',
      });
    } catch (err) {
      setError('Failed to load product details for editing.');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        image_url: formData.image_url.trim(),
      };

      if (isEditing) {
        await api.put(`/api/products/${id}`, payload);
      } else {
        await api.post('/api/products', payload);
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Products List
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
          {isEditing ? `Edit Product: ${formData.name || '#' + id}` : 'Add New Product'}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Fill in the product specifications, Indian Rupee pricing, stock count, and visual media
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-rose-600" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Fields */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Ergonomic Headphones"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Category *
              </label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Price (INR ₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder="2499.00"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Inventory Stock Count *
            </label>
            <input
              type="number"
              min="0"
              name="stock"
              required
              value={formData.stock}
              onChange={handleChange}
              placeholder="e.g. 25"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Products with stock &lt; 5 will display a low-stock alert to administrators and shoppers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Write a clear, enticing description of product materials, features, and specs..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={16} /> {isEditing ? 'Save Changes' : 'Publish Product'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="py-3.5 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>

        {/* Right: Live Image Preview */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 sticky top-24">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Image size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
          </div>

          <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center">
            {formData.image_url ? (
              <img
                src={formData.image_url}
                alt="Preview"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
                }}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-2">
                <Image size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-medium">Enter an image URL to see preview</p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-bold text-slate-800 text-sm line-clamp-1">
              {formData.name || 'Untitled Product'}
            </p>
            <p className="text-base font-extrabold text-indigo-600">
              {formData.price ? formatINR(formData.price) : '₹0.00'}
            </p>
            <p className="text-xs text-slate-400">
              Stock: <strong className="text-slate-700">{formData.stock || 0} units</strong>
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}
