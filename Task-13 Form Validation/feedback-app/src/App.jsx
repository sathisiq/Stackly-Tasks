import React, { useState, useEffect } from 'react'
import { useToast } from './hooks/useToast'
import FeedbackForm from './components/FeedbackForm'
import FeedbackList from './components/FeedbackList'
import ToastContainer from './components/ToastContainer'
import './App.css'

const STORAGE_KEY = 'feedback_app_reviews_v1'

const INITIAL_FEEDBACK_SEED = [
  {
    id: 101,
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    rating: 5,
    message: 'The custom hooks useForm and useToast make the application feel super snappy and clean! Love the inline error highlights and modern toast alerts.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 102,
    name: 'Samira Khan',
    email: 'samira.k@example.com',
    rating: 4,
    message: 'Great user experience without annoying blocking alert() popups. Smooth validation and clean component structure.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
]

function App() {
  // Toast notification custom hook
  const { toasts, showToast, removeToast } = useToast()

  // Feedbacks state initialized from localStorage with fallback seed
  const [feedbacks, setFeedbacks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (err) {
      console.error('Failed to load feedback from localStorage:', err)
    }
    return INITIAL_FEEDBACK_SEED
  })

  // Persist feedbacks to localStorage whenever list changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks))
    } catch (err) {
      console.error('Failed to save feedback to localStorage:', err)
    }
  }, [feedbacks])

  // Handler to add new feedback entry
  const handleAddFeedback = (newFeedback) => {
    setFeedbacks(prev => [newFeedback, ...prev])
  }

  // Handler to delete feedback entry
  const handleDeleteFeedback = (id) => {
    setFeedbacks(prev => prev.filter(item => item.id !== id))
    showToast('Feedback entry removed', 'info')
  }

  // Handler to reset/clear all feedback entries
  const handleClearAll = () => {
    if (feedbacks.length === 0) return
    setFeedbacks([])
    showToast('All feedback entries cleared', 'info')
  }

  return (
    <div className="app-container">
      {/* Toast Notification Overlay Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Main Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand-logo-group">
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div>
              <h1 className="brand-title">FeedbackHub</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="main-content">
        <div className="content-grid">
          {/* Left Column: Interactive Form */}
          <section className="form-column">
            <div className="card-panel">
              <FeedbackForm
                onAddFeedback={handleAddFeedback}
                showToast={showToast}
              />
            </div>
          </section>

          {/* Right Column: Feedback List & Overview */}
          <section className="list-column">
            <div className="card-panel">
              <div className="panel-actions-bar">
                {feedbacks.length > 0 && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <FeedbackList
                feedbacks={feedbacks}
                onDeleteFeedback={handleDeleteFeedback}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Feedback App &bull; Built with React &amp; Vite &bull; Custom Hooks Architecture (<code>useForm</code> &amp; <code>useToast</code>)
        </p>
      </footer>
    </div>
  )
}

export default App
