import React from 'react'

/**
 * Renders small visual star icons for feedback cards.
 */
function VisualStars({ rating }) {
  const numRating = Number(rating) || 0

  return (
    <div className="card-stars" aria-label={`${numRating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={`card-star-svg ${star <= numRating ? 'star-gold' : 'star-muted'}`}
          fill={star <= numRating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="card-rating-number">{numRating}.0</span>
    </div>
  )
}

/**
 * Format timestamp to readable string.
 */
function formatDate(isoString) {
  if (!isoString) return 'Recent'
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Recent'
  }
}

/**
 * Generates initials from name.
 */
function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * FeedbackList component renders all submitted feedbacks as cards.
 * 
 * @param {Array} feedbacks - List of feedback items
 * @param {Function} onDeleteFeedback - Handler to remove an entry
 */
export function FeedbackList({ feedbacks, onDeleteFeedback }) {
  const totalCount = feedbacks.length
  const avgRating = totalCount > 0
    ? (feedbacks.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) / totalCount).toFixed(1)
    : 0

  return (
    <section className="feedback-list-section">
      {/* Header and Quick Stats */}
      <div className="list-header">
        <div>
          <h2 className="list-title">Submitted Feedback</h2>
          <p className="list-subtitle">Real feedback submitted by users</p>
        </div>

        {totalCount > 0 && (
          <div className="stats-badges">
            <div className="stat-badge">
              <span className="stat-value">{totalCount}</span>
              <span className="stat-label">Total Reviews</span>
            </div>
            <div className="stat-badge stat-badge-gold">
              <span className="stat-value">★ {avgRating}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {totalCount === 0 ? (
        <div className="empty-feedback-state">
          <div className="empty-icon-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="15" y2="10" />
            </svg>
          </div>
          <h3 className="empty-title">No feedback submitted yet</h3>
          <p className="empty-desc">
            Fill out the form above and submit to see your feedback card appear here in real time!
          </p>
        </div>
      ) : (
        /* Feedback Cards Grid */
        <div className="feedback-grid">
          {feedbacks.map((item) => (
            <article key={item.id} className="feedback-card">
              <div className="card-top-row">
                <div className="user-profile">
                  <div className="user-avatar" aria-hidden="true">
                    {getInitials(item.name)}
                  </div>
                  <div className="user-info">
                    <h3 className="user-name">{item.name}</h3>
                    <p className="user-email">{item.email}</p>
                  </div>
                </div>

                {onDeleteFeedback && (
                  <button
                    type="button"
                    className="delete-card-btn"
                    onClick={() => onDeleteFeedback(item.id)}
                    title="Delete this feedback"
                    aria-label={`Delete feedback from ${item.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="card-rating-row">
                <VisualStars rating={item.rating} />
                <span className="card-date">{formatDate(item.createdAt)}</span>
              </div>

              <p className="card-message">{item.message}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default FeedbackList
