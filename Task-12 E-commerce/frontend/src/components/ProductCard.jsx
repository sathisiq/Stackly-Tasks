import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image & Badges */}
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden bg-slate-100 aspect-square">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={product.name}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Category Tag */}
        {product.category_name && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {product.category_name}
          </span>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="bg-rose-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <AlertCircle size={12} /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              Only {product.stock} left
            </span>
          ) : null}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-slate-900 text-base line-clamp-1 hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-slate-500 text-xs line-clamp-2 leading-relaxed">
            {product.description || 'Premium quality product crafted with attention to detail.'}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price</span>
            <span className="text-lg font-bold text-slate-900">
              {formatINR(product.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 hover:shadow-indigo-300 active:scale-95'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} className="stroke-[3]" /> Added
              </>
            ) : isOutOfStock ? (
              'Sold Out'
            ) : (
              <>
                <ShoppingBag size={14} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
