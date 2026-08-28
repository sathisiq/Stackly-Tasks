import { useState, useCallback } from 'react'

/**
 * Custom hook to manage floating toast notifications.
 * Automatically removes each toast after 3 seconds (3000ms).
 * 
 * @returns {Object} { toasts, showToast, removeToast }
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type }

    setToasts(prev => [...prev, newToast])

    // Auto dismiss after 3 seconds (3000ms)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return { toasts, showToast, removeToast }
}
