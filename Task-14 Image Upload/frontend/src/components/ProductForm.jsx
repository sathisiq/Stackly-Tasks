import React, { useState, useEffect } from 'react'
import api, { getMediaUrl } from '../api/axios'
import { useToast } from '../context/ToastContext'
import DragDropZone from './DragDropZone'
import { Loader2, Plus, Edit, Check, AlertCircle } from 'lucide-react'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export default function ProductForm({ productToEdit = null, onSaveSuccess, onCancel }) {
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    stock: '10',
    description: '',
  })

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        price: productToEdit.price !== undefined ? String(productToEdit.price) : '',
        category: productToEdit.category || 'Electronics',
        stock: productToEdit.stock !== undefined ? String(productToEdit.stock) : '10',
        description: productToEdit.description || '',
      })
      if (productToEdit.image_url) {
        setExistingImageUrl(productToEdit.image_url)
        setPreview(getMediaUrl(productToEdit.image_url))
      }
    }
  }, [productToEdit])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Instant preview before upload
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    // 1. Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setFormErrors((prev) => ({
        ...prev,
        image: 'Invalid file type. Please select a PNG, JPG, JPEG, or WEBP image.'
      }))
      showToast('Invalid file format. Please upload PNG, JPG, or WEBP.', 'error')
      return
    }

    // 2. Validate file size (2 MB)
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFormErrors((prev) => ({
        ...prev,
        image: `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB). Maximum limit is 2.0 MB.`
      }))
      showToast('File exceeds 2 MB limit. Please choose a smaller image.', 'error')
      return
    }

    // Clear previous error
    setFormErrors((prev) => ({ ...prev, image: null }))

    // Set file state & instant preview
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    showToast('Image selected and ready for upload', 'info', 2000)
  }

  const handleFileRemove = () => {
    setFile(null)
    setPreview(null)
    setExistingImageUrl('')
    setFormErrors((prev) => ({ ...prev, image: null }))
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Product name is required'
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      errors.price = 'Please enter a valid positive price'
    }
    if (!formData.category.trim()) errors.category = 'Category is required'
    if (formData.stock === '' || isNaN(formData.stock) || Number(formData.stock) < 0) {
      errors.stock = 'Stock must be a non-negative number'
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      showToast('Please fix the form errors before submitting.', 'error')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      let finalImageUrl = existingImageUrl

      // Step 1: Upload the file if a new file is chosen
      if (file) {
        showToast('Uploading image to server...', 'info')
        const uploadData = new FormData()
        uploadData.append('image', file)

        const uploadRes = await api.post('/api/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percent)
            }
          }
        })

        finalImageUrl = uploadRes.data.image_url
      }

      // Step 2: Create or Update the product with the returned image_url
      const productPayload = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        description: formData.description.trim(),
        stock: parseInt(formData.stock, 10),
        image_url: finalImageUrl
      }

      if (productToEdit) {
        await api.put(`/api/products/${productToEdit.id}`, productPayload)
        showToast('Product updated successfully!', 'success')
      } else {
        await api.post('/api/products', productPayload)
        showToast('Product added successfully!', 'success')
      }

      if (onSaveSuccess) {
        onSaveSuccess()
      }
    } catch (err) {
      console.error('Submission error:', err)
      const errorMsg = err.response?.data?.error || 'Upload failed. Please try again.'
      showToast(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-header">
        <h2>{productToEdit ? 'Edit Product' : 'Add New Product'}</h2>
        <p className="form-subtitle">
          {productToEdit
            ? 'Update product details and replace the image on server.'
            : 'Fill in the details and upload a product image stored on your own server.'}
        </p>
      </div>

      <div className="form-body">
        {/* Image Upload Drag and Drop Section */}
        <div className="form-group image-field-group">
          <label className="form-label">
            Product Image <span className="label-badge">Local Server Storage</span>
          </label>
          
          <DragDropZone
            file={file}
            preview={preview}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            disabled={isSubmitting}
            error={formErrors.image}
          />

          {/* Upload Progress Bar (Axios onUploadProgress) */}
          {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress-container">
              <div className="upload-progress-header">
                <span>Uploading Image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="upload-progress-track">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Product Details Grid */}
        <div className="form-grid">
          <div className="form-group col-span-2">
            <label htmlFor="name" className="form-label">
              Product Title <span className="required-star">*</span>
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${formErrors.name ? 'input-error' : ''}`}
              disabled={isSubmitting}
            />
            {formErrors.name && (
              <span className="field-error-text">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Price (₹) <span className="required-star">*</span>
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              name="price"
              placeholder="1499.00"
              value={formData.price}
              onChange={handleInputChange}
              className={`form-input ${formErrors.price ? 'input-error' : ''}`}
              disabled={isSubmitting}
            />
            {formErrors.price && (
              <span className="field-error-text">{formErrors.price}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category <span className="required-star">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-input"
              disabled={isSubmitting}
            >
              <option value="Electronics">Electronics</option>
              <option value="Audio">Audio</option>
              <option value="Wearables">Wearables</option>
              <option value="Accessories">Accessories</option>
              <option value="Footwear">Footwear</option>
              <option value="Apparel">Apparel</option>
              <option value="Home & Living">Home & Living</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="stock" className="form-label">
              Inventory Stock
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              name="stock"
              placeholder="25"
              value={formData.stock}
              onChange={handleInputChange}
              className="form-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group col-span-2">
            <label htmlFor="description" className="form-label">
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Provide a detailed description of key features, specifications, and highlights..."
              value={formData.description}
              onChange={handleInputChange}
              className="form-input form-textarea"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="btn btn-primary submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              {file ? 'Uploading & Saving...' : 'Saving Product...'}
            </>
          ) : productToEdit ? (
            <>
              <Check size={18} />
              Update Product
            </>
          ) : (
            <>
              <Plus size={18} />
              Add Product
            </>
          )}
        </button>
      </div>
    </form>
  )
}
