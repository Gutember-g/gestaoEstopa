import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from '../utils/money';
import { useToast } from '../context/ToastContext';
import MonthFilter from '../components/MonthFilter';
import ActionButton from '../components/ActionButton';
import { useVendaModal } from '../context/VendaModalContext';

export default function Financeiro() {
  const { showSuccess, showError } = useToast();
  const { openVendaModal } = useVendaModal();
  const queryClient = useQueryClient();

  // Period filter state
  const [filterPeriod, setFilterPeriod] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
  });

  const [filterStatus, setFilterStatus] = useState('TODAS');
  const [selectedVendaDetails, setSelectedVendaDetails] = useState(null);

  // Fetch parcelas from API
  const { data: parcelasRaw = [], isFetching } = useQuery({
    queryKey: ['parcelas', filterPeriod.mes, filterPeriod.ano, filterStatus],
    queryFn: async () => {
      try {
        const res = await api.get('/financeiro/parcelas', {
          params: {
            mes: filterPeriod.mes,
            ano: filterPeriod.ano,
            status: filterStatus,
          },
        });
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
        return [];
      } catch {
        return [];
      }
    },
  });

  // Fetch products for duplication modal dropdown
  const { data: produtosRaw = [] } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const res = await api.get('/produtos');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
  });

  const parcelas = Array.isArray(parcelasRaw) ? parcelasRaw : [];

  // Item 3: Mark parcela as PAGO in backend API and invalidate caches
  const handleBaixarParcela = async (parcelaId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/financeiro/parcelas/${parcelaId}/pagar`);
      showSuccess('Parcela marcada como PAGA com sucesso! ✓');
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (selectedVendaDetails) {
        const today = new Date().toISOString().substring(0, 10);
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
    } catch {
      showError('Não foi possível atualizar o status da parcela.');
    }
  };

  // Item 4: Fetch full sale details when clicking a parcela row
  const handleRowClick = async (parcela) => {
    try {
      const res = await api.get('/vendas');
      const vendas = Array.isArray(res.data) ? res.data : [];
      const venda = vendas.find((v) => v.id === parcela.vendaId);

      const resParcelas = await api.get('/financeiro/parcelas');
      const allParcelas = Array.isArray(resParcelas.data) ? resParcelas.data : [];
      const vendaParcelas = allParcelas.filter((p) => p.vendaId === parcela.vendaId);

      if (venda) {
        setSelectedVendaDetails({
          vendaId: venda.id,
          clienteNome: venda.clienteNome,
          cpfCnpj: parcela.cpfCnpj || '',
          desconto: venda.desconto || 0,
          itens: venda.itens || [],
          parcelas: vendaParcelas.length > 0 ? vendaParcelas : [parcela],
          vendaData: venda,
        });
      } else {
        setSelectedVendaDetails({
          vendaId: parcela.vendaId,
          clienteNome: parcela.clienteNome,
          cpfCnpj: parcela.cpfCnpj || '',
          desconto: parcela.desconto || 0,
          itens: [],
          parcelas: [parcela],
        });
      }
    } catch {
      setSelectedVendaDetails({
        vendaId: parcela.vendaId,
        clienteNome: parcela.clienteNome,
        cpfCnpj: parcela.cpfCnpj || '',
        desconto: parcela.desconto || 0,
        itens: [],
        parcelas: [parcela],
      });
    }
  };

  // Open reusable sale modal for duplication in Financeiro
  const handleDuplicateFromDetails = () => {
    if (!selectedVendaDetails?.vendaData) {
      showError('Não foi possível carregar os dados completos desta venda para duplicação.');
      return;
    }
    openVendaModal(selectedVendaDetails.vendaData);
    setSelectedVendaDetails(null);
  };

  const MESES_NOME = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const periodLabel = `${MESES_NOME[filterPeriod.mes - 1] || ''} ${filterPeriod.ano}`;

  const statusBadges = {
    PAGO: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    PENDENTE: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    ATRASADO: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
    CANCELADO: 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Controle Financeiro & Parcelas</h1>
            {isFetching && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 animate-pulse border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                <svg className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Carregando...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clique na linha da parcela para visualizar os detalhes completos do pedido.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <MonthFilter onChange={setFilterPeriod} />

          {/* Status Filters */}
          <div className="bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl flex flex-wrap gap-1 text-xs font-semibold">
            {['TODAS', 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                  filterStatus === st 
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {parcelas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
              💳
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhuma parcela encontrada em {periodLabel}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Não foram encontradas parcelas financeiras para o período e status selecionados.</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto pr-2">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-4">Parcela / Venda</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Vencimento</th>
                    <th className="p-4">Data Pagamento</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right w-44">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parcelas.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleRowClick(p)}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group h-auto"
                    >
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Parc. #{p.numeroSequencial} (Venda #{p.vendaId})
                      </td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{p.clienteNome}</td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{p.dataVencimento}</td>
                      <td className="p-4 font-mono text-slate-400 dark:text-slate-500">{p.dataPagamento || '-'}</td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-slate-100">{formatCurrencyBRL(p.valor)}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${statusBadges[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right w-44" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {p.status === 'PENDENTE' || p.status === 'ATRASADO' ? (
                            <ActionButton
                              label="Marcar Pago"
                              icon="✓"
                              variant="success"
                              size="xs"
                              onClick={(e) => handleBaixarParcela(p.id, e)}
                            />
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium self-center">Concluído ✓</span>
                          )}
                          <ActionButton
                            label="Detalhes"
                            icon="👁️"
                            variant="secondary"
                            size="xs"
                            onClick={() => handleRowClick(p)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {parcelas.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleRowClick(p)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Parc. #{p.numeroSequencial} (Venda #{p.vendaId})</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.clienteNome}</p>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${statusBadges[p.status]}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-400">Vence: {p.dataVencimento}</span>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{formatCurrencyBRL(p.valor)}</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    {p.status !== 'PAGO' && (
                      <ActionButton
                        label="Marcar Pago"
                        icon="✓"
                        variant="success"
                        size="xs"
                        onClick={(e) => handleBaixarParcela(p.id, e)}
                      />
                    )}
                    <ActionButton
                      label="Ver Detalhes"
                      icon="👁️"
                      variant="secondary"
                      size="xs"
                      onClick={() => handleRowClick(p)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal / Drawer de Detalhes da Venda (Item 4) */}
      {selectedVendaDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl my-auto animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 p-4 sm:px-6 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Detalhes da Venda #{selectedVendaDetails.vendaId}</h2>
                <p className="text-[11px] text-slate-400">Cliente: {selectedVendaDetails.clienteNome} ({selectedVendaDetails.cpfCnpj})</p>
              </div>
              <button
                onClick={() => setSelectedVendaDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
              {/* Itens Comprados */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Produtos Vendidos:</h3>
                {selectedVendaDetails.itens && selectedVendaDetails.itens.length > 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl divide-y divide-slate-200/60 dark:divide-slate-700 overflow-hidden">
                    {selectedVendaDetails.itens.map((it, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {it.nomeProduto}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Qtd: {it.quantidade}x | Valor Unit.: {formatCurrencyBRL(it.precoNoMomento)}
                          </div>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrencyBRL((it.precoNoMomento || 0) * (it.quantidade || 1))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-xs">Nenhum item discriminado nesta venda.</p>
                )}
              </div>

              {/* Status das Parcelas / Cobranças */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-slate-700 dark:text-slate-300">Parcelas e Cobranças:</h3>
                <div className="space-y-2">
                  {selectedVendaDetails.parcelas.map((p) => (
                    <div key={p.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
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
                          <ActionButton
                            label="Marcar Pago"
                            icon="✓"
                            variant="success"
                            size="xs"
                            onClick={(e) => handleBaixarParcela(p.id, e)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer with Duplication action (Item 5) */}
            <div className="flex justify-between items-center p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
              <ActionButton
                label="Duplicar esta Venda"
                icon="📋"
                variant="primary"
                size="sm"
                onClick={handleDuplicateFromDetails}
              />

              <ActionButton
                label="Fechar"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedVendaDetails(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
