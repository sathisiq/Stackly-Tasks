import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Sparkles, AlertCircle } from 'lucide-react';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = async (search = searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      if (sortBy) params.sort = sortBy;

      const res = await api.get('/api/products', { params });
      setProducts(res.data || []);
    } catch (err) {
      setError('Unable to load products. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(searchQuery);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide uppercase">
            <Sparkles size={14} className="text-amber-300" /> Premium Catalog 2026
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Discover Quality Essentials for Modern Living
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg max-w-2xl mx-auto font-normal">
            Explore curated electronics, designer apparel, handcrafted home goods, and wellness gear with real-time inventory management.
          </p>

          {/* Quick Search inside Hero */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto pt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search products, brands, essentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-400/40 shadow-lg"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category Pills & Filters Bar */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === ''
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id.toString()
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
              <ArrowUpDown size={14} className="text-slate-400" />
              <label htmlFor="sort-select" className="sr-only">Sort by</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs sm:text-sm"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Showing {products.length} products
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-3">
                <div className="w-full aspect-square bg-slate-200 rounded-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200 rounded mt-4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-700 space-y-3">
            <AlertCircle size={32} className="mx-auto text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => fetchProducts()}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
            >
              Retry Loading
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No products found</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              We couldn't find any products matching your search or category filter. Try clearing filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                fetchProducts('');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
