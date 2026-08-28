# Task 13 — Custom Hooks Form Validation & Toast Notification System

## 📌 Project Overview
This project demonstrates how to eliminate repetitive form logic and eliminate browser-blocking `alert()` dialogs in React applications using two custom hooks:
1. **`useForm`**: Generic, reusable hook for managing input states, dynamic changes, multi-field validation, and form resetting.
2. **`useToast`**: Modern notification hook that renders auto-expiring (3s) toast messages with color-coded status styles.

---

## 📝 Submission Answers (Write-Up)

### Question 1: What is a custom hook? Why must its name start with "use"?

**Answer:**
- **What is a custom hook:**  
  A custom hook is a standard JavaScript function whose name starts with `"use"` and that can call other built-in React hooks (such as `useState`, `useEffect`, `useCallback`, `useRef`). Custom hooks allow developers to extract stateful component logic (e.g., form handling, data fetching, timers, subscription listeners) into reusable, isolated functions that can be shared across multiple components without duplicating code or changing the component hierarchy.

- **Why its name must start with "use":**  
  1. **Rules of Hooks Enforcement:** React's official ESLint plugin (`eslint-plugin-react-hooks`) and the React compiler rely on the `"use"` naming convention to identify hooks. This allows automated static analysis to verify that the **Rules of Hooks** are strictly followed (i.e., hooks must only be called at the top level of function components or custom hooks, never inside loops, nested functions, or conditional blocks).
  2. **Predictability:** The `"use"` prefix tells other developers and React tooling that this function contains stateful React logic and must be called following React's lifecycle rules.

---

### Question 2: Paste your `useForm` hook code. How does one hook handle validation for multiple different fields?

#### `useForm.js` Code:
```javascript
import { useState } from 'react'

/**
 * Custom hook to manage form state, changes, validation, and resets for any form.
 * 
 * @param {Object} initialValues - Initial values for form fields
 * @param {Function} validate - Validation function receiving values and returning an errors object
 * @returns {Object} { values, errors, handleChange, setFieldValue, validateForm, resetForm }
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  // Handles standard input/select/textarea change events
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }))

    // Auto-clear error as user types into the invalid field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  // Direct value setter (for custom inputs like StarRating)
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

  // Validates all fields using the passed validate callback
  function validateForm() {
    const newErrors = validate(values) || {}
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Resets form state back to initial values
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
    resetForm
  }
}
```

#### How it handles validation for multiple different fields:
1. **Dependency Injection / Strategy Pattern:** `useForm` does not hardcode any field names or validation rules. Instead, it accepts a customizable `validate` function as an argument.
2. **Key-Value Errors Map:** When `validateForm()` is invoked, it passes the current `values` object to `validate(values)`. The validation function inspects each field (`name`, `email`, `rating`, `message`, etc.) and returns an object containing error messages keyed by field name (e.g., `{ email: 'Valid email is required', rating: 'Please select a rating' }`).
3. **Dynamic Error Mapping:** `useForm` stores this error map in `errors` state. Components can then simply check `errors.name` or `errors.email` to display inline validation messages under each respective input.
4. **Reusability:** By separating the *state management mechanism* (inside the hook) from the *validation business rules* (in the component), this single hook can handle Login forms, Registration forms, Checkout forms, or Feedback forms with zero modifications.

---

### Question 3: How does your toast message disappear automatically after 3 seconds? Show the exact code responsible for that.

#### `useToast.js` Code:
```javascript
import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type }

    // 1. Add new toast to state
    setToasts(prev => [...prev, newToast])

    // 2. Automatically remove after 3000ms (3 seconds)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return { toasts, showToast, removeToast }
}
```

#### Exact code responsible for the 3-second auto-removal:
```javascript
setTimeout(() => {
  setToasts(prev => prev.filter(t => t.id !== id))
}, 3000)
```

#### How it works:
1. When `showToast` is triggered, it generates a unique identifier `id` and adds the toast to `toasts` state.
2. It immediately schedules a timer via `setTimeout(..., 3000)` on the browser's JavaScript event loop.
3. After exactly 3000 milliseconds (3 seconds), the callback executes and filters out the toast with that specific `id` from the array (`prev.filter(t => t.id !== id)`).
4. Updating the state triggers React to re-render `ToastContainer`, seamlessly removing the toast from the screen without requiring any manual user interaction.

---

### Question 4: Why is a toast notification better UX than `alert()` for the user?

**Answer:**
1. **Non-Blocking vs. Blocking (Thread Interruption):**
   - `alert()` is synchronous and modal: it completely pauses JavaScript execution, freezes all background animations, and prevents the user from clicking, typing, scrolling, or navigating anywhere on the page until they click "OK".
   - Toast notifications are asynchronous and non-blocking: they float gently on top of the UI, allowing the user to continue typing or browsing without interruption.
2. **Brand Consistency & Visual Hierarchy:**
   - `alert()` displays an un-styled, operating-system-level popup box that cannot be customized with colors, fonts, icons, or transitions.
   - Toasts can be fully styled with theme colors (green for success, red for errors, blue for info), brand typography, status icons, and smooth entrance/exit animations.
3. **No Unnecessary Friction:**
   - `alert()` forces the user to perform an extra, repetitive click just to acknowledge a simple message.
   - Toasts auto-dismiss after 3 seconds, conveying feedback with zero extra effort from the user.
4. **Stacking & Multi-Message Support:**
   - `alert()` can only show one dialog at a time and interrupts sequential tasks.
   - Toasts can queue or stack gracefully (e.g., showing consecutive updates) without locking the interface.

---

## 🌟 Features Implemented

- ✅ **`useForm` Custom Hook**: Complete form state, inline error tracking, dynamic validation, and form resetting.
- ✅ **`useToast` Custom Hook**: Toast queue, 3s auto-dismiss timers, status types (`success`, `error`, `info`).
- ✅ **Zero `alert()` Policy**: Completely replaced with modern floating toasts.
- ✅ **Interactive Star Rating (Bonus)**: 5-star interactive selector with hover preview and rating labels.
- ✅ **Live Character Counter (Bonus)**: Real-time counter under the message field with limit warning.
- ✅ **`localStorage` Persistence (Bonus)**: Saved feedbacks persist across browser refreshes.
- ✅ **Responsive Modern UI**: Glassmorphism cards, animated progress countdown, and mobile-responsive layout.

---

## 🚀 Quick Setup & Run Instructions

```bash
# Navigate to the project directory
cd feedback-app

# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Build for production
npm run build
```
