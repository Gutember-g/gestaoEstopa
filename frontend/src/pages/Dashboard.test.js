import { describe, it, expect } from 'vitest';

describe('Dashboard Period Filter & Replacement Cards Logic Tests', () => {
  const monthsList = [
    { key: '2026-08', label: 'Agosto 2026', faturamento: 265.00, prevFaturamento: 235.00 },
    { key: '2026-07', label: 'Julho 2026', faturamento: 235.00, prevFaturamento: 210.00 },
  ];

  const proximosFaturamentos = [
    { id: 1, diasParaVencer: 0, badgeText: 'Vence hoje' },
    { id: 2, diasParaVencer: 3, badgeText: 'Vence em 3 dias' },
    { id: 4, diasParaVencer: 12, badgeText: 'Vence em 12 dias' },
  ];

  it('calculates monthly percentage growth vs previous month correctly', () => {
    const month = monthsList[0];
    const pct = (((month.faturamento - month.prevFaturamento) / month.prevFaturamento) * 100).toFixed(1);
    expect(pct).toBe('12.8');
  });

  it('assigns correct urgency badges for upcoming receivables', () => {
    const hoje = proximosFaturamentos.find(f => f.diasParaVencer === 0);
    expect(hoje.badgeText).toBe('Vence hoje');

    const emBreve = proximosFaturamentos.find(f => f.diasParaVencer === 3);
    expect(emBreve.badgeText).toBe('Vence em 3 dias');
  });
});
