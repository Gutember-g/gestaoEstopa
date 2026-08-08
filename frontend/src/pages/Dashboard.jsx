import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeTab } = useOutletContext() || { activeTab: 'geral' };
  const [selectedVendaDetails, setSelectedVendaDetails] = useState(null);

  // Available Months for Period Filter
  const monthsList = [
    { key: '2026-08', label: 'Agosto 2026', shortLabel: 'Ago/26', faturamento: 265.00, pago: 210.00, pendente: 55.00, lucro: 126.00, prevFaturamento: 235.00 },
    { key: '2026-07', label: 'Julho 2026', shortLabel: 'Jul/26', faturamento: 235.00, pago: 235.00, pendente: 0.00, lucro: 110.00, prevFaturamento: 210.00 },
    { key: '2026-06', label: 'Junho 2026', shortLabel: 'Jun/26', faturamento: 210.00, pago: 210.00, pendente: 0.00, lucro: 98.00, prevFaturamento: 190.00 },
    { key: '2026-05', label: 'Maio 2026', shortLabel: 'Mai/26', faturamento: 190.00, pago: 190.00, pendente: 0.00, lucro: 88.00, prevFaturamento: 180.00 },
    { key: '2026-04', label: 'Abril 2026', shortLabel: 'Abr/26', faturamento: 180.00, pago: 180.00, pendente: 0.00, lucro: 82.00, prevFaturamento: 165.00 },
    { key: '2026-03', label: 'Março 2026', shortLabel: 'Mar/26', faturamento: 165.00, pago: 165.00, pendente: 0.00, lucro: 75.00, prevFaturamento: 150.00 },
    { key: '2026-02', label: 'Fevereiro 2026', shortLabel: 'Fev/26', faturamento: 150.00, pago: 150.00, pendente: 0.00, lucro: 68.00, prevFaturamento: 140.00 },
    { key: '2026-01', label: 'Janeiro 2026', shortLabel: 'Jan/26', faturamento: 140.00, pago: 140.00, pendente: 0.00, lucro: 62.00, prevFaturamento: 130.00 },
    { key: '2025-12', label: 'Dezembro 2025', shortLabel: 'Dez/25', faturamento: 280.00, pago: 280.00, pendente: 0.00, lucro: 135.00, prevFaturamento: 160.00 },
    { key: '2025-11', label: 'Novembro 2025', shortLabel: 'Nov/25', faturamento: 160.00, pago: 160.00, pendente: 0.00, lucro: 72.00, prevFaturamento: 145.00 },
    { key: '2025-10', label: 'Outubro 2025', shortLabel: 'Out/25', faturamento: 145.00, pago: 145.00, pendente: 0.00, lucro: 65.00, prevFaturamento: 135.00 },
    { key: '2025-09', label: 'Setembro 2025', shortLabel: 'Set/25', faturamento: 135.00, pago: 135.00, pendente: 0.00, lucro: 60.00, prevFaturamento: 120.00 },
  ];

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // Default to current month (Agosto 2026)

  const currentMonthData = monthsList[selectedMonthIndex];

  // Calculate percentage variation vs previous month
  const calcVariation = () => {
    const current = currentMonthData.faturamento;
    const prev = currentMonthData.prevFaturamento;
    if (!prev || prev === 0) return '+0%';
    const pct = (((current - prev) / prev) * 100).toFixed(1);
    return pct >= 0 ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`;
  };

  const handlePrevMonth = () => {
    if (selectedMonthIndex < monthsList.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  // Recent Sales Catalog (Novas Vendas) - Ordered newest to oldest
  const recentesVendas = [
    {
      id: 101,
      clienteNome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      valorTotal: 55.00,
      tempoRelativo: 'há 2 horas',
      dataVenda: '2026-08-07 15:30',
      desconto: 0.00,
      itens: [
        { sku: 'SKU-001', nomeProduto: 'Estopa Branca Premium 1kg', custoUnitario: 8.50, precoUnitario: 15.00, quantidade: 1 },
        { sku: 'SKU-004', nomeProduto: 'Pano de Chão Alvejado 10 un', custoUnitario: 12.00, precoUnitario: 25.00, quantidade: 1 },
      ],
    },
    {
      id: 102,
      clienteNome: 'Auto Peças Modelo Ltda',
      cpfCnpj: '98.765.432/0001-10',
      valorTotal: 210.00,
      tempoRelativo: 'ontem',
      dataVenda: '2026-08-06 11:15',
      desconto: 10.00,
      itens: [
        { sku: 'SKU-003', nomeProduto: 'Retalho de Malha Algodão 5kg', custoUnitario: 22.00, precoUnitario: 42.00, quantidade: 5 },
      ],
    },
    {
      id: 99,
      clienteNome: 'Comércio Industrial Souza',
      cpfCnpj: '45.678.901/0001-23',
      valorTotal: 125.00,
      tempoRelativo: 'há 3 dias',
      dataVenda: '2026-08-04 09:45',
      desconto: 0.00,
      itens: [
        { sku: 'SKU-004', nomeProduto: 'Pano de Chão Alvejado 10 un', custoUnitario: 12.00, precoUnitario: 25.00, quantidade: 5 },
      ],
    },
    {
      id: 98,
      clienteNome: 'Mecânica Express Eireli',
      cpfCnpj: '34.567.890/0001-45',
      valorTotal: 84.00,
      tempoRelativo: '02/08/2026',
      dataVenda: '2026-08-02 16:20',
      desconto: 0.00,
      itens: [
        { sku: 'SKU-003', nomeProduto: 'Retalho de Malha Algodão 5kg', custoUnitario: 22.00, precoUnitario: 42.00, quantidade: 2 },
      ],
    },
    {
      id: 97,
      clienteNome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      valorTotal: 45.00,
      tempoRelativo: '30/07/2026',
      dataVenda: '2026-07-30 14:00',
      desconto: 0.00,
      itens: [
        { sku: 'SKU-001', nomeProduto: 'Estopa Branca Premium 1kg', custoUnitario: 8.50, precoUnitario: 15.00, quantidade: 3 },
      ],
    },
  ];

  // Upcoming Receivables Catalog (Próximos Faturamentos) - Looking forward from today
  const proximosFaturamentos = [
    {
      id: 1,
      vendaId: 101,
      clienteNome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      valor: 27.50,
      dataVencimento: '2026-08-07',
      diasParaVencer: 0,
      badgeText: 'Vence hoje',
      badgeStyle: 'bg-rose-100 text-rose-700 border-rose-300 font-extrabold',
      venda: recentesVendas[0],
    },
    {
      id: 2,
      vendaId: 102,
      clienteNome: 'Auto Peças Modelo Ltda',
      cpfCnpj: '98.765.432/0001-10',
      valor: 105.00,
      dataVencimento: '2026-08-10',
      diasParaVencer: 3,
      badgeText: 'Vence em 3 dias',
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      venda: recentesVendas[1],
    },
    {
      id: 3,
      vendaId: 99,
      clienteNome: 'Comércio Industrial Souza',
      cpfCnpj: '45.678.901/0001-23',
      valor: 125.00,
      dataVencimento: '2026-08-14',
      diasParaVencer: 7,
      badgeText: 'Vence em 7 dias',
      badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      venda: recentesVendas[2],
    },
    {
      id: 4,
      vendaId: 98,
      clienteNome: 'Mecânica Express Eireli',
      cpfCnpj: '34.567.890/0001-45',
      valor: 84.00,
      dataVencimento: '2026-08-19',
      diasParaVencer: 12,
      badgeText: 'Vence em 12 dias',
      badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
      venda: recentesVendas[3],
    },
    {
      id: 5,
      vendaId: 101,
      clienteNome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      valor: 27.50,
      dataVencimento: '2026-09-05',
      diasParaVencer: 29,
      badgeText: 'Vence em 29 dias',
      badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
      venda: recentesVendas[0],
    },
  ];

  // Top Clientes for selected month
  const monthlyTopClientes = [
    { rank: 1, nome: 'Distribuidora Silva & Cia', total: currentMonthData.faturamento * 0.52 },
    { rank: 2, nome: 'Auto Peças Modelo Ltda', total: currentMonthData.faturamento * 0.38 },
    { rank: 3, nome: 'Comércio Industrial Souza', total: currentMonthData.faturamento * 0.10 },
  ];

  // Top Products by Quantity sold for selected month
  const monthlyTopProdutos = [
    { rank: 1, sku: 'SKU-001', nome: 'Estopa Branca Premium 1kg', qtd: Math.round(currentMonthData.faturamento * 0.25), valor: currentMonthData.faturamento * 0.40 },
    { rank: 2, sku: 'SKU-004', nome: 'Pano de Chão Alvejado 10 un', qtd: Math.round(currentMonthData.faturamento * 0.18), valor: currentMonthData.faturamento * 0.30 },
    { rank: 3, sku: 'SKU-003', nome: 'Retalho de Malha Algodão 5kg', qtd: Math.round(currentMonthData.faturamento * 0.08), valor: currentMonthData.faturamento * 0.30 },
  ];

  const { isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard');
        return response.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Maximum value in 12-month chart for scaling bar heights
  const maxChartVal = Math.max(...monthsList.map((m) => m.faturamento));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto pb-24 md:pb-8">
      {/* Connection Error Banner */}
      {isError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="font-semibold">Modo Local / Demonstração:</strong>
              <span className="ml-1 text-red-700">
                A requisição para a API falhou. Exibindo dados analíticos integrados.
              </span>
            </div>
          </div>
          <span className="bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded text-[10px]">API Standby</span>
        </div>
      )}

      {/* Sticky Global Month/Year Period Filter Bar */}
      <div className="sticky top-14 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 -mx-4 px-4 md:-mx-6 md:px-6 py-3 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Home Analítica</span>
              <span className="text-xs font-normal text-slate-500">({activeTab})</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Visão consolidada do período selecionado: <strong className="text-slate-800">{currentMonthData.label}</strong>
            </p>
          </div>

          {/* Period Selector Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm p-1">
              <button
                onClick={handlePrevMonth}
                disabled={selectedMonthIndex === monthsList.length - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-sm active:scale-95 transition-all"
                title="Mês anterior"
              >
                ◀
              </button>

              <select
                value={selectedMonthIndex}
                onChange={(e) => setSelectedMonthIndex(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-800 px-3 py-1 focus:outline-none cursor-pointer"
              >
                {monthsList.map((m, idx) => (
                  <option key={m.key} value={idx}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextMonth}
                disabled={selectedMonthIndex === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-sm active:scale-95 transition-all"
                title="Próximo mês"
              >
                ▶
              </button>
            </div>

            <button
              onClick={() => navigate('/vendas')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all min-h-[40px]"
            >
              <span>+</span>
              <span>Nova Venda</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: KPI Grid (Filtered by Selected Month) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Faturamento do Mês (Hero Card) */}
        <div className="sm:col-span-2 erp-hero-card flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Faturamento do Mês</p>
                <span className="bg-emerald-500/30 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  {calcVariation()} vs. mês anterior
                </span>
              </div>
              <p className="text-3xl font-bold mt-2 tracking-tight">
                {formatCurrency(currentMonthData.faturamento)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
              📊
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs border-t border-white/10 pt-3">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
              Período: {currentMonthData.label}
            </span>
            <span className="text-blue-100 font-semibold">
              Lucro Líquido: {formatCurrency(currentMonthData.lucro)}
            </span>
          </div>
        </div>

        {/* Card 2: Caixa Efetivado (Pago) */}
        <div className="erp-card flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Caixa Efetivado (Pago)</p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {formatCurrency(currentMonthData.pago)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
            <span className="badge-pago font-bold">Quitado</span>
            <span className="text-slate-500 font-medium">Fluxo 100% OK</span>
          </div>
        </div>

        {/* Card 3: A Receber / Pendente */}
        <div className="erp-card flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">A Receber / Pendente</p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {formatCurrency(currentMonthData.pendente)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
            <span className="badge-pendente font-bold">Cobrança Ativa</span>
            <span className="text-slate-400 text-[11px] font-medium">Vencendo no mês</span>
          </div>
        </div>
      </div>

      {/* Row 2: Interactive 12-Month Revenue History Chart */}
      <div className="erp-card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>📈 Faturamento por Mês (Histórico de 12 Meses)</span>
            </h2>
            <p className="text-xs text-slate-400">Clique em qualquer mês para alterar o filtro global do dashboard.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-slate-600 font-medium">Mês Selecionado ({currentMonthData.shortLabel})</span>
          </div>
        </div>

        {/* Bar Chart Container */}
        <div className="pt-4 pb-2">
          <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-3 px-2">
            {[...monthsList].reverse().map((m) => {
              const originalIndex = monthsList.findIndex((item) => item.key === m.key);
              const isSelected = originalIndex === selectedMonthIndex;
              const heightPct = Math.max(12, (m.faturamento / maxChartVal) * 100);

              return (
                <div
                  key={m.key}
                  onClick={() => setSelectedMonthIndex(originalIndex)}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  title={`${m.label}: ${formatCurrency(m.faturamento)} (Clique para filtrar)`}
                >
                  {/* Hover tooltip value */}
                  <span className={`text-[10px] font-mono font-bold transition-all ${
                    isSelected ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-700'
                  }`}>
                    R${Math.round(m.faturamento)}
                  </span>

                  {/* Animated Bar */}
                  <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-500 ring-2 ring-blue-500/50 shadow-md'
                          : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                    ></div>
                  </div>

                  {/* X-axis Label */}
                  <span className={`text-[10px] font-semibold transition-colors ${
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

      {/* Row 3: Top Clientes & Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Top 5 Clientes por Faturamento no Mês */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">👥 Top Clientes em {currentMonthData.label}</h2>
              <p className="text-xs text-slate-400">Maiores compradores no período filtrado</p>
            </div>
            <button
              onClick={() => navigate('/clientes')}
              className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2">
            {monthlyTopClientes.map((c) => (
              <div key={c.rank} className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">
                    #{c.rank}
                  </div>
                  <span className="font-bold text-slate-800">{c.nome}</span>
                </div>
                <span className="badge-pago font-mono text-xs font-bold">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Produtos por Quantidade Vendida no Mês */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">📦 Top Produtos por Qtd ({currentMonthData.label})</h2>
              <p className="text-xs text-slate-400">Produtos com maior volume de saída</p>
            </div>
            <button
              onClick={() => navigate('/produtos')}
              className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
            >
              Ver catálogo →
            </button>
          </div>
          <div className="space-y-2">
            {monthlyTopProdutos.map((p) => (
              <div key={p.rank} className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                    #{p.rank}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">[{p.sku}] {p.nome}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{p.qtd} unidades vendidas</div>
                  </div>
                </div>
                <span className="font-mono font-extrabold text-slate-800">{formatCurrency(p.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Replacement Blocks - "Novas Vendas" & "Próximos Faturamentos" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Card: Novas Vendas (Vendas Recentes) */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">🛒 Novas Vendas Recentes</h2>
              <p className="text-xs text-slate-400">Últimos pedidos registrados no sistema</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/vendas')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-semibold active:scale-95 transition-all"
              >
                + Nova Venda
              </button>
              <button
                onClick={() => navigate('/vendas')}
                className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
              >
                Ver todas →
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentesVendas.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVendaDetails(v)}
                className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer transition-all"
              >
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>Venda #{v.id}</span>
                    <span className="text-slate-400 text-[10px] font-normal">({v.tempoRelativo})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{v.clienteNome}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900">{formatCurrency(v.valorTotal)}</div>
                  <span className="text-[10px] text-blue-600 font-semibold">Detalhes 🔍</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Próximos Faturamentos */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">📅 Próximos Faturamentos</h2>
              <p className="text-xs text-slate-400">Parcelas a receber com vencimento próximo</p>
            </div>
            <button
              onClick={() => navigate('/financeiro')}
              className="text-xs font-semibold text-blue-600 hover:underline active:scale-95 transition-all"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {proximosFaturamentos.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedVendaDetails(f.venda)}
                className="flex justify-between items-center p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer transition-all"
              >
                <div>
                  <div className="font-bold text-slate-800">{f.clienteNome}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Vencimento: {f.dataVencimento}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${f.badgeStyle}`}>
                    {f.badgeText}
                  </span>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900">{formatCurrency(f.valor)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Detalhes da Venda (Reaproveitado ao clicar em item dos cards) */}
      {selectedVendaDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-xl space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Detalhes da Venda #{selectedVendaDetails.id}</h3>
                <p className="text-[11px] text-slate-400">Cliente: {selectedVendaDetails.clienteNome} ({selectedVendaDetails.cpfCnpj})</p>
              </div>
              <button onClick={() => setSelectedVendaDetails(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Produtos da Venda:</h4>
              <div className="bg-slate-50 border rounded-xl divide-y overflow-hidden">
                {selectedVendaDetails.itens.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">[{it.sku}] {it.nomeProduto}</div>
                      <div className="text-[10px] text-slate-400">Qtd: {it.quantidade}x | Custo: {formatCurrency(it.custoUnitario)} | Venda: {formatCurrency(it.precoUnitario)}</div>
                    </div>
                    <div className="font-bold text-slate-900">{formatCurrency(it.precoUnitario * it.quantidade)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Valor Total Final</span>
                <span className="text-base font-bold">{formatCurrency(selectedVendaDetails.valorTotal)}</span>
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
