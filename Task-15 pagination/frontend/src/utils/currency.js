/**
 * Formats a numeric value into Indian Rupees currency string (e.g. ₹29,990.00)
 */
export function formatINR(amount) {
  const num = parseFloat(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
