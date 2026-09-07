import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import MonthFilter from '../components/MonthFilter';
import ActionButton from '../components/ActionButton';
import { formatCurrencyBRL } from '../utils/money';
import { useVendaModal } from '../context/VendaModalContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { openVendaModal } = useVendaModal();
  const { activeTab } = useOutletContext() || { activeTab: 'geral' };
  const [selectedVendaDetails, setSelectedVendaDetails] = useState(null);

  // Period filter state
  const [filterPeriod, setFilterPeriod] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
  });

  // Query Real Dashboard Data from Backend API
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['dashboard', filterPeriod.mes, filterPeriod.ano],
    queryFn: async () => {
      const response = await api.get('/dashboard', {
        params: { mes: filterPeriod.mes, ano: filterPeriod.ano }
      });
      return response.data;
    },
    refetchInterval: 15000,
  });

  const faturamentoMensal = dashboardData?.faturamentoMensal || 0;
  const lucroLiquidoMensal = dashboardData?.lucroLiquidoMensal || 0;
  const fluxocaixaRecebido = dashboardData?.fluxocaixaRecebido || 0;
  const fluxocaixaPendente = dashboardData?.fluxocaixaPendente || 0;
  const variacaoPercentual = dashboardData?.variacaoPercentual || '+0%';
  const historico12Meses = dashboardData?.historico12Meses || [];
  const topClientes = dashboardData?.topClientes || [];
  const topProdutos = dashboardData?.topProdutos || [];
  const recentesVendas = dashboardData?.recentesVendas || [];
  const proximosFaturamentos = dashboardData?.proximosFaturamentos || [];
  const labelPeriodo = dashboardData?.labelPeriodo || '';

  // Max value in 12-month chart for dynamic height scaling
  const maxChartVal = historico12Meses.length > 0
    ? Math.max(...historico12Meses.map((m) => Number(m.faturamento || 0)))
    : 100;

  const handleBarClick = (itemKey) => {
    if (!itemKey) return;
    const parts = itemKey.split('-');
    if (parts.length === 2) {
      setFilterPeriod({
        ano: parseInt(parts[0], 10),
        mes: parseInt(parts[1], 10),
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto pb-24 md:pb-8">
      {/* Header Bar with Month Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Dashboard Analítico</span>
            <span className="text-xs font-normal text-slate-500">({activeTab})</span>
          </h1>
          <p className="text-xs text-slate-500">
            Dados consolidados do PostgreSQL para o período: <strong className="text-slate-800">{labelPeriodo}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <MonthFilter onChange={setFilterPeriod} />

          <button
            onClick={() => openVendaModal()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all min-h-[44px]"
          >
            <span>+</span>
            <span>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Row 1: KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Faturamento do Mês */}
        <div className="sm:col-span-2 erp-hero-card flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Faturamento do Mês</p>
                <span className="bg-emerald-500/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  {variacaoPercentual} vs. mês anterior
                </span>
              </div>
              <p className="text-3xl font-bold mt-2 tracking-tight">
                {formatCurrencyBRL(faturamentoMensal)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
              📊
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs border-t border-white/10 pt-3">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
              Período: {labelPeriodo}
            </span>
            <span className="text-blue-100 font-semibold">
              Lucro Líquido: {formatCurrencyBRL(lucroLiquidoMensal)}
            </span>
          </div>
        </div>

        {/* Card 2: Caixa Efetivado (Pago) */}
        <div className="erp-card flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Caixa Efetivado (Pago)</p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {formatCurrencyBRL(fluxocaixaRecebido)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
            <span className="badge-pago font-bold">Quitado</span>
            <span className="text-slate-500 font-medium">PostgreSQL Real</span>
          </div>
        </div>

        {/* Card 3: A Receber / Pendente */}
        <div className="erp-card flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">A Receber / Pendente</p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {formatCurrencyBRL(fluxocaixaPendente)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
            <span className="badge-pendente font-bold">Cobrança Ativa</span>
            <span className="text-slate-400 text-[11px] font-medium">Vencendo no mês</span>
          </div>
        </div>
      </div>

      {/* Row 2: 12-Month Real Revenue History Chart */}
      <div className="erp-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>📈 Faturamento por Mês (Histórico do Banco)</span>
            </h2>
            <p className="text-xs text-slate-400">Dados reais agrupados por mês do PostgreSQL. Clique em uma coluna para selecionar o período.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-slate-600 font-medium">Mês Atual Selecionado</span>
          </div>
        </div>

        <div className="relative pt-4 pb-2">
          <div className="overflow-x-auto overflow-y-hidden max-w-full pb-2 touch-pan-x">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2 min-w-[620px] md:min-w-0">
              {historico12Meses.map((m) => {
                const fat = Number(m.faturamento || 0);
                const currentKey = `${filterPeriod.ano}-${String(filterPeriod.mes).padStart(2, '0')}`;
                const isSelected = m.key === currentKey;
                const heightPct = maxChartVal > 0 ? Math.max(10, (fat / maxChartVal) * 100) : 10;

                return (
                  <div
                    key={m.key}
                    onClick={() => handleBarClick(m.key)}
                    className="flex-1 min-w-[42px] md:min-w-0 flex flex-col items-center gap-2 group cursor-pointer"
                    title={`${m.label}: ${formatCurrencyBRL(fat)} (Clique para filtrar)`}
                  >
                    <span className={`text-[10px] font-mono font-bold transition-all ${
                      isSelected ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-700'
                    }`}>
                      R${Math.round(fat)}
                    </span>

                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isSelected
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-500 ring-2 ring-blue-500/50 shadow-md'
                            : fat > 0 ? 'bg-blue-400 group-hover:bg-blue-500' : 'bg-slate-200'
                        }`}
                      ></div>
                    </div>

                    <span className={`text-[10px] font-semibold transition-colors whitespace-nowrap ${
                      isSelected ? 'text-blue-600 font-extrabold' : 'text-slate-500'
                    }`}>
                      {m.shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Clientes & Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Top Clientes */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">👥 Top Clientes em {labelPeriodo}</h2>
              <p className="text-xs text-slate-400">Maiores compradores no período (dados reais do banco)</p>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2">
            {topClientes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                Nenhum cliente comprou neste período.
              </div>
            ) : (
              topClientes.map((c, idx) => (
                <div key={c.clienteId || idx} className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <span className="font-bold text-slate-800">{c.nomeCliente}</span>
                  </div>
                  <span className="badge-pago font-mono text-xs font-bold">{formatCurrencyBRL(c.totalComprado)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Produtos */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">📦 Top Produtos ({labelPeriodo})</h2>
              <p className="text-xs text-slate-400">Produtos mais vendidos no banco de dados</p>
            </div>
            <button
              onClick={() => navigate('/produtos')}
              className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
            >
              Ver catálogo →
            </button>
          </div>
          <div className="space-y-2">
            {topProdutos.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                Nenhum produto vendido neste período.
              </div>
            ) : (
              topProdutos.map((p, idx) => (
                <div key={p.produtoId || idx} className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">[{p.sku}] {p.nomeProduto}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{p.quantidadeVendida} unidades vendidas</div>
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-slate-800">{formatCurrencyBRL(p.valorTotal)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Novas Vendas Recentes & Próximos Faturamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Card: Novas Vendas Recentes */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">🛒 Novas Vendas Recentes</h2>
              <p className="text-xs text-slate-400">Últimos pedidos reais gravados no sistema</p>
            </div>
            <div className="flex items-center gap-2">
              <ActionButton
                label="Nova Venda"
                icon="+"
                variant="successSubtle"
                size="xs"
                onClick={() => openVendaModal()}
              />
              <button
                onClick={() => navigate('/vendas')}
                className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
              >
                Ver todas →
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentesVendas.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                Nenhuma venda registrada no banco de dados.
              </div>
            ) : (
              recentesVendas.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVendaDetails(v)}
                  className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>Venda #{v.id}</span>
                      <span className="text-slate-400 text-[10px] font-normal">
                        ({v.dataVenda ? new Date(v.dataVenda).toLocaleDateString('pt-BR') : 'Hoje'})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{v.clienteNome}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">{formatCurrencyBRL(v.valorTotal)}</div>
                    <span className="text-[10px] text-blue-600 font-semibold">Detalhes 🔍</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card: Próximos Faturamentos */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">📅 Próximos Faturamentos</h2>
              <p className="text-xs text-slate-400">Parcelas pendentes reais registradas no financeiro</p>
            </div>
            <button
              onClick={() => navigate('/financeiro')}
              className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {proximosFaturamentos.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs font-medium">
                Nenhum faturamento pendente no banco de dados.
              </div>
            ) : (
              proximosFaturamentos.map((f) => (
                <div
                  key={f.id}
                  className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-bold text-slate-800">{f.clienteNome || 'Cliente'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Vencimento: {f.dataVencimento}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300 font-bold">
                      {f.status}
                    </span>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900">{formatCurrencyBRL(f.valor)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Detalhes da Venda */}
      {selectedVendaDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-xl space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Detalhes da Venda #{selectedVendaDetails.id}</h3>
                <p className="text-[11px] text-slate-400">Cliente: {selectedVendaDetails.clienteNome} ({selectedVendaDetails.cpfCnpj || 'CNPJ/CPF N/A'})</p>
              </div>
              <button onClick={() => setSelectedVendaDetails(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Produtos da Venda:</h4>
              <div className="bg-slate-50 border rounded-xl divide-y overflow-hidden">
                {selectedVendaDetails.itens && selectedVendaDetails.itens.length > 0 ? (
                  selectedVendaDetails.itens.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">[{it.sku || 'SKU'}] {it.nomeProduto}</div>
                        <div className="text-[10px] text-slate-400">Qtd: {it.quantidade}x | Custo: {formatCurrencyBRL(it.custoNoMomento)} | Venda: {formatCurrencyBRL(it.precoNoMomento)}</div>
                      </div>
                      <div className="font-bold text-slate-900">{formatCurrencyBRL((it.precoNoMomento || 0) * (it.quantidade || 1))}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-slate-400 text-center">Itens da venda gravados no banco.</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Valor Total Final</span>
                <span className="text-base font-bold">{formatCurrencyBRL(selectedVendaDetails.valorTotal)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Data da Venda</span>
                <span className="text-xs font-semibold text-slate-200">{selectedVendaDetails.dataVenda}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <button
                onClick={() => {
                  setSelectedVendaDetails(null);
                  navigate('/vendas');
                }}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-xl text-xs active:scale-95 transition-all"
              >
                📋 Ir para Vendas
              </button>

              <button
                onClick={() => setSelectedVendaDetails(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs active:scale-95"
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
