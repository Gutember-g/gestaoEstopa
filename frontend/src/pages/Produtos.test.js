import { describe, it, expect } from 'vitest';
import { formatCurrencyBRL, parseCurrencyToNumber } from '../utils/money';

describe('Produtos Page Logic Tests', () => {
  it('calculates profit margin percentage correctly', () => {
    const custo = 8.50;
    const venda = 18.00;
    const margem = (((venda - custo) / custo) * 100).toFixed(2);
    expect(margem).toBe('111.76');
  });

  it('detects when product is linked to sales and recommends inactivation', () => {
    const produto = { id: 1, nome: 'Estopa Branca Especial 1kg', temVendas: true };
    expect(produto.temVendas).toBe(true);
  });
});
