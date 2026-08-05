import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function Vendas() {
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [clienteId, setClienteId] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [numParcelas, setNumParcelas] = useState(2);
  const [itens, setItens] = useState([
    { nomeProdutoSnapshot: 'Estopa Branca Especial 1kg', custoNoMomento: 8.50, precoNoMomento: 18.00, quantidade: 2 },
    { nomeProdutoSnapshot: 'Panos de Chão Algodão Pacote 10x', custoNoMomento: 15.00, precoNoMomento: 28.00, quantidade: 1 }
  ]);

  const queryClient = useQueryClient();

  const { data: vendas = [] } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      try {
        const res = await api.get('/vendas');
        return res.data;
      } catch {
        return [
          {
            id: 101,
            clienteNome: 'Distribuidora Silva & Cia',
            cpfCnpj: '12.345.678/0001-90',
            dataVenda: '2026-08-05 14:30',
            custoTotal: 32.00,
            valorTotal: 64.00,
            desconto: 4.00,
            lucroLiquido: 28.00,
            itensCount: 3,
            parcelasCount: 2,
            parcelas: [
              { numeroSequencial: '1/2', valor: 30.00, dataVencimento: '2026-08-05', status: 'PAGO' },
              { numeroSequencial: '2/2', valor: 30.00, dataVencimento: '2026-09-05', status: 'PENDENTE' },
            ]
          },
          {
            id: 102,
            clienteNome: 'Auto Peças Modelo Ltda',
            cpfCnpj: '98.765.432/0001-10',
            dataVenda: '2026-08-04 11:15',
            custoTotal: 120.00,
            valorTotal: 250.00,
            desconto: 10.00,
            lucroLiquido: 120.00,
            itensCount: 5,
            parcelasCount: 3,
            parcelas: [
              { numeroSequencial: '1/3', valor: 80.00, dataVencimento: '2026-07-15', status: 'ATRASADO' },
              { numeroSequencial: '2/3', valor: 80.00, dataVencimento: '2026-08-15', status: 'PENDENTE' },
              { numeroSequencial: '3/3', valor: 80.00, dataVencimento: '2026-09-15', status: 'PENDENTE' },
            ]
          }
        ];
      }
    }
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Math calculations for Sales Form
  const subtotalSemDesconto = itens.reduce((acc, item) => acc + item.precoNoMomento * item.quantidade, 0);
  const custoTotalCalc = itens.reduce((acc, item) => acc + item.custoNoMomento * item.quantidade, 0);
  const valorDescontoCalc = parseFloat(desconto) || 0;
  const valorTotalFinal = subtotalSemDesconto - valorDescontoCalc;
  const lucroLiquidoPrevisto = valorTotalFinal - custoTotalCalc;
  const margemLucroPrevista = custoTotalCalc > 0 ? ((lucroLiquidoPrevisto / custoTotalCalc) * 100).toFixed(1) : 0;

  // Add Item to Snapshot list
  const handleAddItem = () => {
    setItens([
      ...itens,
      { nomeProdutoSnapshot: 'Estopa Colorida Limpeza 500g', custoNoMomento: 4.20, precoNoMomento: 9.50, quantidade: 1 }
    ]);
  };

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const statusBadges = {
    PAGO: 'badge-pago',
    PENDENTE: 'badge-pendente',
    ATRASADO: 'badge-atrasado',
    CANCELADO: 'badge-cancelado',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Controle Comercial & Vendas</h1>
          <p className="text-xs text-slate-500 font-medium">Emissão de vendas com regra de Snapshot Histórico imutável de produtos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all min-h-[44px]"
        >
          <span>+</span>
          <span>Nova Venda Mobile-First</span>
        </button>
      </div>

      {/* Sales List Table Desktop & Cards Mobile */}
      <div className="erp-card p-0 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="p-4">ID Venda</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Data</th>
                <th className="p-4">Custo Total</th>
                <th className="p-4">Valor Total</th>
                <th className="p-4">Desconto</th>
                <th className="p-4">Lucro Líquido Previsto</th>
                <th className="p-4">Parcelamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendas.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">#{v.id}</td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{v.clienteNome}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{v.cpfCnpj}</div>
                  </td>
                  <td className="p-4 text-slate-500">{v.dataVenda}</td>
                  <td className="p-4 font-mono text-slate-500">{formatCurrency(v.custoTotal)}</td>
                  <td className="p-4 font-bold text-slate-900">{formatCurrency(v.valorTotal)}</td>
                  <td className="p-4 font-mono text-slate-400">-{formatCurrency(v.desconto)}</td>
                  <td className="p-4">
                    <span className="badge-pago font-mono">
                      +{formatCurrency(v.lucroLiquido)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {v.parcelas?.map((p, idx) => (
                        <span key={idx} className={statusBadges[p.status]} title={`Vencimento: ${p.dataVencimento}`}>
                          {p.numeroSequencial}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {vendas.map((v) => (
            <div key={v.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">#{v.id}</span>
                  <h3 className="font-bold text-sm text-slate-900">{v.clienteNome}</h3>
                </div>
                <span className="badge-pago text-xs">{formatCurrency(v.lucroLiquido)} lucro</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">VALOR TOTAL</span>
                  <span className="font-bold text-slate-900">{formatCurrency(v.valorTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CUSTO TOTAL</span>
                  <span className="font-mono text-slate-600">{formatCurrency(v.custoTotal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 text-[11px]">Parcelas:</span>
                <div className="flex gap-1">
                  {v.parcelas?.map((p, idx) => (
                    <span key={idx} className={statusBadges[p.status]}>
                      {p.numeroSequencial}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal / Mobile-First Sales Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-xl space-y-5 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Emissão de Venda (Snapshot Pattern)</h2>
                <p className="text-[11px] text-slate-400">Produtos salvos de forma imutável com lucro e parcelas.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }} className="space-y-4 text-xs">
              {/* 1. Cliente Selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">1. Selecionar Cliente *</label>
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-xs focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Escolha um cliente cadastrado...</option>
                  <option value="1">Distribuidora Silva & Cia (CNPJ: 12.345.678/0001-90)</option>
                  <option value="2">Auto Peças Modelo Ltda (CNPJ: 98.765.432/0001-10)</option>
                </select>
              </div>

              {/* 2. Items List with Snapshot */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">2. Produtos (Snapshot Imutável) *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                  >
                    + Adicionar Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {itens.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{item.nomeProdutoSnapshot}</div>
                        <div className="text-[10px] text-slate-400">
                          Custo no momento: {formatCurrency(item.custoNoMomento)} | Venda: {formatCurrency(item.precoNoMomento)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{item.quantidade}x</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 text-sm font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Discount & Installments controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Desconto Concedido (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nº de Parcelas</label>
                  <select
                    value={numParcelas}
                    onChange={(e) => setNumParcelas(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value={1}>1x (À Vista)</option>
                    <option value={2}>2x Parcelado</option>
                    <option value={3}>3x Parcelado</option>
                    <option value={4}>4x Parcelado</option>
                  </select>
                </div>
              </div>

              {/* 4. Real-time Financial Summary Card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 shadow-inner">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Subtotal sem Desconto:</span>
                  <span className="font-mono">{formatCurrency(subtotalSemDesconto)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Custo Total dos Produtos:</span>
                  <span className="font-mono">{formatCurrency(custoTotalCalc)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Valor do Desconto:</span>
                  <span className="font-mono text-amber-400">-{formatCurrency(valorDescontoCalc)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Valor Total Final</div>
                    <div className="text-lg font-bold text-white">{formatCurrency(valorTotalFinal)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-400 uppercase font-semibold">Lucro Líquido Previsto</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {formatCurrency(lucroLiquidoPrevisto)} <span className="text-xs font-normal">({margemLucroPrevista}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parcelas Preview Schedule */}
              <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-600">Simulação de Parcelamento:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Array.from({ length: numParcelas }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-2">
                      <span className="badge-pendente text-[10px]">{i + 1}/{numParcelas}</span>
                      <span className="font-bold text-slate-800">{formatCurrency(valorTotalFinal / numParcelas)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20"
                >
                  Finalizar & Emitir Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
