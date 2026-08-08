import { describe, it, expect } from 'vitest';

describe('Clientes Page & Histórico Comercial Tests', () => {
  const normalizeStr = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[^\w]/g, '');

  const clientes = [
    { id: 1, nome: 'Distribuidora Silva & Cia', cpfCnpj: '12.345.678/0001-90', temVendas: true },
    { id: 2, nome: 'Auto Peças Modelo Ltda', cpfCnpj: '98.765.432/0001-10', temVendas: true },
    { id: 3, nome: 'Comércio Industrial Souza', cpfCnpj: '45.678.901/0001-23', temVendas: false },
  ];

  const salesDatabase = {
    1: [
      { id: 101, valorTotal: 55.00 },
      { id: 98, valorTotal: 210.00 },
    ],
  };

  it('filters clients ignoring dots, slashes, dashes and spaces in CPF/CNPJ', () => {
    const rawSearch = '12345678';
    const cleanSearch = normalizeStr(rawSearch);

    const results = clientes.filter(
      (c) =>
        normalizeStr(c.nome).includes(cleanSearch) ||
        normalizeStr(c.cpfCnpj).includes(cleanSearch)
    );

    expect(results).toHaveLength(1);
    expect(results[0].nome).toBe('Distribuidora Silva & Cia');
  });

  it('calculates lifetime value and average ticket correctly for client history', () => {
    const clientSales = salesDatabase[1];
    const totalComprado = clientSales.reduce((acc, v) => acc + v.valorTotal, 0);
    const ticketMedio = totalComprado / clientSales.length;

    expect(totalComprado).toBe(265.00);
    expect(ticketMedio).toBe(132.50);
  });
});
