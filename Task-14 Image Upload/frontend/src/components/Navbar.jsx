import React from 'react'
import { ShoppingCart, LayoutDashboard, Store, PlusCircle } from 'lucide-react'

export default function Navbar({ activeTab, setActiveTab, onOpenAddModal, totalProducts = 0 }) {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="brand-logo" onClick={() => setActiveTab('storefront')}>
          <div className="logo-icon-box">
            <Store size={22} />
          </div>
          <div className="logo-text-group">
            <span className="brand-name">StoreFlow</span>
            <span className="brand-tag">Image Upload System</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-link ${activeTab === 'storefront' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('storefront')}
          >
            <Store size={18} />
            <span>Storefront</span>
            <span className="nav-badge">{totalProducts}</span>
          </button>

          <button
            className={`nav-link ${activeTab === 'admin' ? 'nav-active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <LayoutDashboard size={18} />
            <span>Admin Management</span>
          </button>
        </nav>

        <div className="header-actions">
          <button
            className="btn btn-primary btn-add-header"
            onClick={onOpenAddModal}
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </button>
        </div>
      </div>
    </header>
  )
}
