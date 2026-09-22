import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, AlertCircle, ShieldCheck, Truck, RotateCcw, Plus, Minus } from 'lucide-react';
import api from '../api';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/products/${id}`);
      setProduct(res.data);
      setQuantity(1);
    } catch (err) {
      setError('Product not found or failed to load.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 my-10">
        <AlertCircle size={40} className="mx-auto text-rose-500" />
        <h3 className="text-xl font-bold text-slate-800">Product Not Found</h3>
        <p className="text-slate-500 text-sm">{error || 'The requested product could not be located.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Products
        </button>
      </div>

      {/* Product Detail Layout */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 p-6 sm:p-10">
        
        {/* Left: Product Image */}
        <div className="relative aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
            alt={product.name}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
            }}
            className="w-full h-full object-cover object-center"
          />
          {product.category_name && (
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              {product.category_name}
            </span>
          )}
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Stock indicator badge */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
                  <AlertCircle size={14} /> Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  <AlertCircle size={14} /> Only {product.stock} left in stock - order soon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  <Check size={14} /> In Stock ({product.stock} units available)
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatINR(product.price)}
              </span>
              <span className="text-xs text-slate-400 font-medium">Free delivery anywhere in India</span>
            </div>

            {/* Description */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {product.description || 'Premium quality product crafted with attention to detail.'}
              </p>
            </div>
          </div>

          {/* Action Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-2.5 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-xs text-slate-400">Max: {product.stock}</span>
              </div>
            )}

            {/* Add to Cart CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : addedSuccess
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 hover:shadow-indigo-300 active:scale-95'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check size={18} className="stroke-[3]" /> Added to Cart!
                  </>
                ) : isOutOfStock ? (
                  'Currently Out of Stock'
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Cart — {formatINR(parseFloat(product.price) * quantity)}
                  </>
                )}
              </button>

              <Link
                to="/cart"
                className="py-4 px-6 rounded-2xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 text-center transition-colors"
              >
                View Cart
              </Link>
            </div>

            {/* Assurance Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <Truck size={18} className="mx-auto text-indigo-600" />
                <p className="text-[11px] font-bold text-slate-700">Fast Express</p>
                <p className="text-[9px] text-slate-400">2-3 business days</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <ShieldCheck size={18} className="mx-auto text-indigo-600" />
                <p className="text-[11px] font-bold text-slate-700">Secure Payment</p>
                <p className="text-[9px] text-slate-400">UPI / Cards / NetBanking</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <RotateCcw size={18} className="mx-auto text-indigo-600" />
                <p className="text-[11px] font-bold text-slate-700">7-Day Returns</p>
                <p className="text-[9px] text-slate-400">Doorstep pickup</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
