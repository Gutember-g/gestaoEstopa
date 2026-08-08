import { describe, it, expect } from 'vitest';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from '../utils/money';

describe('Vendas Refactored Logic & Empty State Tests', () => {
  const createEmptyItem = () => ({
    produtoId: '',
    sku: '',
    nomeProduto: '',
    custoNoMomento: 0,
    precoNoMomentoFormatted: '',
    quantidade: 1,
  });

  it('starts modal with 1 empty item line', () => {
    const itens = [createEmptyItem()];
    expect(itens).toHaveLength(1);
    expect(itens[0].produtoId).toBe('');
    expect(itens[0].nomeProduto).toBe('');
    expect(itens[0].precoNoMomentoFormatted).toBe('');
  });

  it('resets to 1 empty line when removing the last remaining item', () => {
    let itens = [{
      produtoId: 1,
      sku: 'SKU-001',
      nomeProduto: 'Estopa Branca Premium 1kg',
      custoNoMomento: 8.50,
      precoNoMomentoFormatted: 'R$ 15,00',
      quantidade: 1,
    }];

    // Handler logic for removing item at index 0 when length <= 1
    const removeLine = (index) => {
      if (itens.length <= 1) {
        itens = [createEmptyItem()];
      } else {
        itens = itens.filter((_, i) => i !== index);
      }
    };

    removeLine(0);
    expect(itens).toHaveLength(1);
    expect(itens[0].produtoId).toBe('');
    expect(itens[0].precoNoMomentoFormatted).toBe('');
  });

  it('appends a clean empty line when adding a new item', () => {
    let itens = [createEmptyItem()];
    itens = [...itens, createEmptyItem()];

    expect(itens).toHaveLength(2);
    expect(itens[1].produtoId).toBe('');
    expect(itens[1].quantidade).toBe(1);
  });

  it('calculates line item subtotal and totals correctly with custom prices', () => {
    const itens = [
      { produtoId: 1, custoNoMomento: 8.50, precoNoMomentoFormatted: 'R$ 15,00', quantidade: 2 },
      { produtoId: 4, custoNoMomento: 12.00, precoNoMomentoFormatted: 'R$ 25,00', quantidade: 1 },
    ];

    const subtotal = itens.reduce((acc, item) => acc + parseCurrencyToNumber(item.precoNoMomentoFormatted) * item.quantidade, 0);
    const custoTotal = itens.reduce((acc, item) => acc + item.custoNoMomento * item.quantidade, 0);
    const desconto = 5.00;
    const totalFinal = subtotal - desconto;
    const lucro = totalFinal - custoTotal;
    const margem = ((lucro / custoTotal) * 100).toFixed(1);

    expect(subtotal).toBe(55.00);
    expect(custoTotal).toBe(29.00);
    expect(totalFinal).toBe(50.00);
    expect(lucro).toBe(21.00);
    expect(margem).toBe('72.4');
  });

  it('formats BRL currency mask dynamically while typing', () => {
    expect(applyCurrencyMask('950')).toContain('9,50');
    expect(applyCurrencyMask('1500000')).toContain('15.000,00');
  });

  it('calculates due date from payment term in days', () => {
    const baseDate = new Date('2026-08-06T12:00:00Z');
    const days = 30;
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + days);

    expect(dueDate.getDate()).toBe(5);
    expect(dueDate.getMonth()).toBe(8); // September
  });
});
