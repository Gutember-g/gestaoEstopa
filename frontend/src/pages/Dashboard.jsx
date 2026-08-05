import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import DonutChart from '../components/DonutChart';
import FunnelChart from '../components/FunnelChart';

export default function Dashboard() {
  const { activeTab } = useOutletContext() || { activeTab: 'geral' };
  const [taskChecked, setTaskChecked] = useState([false, false]);
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard');
        setIsBackendOffline(false);
        return response.data;
      } catch (err) {
        setIsBackendOffline(true);
        return {
          faturamentoMensal: 14550.00,
          lucroLiquidoMensal: 4820.50,
          fluxocaixaRecebido: 10350.00,
          fluxocaixaPendente: 4200.00,
          topClientes: [
            { clienteId: 1, nomeCliente: 'Distribuidora Silva & Cia', totalComprado: 6450.00 },
            { clienteId: 2, nomeCliente: 'Auto Peças Modelo Ltda', totalComprado: 4200.00 },
            { clienteId: 3, nomeCliente: 'Comércio Industrial Souza', totalComprado: 2800.00 },
            { clienteId: 4, nomeCliente: 'Mecânica Express Eireli', totalComprado: 1100.00 }
          ],
          alertas: {
            parcelasAtrasadas: 2,
            parcelasVencendoHoje: 3,
            produtosSemMovimento30Dias: 4
          }
        };
      }
    },
    refetchInterval: 30000,
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto pb-24 md:pb-8">
      {/* Backend Status Banner if Offline */}
      {isBackendOffline && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="font-semibold">Modo Demonstração (Backend Spring Boot offline):</strong>
              <span className="ml-1 text-amber-700">
                A API Java em <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://localhost:8080/api</code> não está rodando no momento. Exibindo dados simulados na interface.
              </span>
            </div>
          </div>
          <span className="badge-pendente text-[10px]">Mock Active</span>
        </div>
      )}

      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Home <span className="text-xs font-normal text-slate-400">({activeTab})</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Métricas financeiras e comerciais consolidadas em tempo real.</p>
        </div>

        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all min-h-[40px]">
          <span>+</span>
          <span>Nova Venda</span>
        </button>
      </div>

      {/* Row 1: KPI Grid (Hero Card col-span-2 + Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Widget Gradient Header (Hero Card occupying col-span-2) */}
        <div className="sm:col-span-2 erp-hero-card flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-blue-100 uppercase tracking-wide">Active Opportunities Value (Faturamento)</p>
              <p className="text-3xl font-bold mt-2 tracking-tight">
                {isLoading ? 'R$ ...' : formatCurrency(data?.faturamentoMensal)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-base">
              📊
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
              Active Tenant
            </span>
            <span className="text-blue-100 font-medium">Lucro Líquido: {formatCurrency(data?.lucroLiquidoMensal)}</span>
          </div>
        </div>

        {/* Secondary Card: Caixa Efetivado */}
        <div className="erp-card flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Caixa Efetivado (Pago)</p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {isLoading ? 'R$ ...' : formatCurrency(data?.fluxocaixaRecebido)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="badge-pago">Quitado</span>
            <span>Fluxo OK</span>
          </div>
        </div>

        {/* Secondary Card: A Receber / Pendente */}
        <div className="erp-card flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">A Receber / Pendente</p>
            <p className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
              {isLoading ? 'R$ ...' : formatCurrency(data?.fluxocaixaPendente)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="badge-pendente">Pendente</span>
            <span className="text-slate-400 text-xs">Cobrança ativa</span>
          </div>
        </div>
      </div>

      {/* Row 2: Widgets Grid (Revenue Donut + Funnel Pipeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Revenue by Source (Donut Chart Widget) */}
        <div className="lg:col-span-7 erp-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Revenue by Source (Receita por Linha)</h2>
              <p className="text-xs text-slate-400">Distribuição por categoria e origem</p>
            </div>
            <div className="flex gap-1 text-xs">
              <button className="bg-blue-600 text-white font-medium px-2.5 py-1 rounded-lg">Sum</button>
              <button className="bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-lg">Qty</button>
            </div>
          </div>
          <DonutChart total={formatCurrency(data?.faturamentoMensal)} />
        </div>

        {/* Pipeline Funnel Widget */}
        <div className="lg:col-span-5 erp-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Pipeline (Status do Funil)</h2>
              <p className="text-xs text-slate-400">Fluxo de conversão e parcelas</p>
            </div>
            <span className="badge-pendente text-[11px]">Sales Pipeline</span>
          </div>
          <FunnelChart />
        </div>
      </div>

      {/* Row 3: My Tasks & Notifications Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Tasks List */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-700">My tasks (Minhas Cobranças e Alertas)</h2>
            <span className="text-xs text-slate-400">Hoje</span>
          </div>
          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60">
              <input
                type="checkbox"
                checked={taskChecked[0]}
                onChange={() => setTaskChecked([!taskChecked[0], taskChecked[1]])}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500/40"
              />
              <div className={taskChecked[0] ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                Call Helen about FlowProj (Cobrança Parcela #101)
                <div className="text-[10px] text-slate-400">Start 17 hours ago</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200/60">
              <input
                type="checkbox"
                checked={taskChecked[1]}
                onChange={() => setTaskChecked([taskChecked[0], !taskChecked[1]])}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500/40"
              />
              <div className={taskChecked[1] ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                Add links to the posts (Revisar cadastro de produtos estagnados +30d)
                <div className="text-[10px] text-slate-400">Start 17 hours ago</div>
              </div>
            </label>
          </div>
        </div>

        {/* Top Clientes Table Card */}
        <div className="lg:col-span-6 erp-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-700">Top Clientes em Faturamento</h2>
            <button className="text-xs font-semibold text-blue-600 hover:underline">Ver todos →</button>
          </div>
          <div className="space-y-2">
            {data?.topClientes?.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                    #{idx + 1}
                  </div>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">{c.nomeCliente}</span>
                </div>
                <span className="badge-pago font-mono">{formatCurrency(c.totalComprado)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
