import React, { useState } from 'react'
import { getMediaUrl } from '../api/axios'
import { ImageOff, X, ArrowLeft, Tag, Layers, Clock, CheckCircle2, ShieldCheck, Link2 } from 'lucide-react'

export default function ProductDetail({ product, onClose, onEdit }) {
  const [imageError, setImageError] = useState(false)

  if (!product) return null

  const fullImageUrl = product.image_url ? getMediaUrl(product.image_url) : null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <button className="back-btn" onClick={onClose}>
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </button>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="detail-layout">
          {/* Image Showcase */}
          <div className="detail-image-section">
            <div className="detail-image-box">
              {fullImageUrl && !imageError ? (
                <img
                  src={fullImageUrl}
                  alt={product.name}
                  className="detail-large-img"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="detail-no-image">
                  <ImageOff size={48} />
                  <p>No image available</p>
                </div>
              )}
            </div>

            {product.image_url && (
              <div className="image-path-info">
                <div className="image-path-label">
                  <Link2 size={14} /> Server Path:
                </div>
                <code className="image-path-code">{product.image_url}</code>
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="detail-info-section">
            <div className="detail-meta-tags">
              <span className="badge category-badge">
                <Tag size={12} /> {product.category || 'General'}
              </span>
              <span className="badge stock-status-badge">
                <Layers size={12} /> {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <h1 className="detail-title">{product.name}</h1>

            <div className="detail-price-box">
              <span className="currency-symbol">₹</span>
              <span className="detail-price">{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="detail-description-block">
              <h3>About this item</h3>
              <p>{product.description || 'No detailed description provided for this product.'}</p>
            </div>

            <div className="detail-features-list">
              <div className="feature-item">
                <CheckCircle2 size={16} className="feature-icon" />
                <span>Permanent file storage on your backend (No random Picsum)</span>
              </div>
              <div className="feature-item">
                <ShieldCheck size={16} className="feature-icon" />
                <span>Unique UUID naming ensures zero file overwrites</span>
              </div>
              <div className="feature-item">
                <Clock size={16} className="feature-icon" />
                <span>Added: {new Date(product.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="detail-actions">
              {onEdit && (
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    onClose()
                    onEdit(product)
                  }}
                >
                  Edit This Product
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
