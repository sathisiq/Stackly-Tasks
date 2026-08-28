import React from 'react'

/**
 * ToastContainer component renders active floating toast notifications.
 * 
 * @param {Array} toasts - List of toast objects: { id, message, type }
 * @param {Function} onRemove - Callback to remove a specific toast
 */
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <aside
      className="toast-container"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'

        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type || 'info'}`}
            role="alert"
          >
            {/* Status Icon */}
            <div className="toast-icon" aria-hidden="true">
              {isSuccess && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {isError && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {!isSuccess && !isError && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              )}
            </div>

            {/* Message Body */}
            <div className="toast-body">
              <span className="toast-title">
                {isSuccess ? 'Success' : isError ? 'Attention' : 'Notice'}
              </span>
              <p className="toast-message">{toast.message}</p>
            </div>

            {/* Dismiss Button */}
            {onRemove && (
              <button
                type="button"
                className="toast-close"
                onClick={() => onRemove(toast.id)}
                aria-label="Close notification"
              >
                &times;
              </button>
            )}

            {/* Visual 3-second countdown indicator */}
            <div className="toast-progress-bar" />
          </div>
        )
      })}
    </aside>
  )
}

export default ToastContainer
