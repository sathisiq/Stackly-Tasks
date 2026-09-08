import React, { useState } from 'react'
import ProductCard from '../components/ProductCard'
import { Search, Filter, Sparkles, RefreshCw, PlusCircle } from 'lucide-react'

export default function HomePage({
  products,
  loading,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  onViewDetails,
  onRefresh,
  onOpenAddModal
}) {
  return (
    <div className="homepage-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Task 14 Upgraded • Permanent Local Image Hosting</span>
          </div>
          <h1 className="hero-title">
            Curated Products, <span className="text-gradient">Real Server Images</span>
          </h1>
          <p className="hero-subtitle">
            All images are uploaded via multipart/form-data directly to your Flask backend, saved with unique UUIDs, and served statically. No missing links, no random regenerations.
          </p>
        </div>
      </section>

      {/* Control Bar: Filters & Search */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="category-chips">
            <button
              className={`chip ${selectedCategory === 'All' ? 'chip-active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`chip ${selectedCategory === cat ? 'chip-active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            className="btn btn-icon-secondary"
            onClick={onRefresh}
            title="Refresh product list"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw size={36} className="animate-spin text-primary" />
          <p>Loading products from server...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛍️</div>
          <h3>No products found</h3>
          <p>Try clearing your search or category filter, or add a new product.</p>
          <button className="btn btn-primary mt-4" onClick={onOpenAddModal}>
            <PlusCircle size={18} />
            <span>Add First Product</span>
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewDetails}
              isAdmin={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
