import React, { useState } from 'react'
import { getMediaUrl } from '../api/axios'
import { Plus, Edit, Trash2, Eye, ImageOff, RefreshCw, Layers, IndianRupee, Package } from 'lucide-react'

export default function AdminPage({
  products,
  loading,
  onOpenAddModal,
  onEditProduct,
  onDeleteProduct,
  onViewProduct,
  onRefresh,
}) {
  const [productToDelete, setProductToDelete] = useState(null)

  const totalInventoryValue = products.reduce(
    (acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0),
    0
  )

  return (
    <div className="admin-page-container">
      <div className="admin-header-row">
        <div>
          <h1 className="admin-title">Product Administration</h1>
          <p className="admin-subtitle">
            Manage your store catalog, upload high-resolution product media, and manage stock.
          </p>
        </div>
        <div className="admin-actions-group">
          <button className="btn btn-secondary" onClick={onRefresh} title="Reload catalog">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddModal}>
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue">
            <Package size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{products.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-emerald">
            <Layers size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Stock Units</span>
            <span className="stat-value">
              {products.reduce((acc, p) => acc + Number(p.stock || 0), 0)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-violet">
            <IndianRupee size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Catalog Value</span>
            <span className="stat-value">₹{totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Server File Path</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <RefreshCw size={24} className="animate-spin inline mr-2 text-primary" />
                    Loading catalog data...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    No products found in catalog. Click "Add New Product" to create one.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const mediaUrl = product.image_url ? getMediaUrl(product.image_url) : null
                  return (
                    <tr key={product.id}>
                      <td className="w-16">
                        <div className="table-thumb-wrapper">
                          {mediaUrl ? (
                            <img
                              src={mediaUrl}
                              alt={product.name}
                              className="table-thumb-img"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div
                            className="table-thumb-placeholder"
                            style={{ display: mediaUrl ? 'none' : 'flex' }}
                          >
                            <ImageOff size={16} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-product-info">
                          <strong className="table-product-name">{product.name}</strong>
                          <p className="table-product-desc">
                            {product.description ? product.description.substring(0, 60) + '...' : 'No description'}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="table-category-tag">{product.category || 'General'}</span>
                      </td>
                      <td className="font-semibold text-gray-900">
                        ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`stock-indicator ${product.stock <= 5 ? 'stock-warning' : 'stock-ok'}`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td>
                        {product.image_url ? (
                          <code className="table-code-path">{product.image_url}</code>
                        ) : (
                          <span className="text-muted text-xs">None</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            className="table-btn table-btn-view"
                            onClick={() => onViewProduct(product)}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="table-btn table-btn-edit"
                            onClick={() => onEditProduct(product)}
                            title="Edit product"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="table-btn table-btn-delete"
                            onClick={() => setProductToDelete(product)}
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="modal-backdrop" onClick={() => setProductToDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Product?</h3>
            <p>
              Are you sure you want to delete <strong>"{productToDelete.name}"</strong>?
              This will also permanently remove the associated image file from the server.
            </p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onDeleteProduct(productToDelete.id)
                  setProductToDelete(null)
                }}
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
