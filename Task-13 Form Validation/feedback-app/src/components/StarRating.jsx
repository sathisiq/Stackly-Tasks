import React, { useState } from 'react'

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
}

/**
 * StarRating interactive 1-5 star selector component.
 * 
 * @param {number|string} value - Current selected rating
 * @param {Function} onChange - Callback when rating changes (receives rating number)
 * @param {boolean} hasError - Indicates if field has validation error
 */
export function StarRating({ value, onChange, hasError }) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const currentRating = Number(value) || 0
  const activeRating = hoveredRating || currentRating

  return (
    <div className={`star-rating-container ${hasError ? 'rating-error' : ''}`}>
      <div 
        className="stars-wrapper"
        onMouseLeave={() => setHoveredRating(0)}
        role="radiogroup"
        aria-label="Rating out of 5 stars"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating

          return (
            <button
              key={star}
              type="button"
              className={`star-btn ${isFilled ? 'star-filled' : 'star-empty'}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onFocus={() => setHoveredRating(star)}
              onBlur={() => setHoveredRating(0)}
              role="radio"
              aria-checked={currentRating === star}
              aria-label={`${star} star${star > 1 ? 's' : ''} - ${RATING_LABELS[star]}`}
            >
              <svg 
                viewBox="0 0 24 24" 
                className="star-svg" 
                fill={isFilled ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                strokeWidth="1.8"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )
        })}
      </div>

      <span className="rating-text-badge">
        {activeRating > 0 ? (
          <>
            <strong>{activeRating} / 5</strong>
            <span className="rating-label-desc"> &bull; {RATING_LABELS[activeRating]}</span>
          </>
        ) : (
          <span className="rating-placeholder">Click to rate (1–5 stars)</span>
        )}
      </span>
    </div>
  )
}

export default StarRating
