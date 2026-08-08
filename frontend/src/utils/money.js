/**
 * Utility functions for BRL currency formatting and input masking.
 */

/**
 * Formats a raw number or string float to BRL currency string (e.g. 1500 -> "R$ 1.500,00").
 */
export const formatCurrencyBRL = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Applies BRL currency mask dynamically while the user types in an input.
 * Example: "950" -> "R$ 9,50", "1500000" -> "R$ 15.000,00".
 */
export const applyCurrencyMask = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  const cleanDigits = String(value).replace(/\D/g, '');
  if (!cleanDigits) return 'R$ 0,00';
  const numericValue = parseFloat(cleanDigits) / 100;
  return formatCurrencyBRL(numericValue);
};

/**
 * Converts a BRL currency masked string back into a floating point number.
 * Example: "R$ 15.000,00" -> 15000.00, "R$ 9,50" -> 9.50.
 */
export const parseCurrencyToNumber = (maskedValue) => {
  if (typeof maskedValue === 'number') return maskedValue;
  if (!maskedValue) return 0;
  const cleanDigits = String(maskedValue).replace(/\D/g, '');
  if (!cleanDigits) return 0;
  return parseFloat(cleanDigits) / 100;
};
