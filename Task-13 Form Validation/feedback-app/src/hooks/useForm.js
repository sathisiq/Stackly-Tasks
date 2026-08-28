import { useState } from 'react'

/**
 * Custom hook to manage form state, changes, validation, and resets for any form.
 * 
 * @param {Object} initialValues - Initial values for form fields
 * @param {Function} validate - Validation function receiving values and returning an errors object
 * @returns {Object} { values, errors, handleChange, setFieldValue, validateForm, resetForm, setValues, setErrors }
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  // Standard input/select/textarea change handler
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }))

    // Clear the error for this field as user types if error exists
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Direct field value updater (useful for custom inputs like StarRating)
  function setFieldValue(name, value) {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Validates all fields using the passed validate function
  function validateForm() {
    const newErrors = validate(values) || {}
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Resets form back to its initial values and clears errors
  function resetForm() {
    setValues(initialValues)
    setErrors({})
  }

  return {
    values,
    errors,
    handleChange,
    setFieldValue,
    validateForm,
    resetForm,
    setValues,
    setErrors
  }
}
