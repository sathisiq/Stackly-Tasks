import React, { useState, useEffect, useCallback } from 'react'
import api from './api/axios'
import { ToastProvider, useToast } from './context/ToastContext'
import ToastContainer from './components/Toast'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import ProductForm from './components/ProductForm'
import ProductDetail from './components/ProductDetail'
import { X } from 'lucide-react'

function AppContent() {
  const { showToast } = useToast()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('storefront') // 'storefront' | 'admin'
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState(null)
  const [selectedProductDetail, setSelectedProductDetail] = useState(null)

  // Fetch product list
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const res = await api.get('/api/products', { params })
      setProducts(res.data.products || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      showToast('Failed to load products from server.', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, searchQuery, showToast])

  // Fetch categories list
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories')
      setCategories(res.data.categories || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleOpenAddModal = () => {
    setProductToEdit(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (product) => {
    setProductToEdit(product)
    setIsFormModalOpen(true)
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setProductToEdit(null)
  }

  const handleSaveSuccess = () => {
    handleCloseFormModal()
    fetchProducts()
    fetchCategories()
  }

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/api/products/${id}`)
      showToast('Product and server image removed successfully.', 'success')
      fetchProducts()
      fetchCategories()
    } catch (err) {
      console.error('Delete error:', err)
      showToast('Failed to delete product.', 'error')
    }
  }

  return (
    <div className="app-layout">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        totalProducts={products.length}
      />

      <main className="main-content">
        {activeTab === 'storefront' ? (
          <HomePage
            products={products}
            loading={loading}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewDetails={(product) => setSelectedProductDetail(product)}
            onRefresh={fetchProducts}
            onOpenAddModal={handleOpenAddModal}
          />
        ) : (
          <AdminPage
            products={products}
            loading={loading}
            onOpenAddModal={handleOpenAddModal}
            onEditProduct={handleOpenEditModal}
            onDeleteProduct={handleDeleteProduct}
            onViewProduct={(product) => setSelectedProductDetail(product)}
            onRefresh={fetchProducts}
          />
        )}
      </main>

      {/* Form Modal (Add / Edit) */}
      {isFormModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseFormModal}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-corner-close"
              onClick={handleCloseFormModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <ProductForm
              productToEdit={productToEdit}
              onSaveSuccess={handleSaveSuccess}
              onCancel={handleCloseFormModal}
            />
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductDetail && (
        <ProductDetail
          product={selectedProductDetail}
          onClose={() => setSelectedProductDetail(null)}
          onEdit={(prod) => {
            setSelectedProductDetail(null)
            handleOpenEditModal(prod)
          }}
        />
      )}

      {/* Global Toasts */}
      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
