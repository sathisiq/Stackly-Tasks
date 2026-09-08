import React from 'react'
import { useToast } from '../context/ToastContext'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon text-emerald-500" size={20} />
      case 'error':
        return <AlertCircle className="toast-icon text-rose-500" size={20} />
      case 'warning':
        return <AlertTriangle className="toast-icon text-amber-500" size={20} />
      default:
        return <Info className="toast-icon text-blue-500" size={20} />
    }
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item toast-${toast.type}`}>
          <div className="toast-content">
            {getIcon(toast.type)}
            <span className="toast-message">{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="toast-close"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
