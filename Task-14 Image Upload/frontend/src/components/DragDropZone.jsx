import React, { useState, useRef } from 'react'
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react'

export default function DragDropZone({
  file,
  preview,
  onFileSelect,
  onFileRemove,
  disabled = false,
  error = null
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      onFileSelect(droppedFile)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0]
      onFileSelect(selected)
    }
  }

  const triggerBrowse = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="upload-zone-wrapper">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {preview ? (
        <div className="preview-container">
          <div className="preview-image-box">
            <img src={preview} alt="Product Preview" className="preview-image" />
            <button
              type="button"
              onClick={onFileRemove}
              className="preview-remove-btn"
              title="Remove or replace image"
              disabled={disabled}
            >
              <X size={16} />
            </button>
          </div>
          <div className="preview-meta">
            <p className="preview-name">
              {file ? file.name : 'Current Image'}
            </p>
            {file && (
              <p className="preview-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
            <button
              type="button"
              onClick={triggerBrowse}
              className="change-image-btn"
              disabled={disabled}
            >
              Change Image
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`dropzone-box ${isDragOver ? 'drag-active' : ''} ${error ? 'border-error' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              triggerBrowse()
            }
          }}
        >
          <div className="dropzone-icon-circle">
            <UploadCloud className="dropzone-icon" size={32} />
          </div>
          <p className="dropzone-title">
            <span className="dropzone-browse-text">Click to upload</span> or drag and drop
          </p>
          <p className="dropzone-subtitle">
            PNG, JPG, JPEG or WEBP (Max 2.0 MB)
          </p>
        </div>
      )}

      {error && (
        <div className="field-error-msg">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
