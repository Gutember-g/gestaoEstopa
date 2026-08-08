import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrencyBRL } from '../utils/money';
import { useToast } from '../context/ToastContext';

export default function Financeiro() {
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('TODAS');
  const [selectedVendaDetails, setSelectedVendaDetails] = useState(null);

  // Local parcelas state for status updates
  const [localParcelas, setLocalParcelas] = useState([
    {
      id: 1,
      vendaId: 101,
      numeroSequencial: 1,
      valor: 27.50,
      dataVencimento: '2026-08-05',
      dataPagamento: '2026-08-05',
      status: 'PAGO',
      clienteNome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      desconto: 0.00,
      itens: [
        { sku: 'SKU-001', nomeProduto: 'Estopa Branca Premium 1kg', custoUnitario: 8.50, precoUnitario: 15.00, quantidade: 1 },
        { sku: 'SKU-004', nomeProduto: 'Pano de Chão Alvejado 10 un', custoUnitario: 12.00, precoUnitario: 25.00, quantidade: 1 },
      ],
    },
    {
      id: 2,
      vendaId: 101,
      numeroSequencial: 2,
      valor: 27.50,
      dataVencimento: '2026-09-05',
      dataPagamento: null,
      status: 'PENDENTE',
      clienteNome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      desconto: 0.00,
      itens: [
        { sku: 'SKU-001', nomeProduto: 'Estopa Branca Premium 1kg', custoUnitario: 8.50, precoUnitario: 15.00, quantidade: 1 },
        { sku: 'SKU-004', nomeProduto: 'Pano de Chão Alvejado 10 un', custoUnitario: 12.00, precoUnitario: 25.00, quantidade: 1 },
      ],
    },
    {
      id: 3,
      vendaId: 102,
      numeroSequencial: 1,
      valor: 105.00,
      dataVencimento: '2026-07-15',
      dataPagamento: null,
      status: 'ATRASADO',
      clienteNome: 'Auto Peças Modelo Ltda',
      cpfCnpj: '98.765.432/0001-10',
      desconto: 10.00,
      itens: [
        { sku: 'SKU-003', nomeProduto: 'Retalho de Malha Algodão 5kg', custoUnitario: 22.00, precoUnitario: 42.00, quantidade: 5 },
      ],
    },
    {
      id: 4,
      vendaId: 102,
      numeroSequencial: 2,
      valor: 105.00,
      dataVencimento: '2026-08-15',
      dataPagamento: null,
      status: 'PENDENTE',
      clienteNome: 'Auto Peças Modelo Ltda',
      cpfCnpj: '98.765.432/0001-10',
      desconto: 10.00,
      itens: [
        { sku: 'SKU-003', nomeProduto: 'Retalho de Malha Algodão 5kg', custoUnitario: 22.00, precoUnitario: 42.00, quantidade: 5 },
      ],
    },
  ]);

  const { data: parcelas = localParcelas } = useQuery({
    queryKey: ['parcelas'],
    queryFn: async () => {
      try {
        const res = await api.get('/parcelas');
        if (res.data && res.data.length > 0) return res.data;
        return localParcelas;
      } catch {
        return localParcelas;
      }
    },
  });

  const handleBaixarParcela = (parcelaId, e) => {
    if (e) e.stopPropagation();
    const today = new Date().toISOString().substring(0, 10);
    const updated = localParcelas.map((p) => {
      if (p.id === parcelaId) {
        return { ...p, status: 'PAGO', dataPagamento: today };
      }
      return p;
    });
    setLocalParcelas(updated);
    
    if (selectedVendaDetails) {
      setSelectedVendaDetails((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          parcelas: prev.parcelas.map((p) =>
            p.id === parcelaId ? { ...p, status: 'PAGO', dataPagamento: today } : p
          ),
        };
      });
    }

    showSuccess('Parcela marcada como PAGA com sucesso! ✓');
  };

  const handleRowClick = (parcela) => {
    const vendaParcelas = localParcelas.filter((p) => p.vendaId === parcela.vendaId);
    setSelectedVendaDetails({
      vendaId: parcela.vendaId,
      clienteNome: parcela.clienteNome,
      cpfCnpj: parcela.cpfCnpj,
      desconto: parcela.desconto || 0,
      itens: parcela.itens || [],
      parcelas: vendaParcelas,
    });
  };

  const handleDuplicateFromDetails = () => {
    setSelectedVendaDetails(null);
    showSuccess(`Dados da Venda #${selectedVendaDetails.vendaId} prontos para duplicação em Vendas ✓`);
    navigate('/vendas');
  };

  const filteredParcelas = filterStatus === 'TODAS'
    ? parcelas
    : parcelas.filter((p) => p.status === filterStatus);

  const statusBadges = {
    PAGO: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    PENDENTE: 'bg-amber-50 text-amber-600 border-amber-200',
    ATRASADO: 'bg-red-50 text-red-600 border-red-200',
    CANCELADO: 'bg-slate-100 text-slate-400 border-slate-200',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Controle Financeiro & Parcelas</h1>
          <p className="text-xs text-slate-500 font-medium">Clique na linha da venda para visualizar os detalhes completos do pedido.</p>
        </div>

        {/* Status Filters */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex flex-wrap gap-1 text-xs font-semibold">
          {['TODAS', 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                filterStatus === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="p-4">Parcela / Venda</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Data Pagamento</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParcelas.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => handleRowClick(p)}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                >
                  <td className="p-4 font-mono font-bold text-slate-800 group-hover:text-blue-600">
                    Parc. #{p.numeroSequencial} (Venda #{p.vendaId}) 🔍
                  </td>
                  <td className="p-4 font-bold text-slate-800">{p.clienteNome}</td>
                  <td className="p-4 font-mono text-slate-600">{p.dataVencimento}</td>
                  <td className="p-4 font-mono text-slate-400">{p.dataPagamento || '-'}</td>
                  <td className="p-4 font-extrabold text-slate-800">{formatCurrencyBRL(p.valor)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${statusBadges[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {p.status === 'PENDENTE' || p.status === 'ATRASADO' ? (
                      <button
                        onClick={(e) => handleBaixarParcela(p.id, e)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] active:scale-95 transition-all shadow-sm shadow-emerald-600/20"
                      >
                        Baixar (Marcar Pago)
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Concluído ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredParcelas.map((p) => (
            <div
              key={p.id}
              onClick={() => handleRowClick(p)}
              className="p-4 space-y-2 cursor-pointer hover:bg-slate-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Parc. #{p.numeroSequencial} (Venda #{p.vendaId})</h3>
                  <p className="text-xs text-slate-500">{p.clienteNome}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${statusBadges[p.status]}`}>
                  {p.status}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400">Vence: {p.dataVencimento}</span>
                <span className="font-extrabold text-sm text-slate-800">{formatCurrencyBRL(p.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal / Drawer de Detalhes da Venda */}
      {selectedVendaDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-2xl space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Detalhes da Venda #{selectedVendaDetails.vendaId}</h2>
                <p className="text-[11px] text-slate-400">Cliente: {selectedVendaDetails.clienteNome} ({selectedVendaDetails.cpfCnpj})</p>
              </div>
              <button
                onClick={() => setSelectedVendaDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Itens Comprados */}
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-slate-700">Produtos Vendidos:</h3>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl divide-y divide-slate-200/60 overflow-hidden">
                {selectedVendaDetails.itens.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">
                        [{it.sku}] {it.nomeProduto}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Qtd: {it.quantidade}x | Custo: {formatCurrencyBRL(it.custoUnitario)} | Venda: {formatCurrencyBRL(it.precoUnitario)}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      {formatCurrencyBRL(it.precoUnitario * it.quantidade)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status das Parcelas / Cobranças */}
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-slate-700">Parcelas e Cobranças:</h3>
              <div className="space-y-2">
                {selectedVendaDetails.parcelas.map((p) => (
                  <div key={p.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">
                        Parcela #{p.numeroSequencial} — {formatCurrencyBRL(p.valor)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Vencimento: {p.dataVencimento} {p.dataPagamento ? `| Pago em: ${p.dataPagamento}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${statusBadges[p.status]}`}>
                        {p.status}
                      </span>
                      {p.status !== 'PAGO' && (
                        <button
                          onClick={(e) => handleBaixarParcela(p.id, e)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] active:scale-95 transition-all shadow-sm shadow-emerald-600/20"
                        >
                          Baixar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer with Duplication action */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={handleDuplicateFromDetails}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1.5"
              >
                <span>📋</span>
                <span>Duplicar esta Venda</span>
              </button>

              <button
                onClick={() => setSelectedVendaDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl active:scale-95 transition-all text-xs"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
