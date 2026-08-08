import { describe, it, expect } from 'vitest';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from './money';

describe('money utility functions', () => {
  it('formatCurrencyBRL formats numbers correctly to BRL', () => {
    expect(formatCurrencyBRL(1500)).toContain('1.500,00');
    expect(formatCurrencyBRL(9.5)).toContain('9,50');
    expect(formatCurrencyBRL(0)).toContain('0,00');
  });

  it('applyCurrencyMask applies BRL mask dynamically on user input digits', () => {
    expect(applyCurrencyMask('950')).toContain('9,50');
    expect(applyCurrencyMask('1500000')).toContain('15.000,00');
    expect(applyCurrencyMask('')).toContain('0,00');
  });

  it('parseCurrencyToNumber parses formatted BRL strings to floats', () => {
    expect(parseCurrencyToNumber('R$ 9,50')).toBe(9.50);
    expect(parseCurrencyToNumber('R$ 15.000,00')).toBe(15000.00);
    expect(parseCurrencyToNumber('R$ 0,00')).toBe(0);
  });
});
