import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value.
 * Delays updating the debounced value until after delay ms have elapsed
 * since the last time the value changed.
 *
 * @param {any} value - The input value to debounce (e.g. search term)
 * @param {number} delay - The debounce delay in milliseconds (default: 300)
 * @returns {any} - The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Start a timer to update debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    // Clear timeout if value changes again before the delay finishes (prevents rapid API calls)
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
