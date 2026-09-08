import React, { useState } from 'react'
import { getMediaUrl } from '../api/axios'
import { ImageOff, Eye, Edit3, Trash2, ShoppingBag } from 'lucide-react'

export default function ProductCard({
  product,
  onViewDetails,
  onEdit,
  onDelete,
  isAdmin = false,
}) {
  const [imageError, setImageError] = useState(false)

  // Construct full URL pointing directly to server upload
  const imageUrl = product.image_url ? getMediaUrl(product.image_url) : null

  return (
    <div className="product-card">
      <div className="card-image-wrapper">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="no-image-placeholder">
            <ImageOff size={32} className="no-image-icon" />
            <span className="no-image-text">No image</span>
          </div>
        )}

        <div className="card-category-badge">{product.category || 'General'}</div>

        {product.stock <= 5 && (
          <div className={`stock-badge ${product.stock === 0 ? 'stock-out' : 'stock-low'}`}>
            {product.stock === 0 ? 'Out of Stock' : `Low Stock: ${product.stock}`}
          </div>
        )}
      </div>

      <div className="card-body">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-description">
          {product.description || 'No description provided.'}
        </p>

        <div className="card-footer">
          <div className="price-container">
            <span className="price-label">Price</span>
            <span className="price-value">₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="card-actions">
            {onViewDetails && (
              <button
                type="button"
                className="btn-icon"
                onClick={() => onViewDetails(product)}
                title="View Product Details"
              >
                <Eye size={18} />
              </button>
            )}

            {isAdmin && onEdit && (
              <button
                type="button"
                className="btn-icon btn-icon-edit"
                onClick={() => onEdit(product)}
                title="Edit Product"
              >
                <Edit3 size={18} />
              </button>
            )}

            {isAdmin && onDelete && (
              <button
                type="button"
                className="btn-icon btn-icon-delete"
                onClick={() => onDelete(product)}
                title="Delete Product"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
