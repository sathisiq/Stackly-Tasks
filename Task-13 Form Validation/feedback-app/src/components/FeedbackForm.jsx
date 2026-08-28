import React from 'react'
import { useForm } from '../hooks/useForm'
import StarRating from './StarRating'

const MAX_MESSAGE_LENGTH = 500

/**
 * Validates feedback form input values.
 * Returns an errors object containing validation messages for invalid fields.
 */
function validateFeedback(vals) {
  const errs = {}

  // Name validation
  if (!vals.name || !vals.name.trim()) {
    errs.name = 'Name is required'
  } else if (vals.name.trim().length < 2) {
    errs.name = 'Name must be at least 2 characters'
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!vals.email || !vals.email.trim()) {
    errs.email = 'Email address is required'
  } else if (!emailRegex.test(vals.email.trim())) {
    errs.email = 'Valid email is required (e.g., user@example.com)'
  }

  // Rating validation
  if (!vals.rating || Number(vals.rating) < 1 || Number(vals.rating) > 5) {
    errs.rating = 'Please select a star rating (1–5)'
  }

  // Message validation
  if (!vals.message || !vals.message.trim()) {
    errs.message = 'Message is required'
  } else if (vals.message.trim().length < 5) {
    errs.message = 'Message must be at least 5 characters'
  } else if (vals.message.length > MAX_MESSAGE_LENGTH) {
    errs.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`
  }

  return errs
}

/**
 * FeedbackForm component
 * Uses useForm custom hook to handle values, inline validation errors, and resets.
 */
export function FeedbackForm({ onAddFeedback, showToast }) {
  const {
    values,
    errors,
    handleChange,
    setFieldValue,
    validateForm,
    resetForm
  } = useForm(
    { name: '', email: '', rating: '', message: '' },
    validateFeedback
  )

  const handleSubmit = (e) => {
    e.preventDefault()

    const isValid = validateForm()

    if (!isValid) {
      // Fire error toast
      showToast('Please fix the errors below', 'error')
      return
    }

    // Process valid submission
    onAddFeedback({
      id: Date.now() + Math.random(),
      name: values.name.trim(),
      email: values.email.trim(),
      rating: Number(values.rating),
      message: values.message.trim(),
      createdAt: new Date().toISOString()
    })

    // Reset form fields and errors
    resetForm()

    // Fire success toast
    showToast('Feedback submitted!', 'success')
  }

  const messageLength = values.message ? values.message.length : 0
  const isMessageNearLimit = messageLength > MAX_MESSAGE_LENGTH * 0.9

  return (
    <form className="feedback-form" onSubmit={handleSubmit} noValidate>
      <div className="form-header">
        <h2 className="form-title">Leave Your Feedback</h2>
        <p className="form-subtitle">
          We value your input! Share your review and rating below.
        </p>
      </div>

      {/* Name Field */}
      <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
        <label htmlFor="feedback-name" className="form-label">
          Full Name <span className="required-star">*</span>
        </label>
        <div className="input-wrapper">
          <input
            id="feedback-name"
            type="text"
            name="name"
            placeholder="e.g. Jane Doe"
            value={values.name}
            onChange={handleChange}
            className={`form-input ${errors.name ? 'input-invalid' : ''}`}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </div>
        {errors.name && (
          <p id="name-error" className="error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠</span> {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
        <label htmlFor="feedback-email" className="form-label">
          Email Address <span className="required-star">*</span>
        </label>
        <div className="input-wrapper">
          <input
            id="feedback-email"
            type="email"
            name="email"
            placeholder="e.g. jane.doe@example.com"
            value={values.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'input-invalid' : ''}`}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠</span> {errors.email}
          </p>
        )}
      </div>

      {/* Rating Field (Star Rating component) */}
      <div className={`form-group ${errors.rating ? 'has-error' : ''}`}>
        <label className="form-label">
          Rating (1–5) <span className="required-star">*</span>
        </label>
        <StarRating
          value={values.rating}
          onChange={(rate) => setFieldValue('rating', rate)}
          hasError={Boolean(errors.rating)}
        />
        {errors.rating && (
          <p id="rating-error" className="error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠</span> {errors.rating}
          </p>
        )}
      </div>

      {/* Message Field with Character Counter */}
      <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
        <div className="label-counter-row">
          <label htmlFor="feedback-message" className="form-label">
            Your Message <span className="required-star">*</span>
          </label>
          <span className={`char-counter ${isMessageNearLimit ? 'counter-warning' : ''}`}>
            {messageLength} / {MAX_MESSAGE_LENGTH} chars
          </span>
        </div>
        <textarea
          id="feedback-message"
          name="message"
          rows="4"
          placeholder="Tell us what you liked or how we can improve..."
          value={values.message}
          onChange={handleChange}
          maxLength={MAX_MESSAGE_LENGTH}
          className={`form-textarea ${errors.message ? 'input-invalid' : ''}`}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <p id="message-error" className="error-message" role="alert">
            <span className="error-icon" aria-hidden="true">⚠</span> {errors.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button type="submit" className="submit-button">
        <span>Submit Feedback</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  )
}

export default FeedbackForm
