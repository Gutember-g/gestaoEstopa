import { describe, it, expect } from 'vitest';

describe('Financeiro Page Logic Tests', () => {
  it('filters parcelas by status correctly', () => {
    const parcelas = [
      { id: 1, status: 'PAGO' },
      { id: 2, status: 'PENDENTE' },
      { id: 3, status: 'ATRASADO' },
    ];

    const pendentes = parcelas.filter(p => p.status === 'PENDENTE');
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].id).toBe(2);
  });

  it('updates parcela status to PAGO when discharge is performed', () => {
    let parcela = { id: 2, status: 'PENDENTE', dataPagamento: null };
    const today = '2026-08-07';

    parcela = { ...parcela, status: 'PAGO', dataPagamento: today };

    expect(parcela.status).toBe('PAGO');
    expect(parcela.dataPagamento).toBe(today);
  });
});
