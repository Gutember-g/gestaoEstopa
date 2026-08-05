import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Financeiro() {
  const [filterStatus, setFilterStatus] = useState('TODAS');

  const { data: parcelas = [] } = useQuery({
    queryKey: ['parcelas'],
    queryFn: async () => {
      try {
        const res = await api.get('/parcelas');
        return res.data;
      } catch {
        return [
          { id: 1, vendaId: 101, numeroSequencial: 1, valor: 32.00, dataVencimento: '2026-08-05', dataPagamento: '2026-08-05', status: 'PAGO', clienteNome: 'Distribuidora Silva & Cia' },
          { id: 2, vendaId: 101, numeroSequencial: 2, valor: 32.00, dataVencimento: '2026-09-05', dataPagamento: null, status: 'PENDENTE', clienteNome: 'Distribuidora Silva & Cia' },
          { id: 3, vendaId: 102, numeroSequencial: 1, valor: 83.33, dataVencimento: '2026-07-15', dataPagamento: null, status: 'ATRASADO', clienteNome: 'Auto Peças Modelo Ltda' },
          { id: 4, vendaId: 102, numeroSequencial: 2, valor: 83.33, dataVencimento: '2026-08-15', dataPagamento: null, status: 'PENDENTE', clienteNome: 'Auto Peças Modelo Ltda' },
        ];
      }
    }
  });

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

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
          <p className="text-xs text-slate-500 font-medium">Fluxo de recebimentos com controle de status (Pendente, Pago, Atrasado, Cancelado).</p>
        </div>

        {/* Status Filters */}
        <div className="bg-slate-200/70 p-1 rounded-xl flex flex-wrap gap-1 text-xs font-semibold">
          {['TODAS', 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800">
                    Parc. #{p.numeroSequencial} (Venda #{p.vendaId})
                  </td>
                  <td className="p-4 font-bold text-slate-800">{p.clienteNome}</td>
                  <td className="p-4 font-mono text-slate-600">{p.dataVencimento}</td>
                  <td className="p-4 font-mono text-slate-400">{p.dataPagamento || '-'}</td>
                  <td className="p-4 font-extrabold text-slate-800">{formatCurrency(p.valor)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${statusBadges[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {p.status === 'PENDENTE' || p.status === 'ATRASADO' ? (
                      <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px]">
                        Baixar (Marcar Pago)
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Concluído</span>
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
            <div key={p.id} className="p-4 space-y-2">
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
                <span className="font-extrabold text-sm text-slate-800">{formatCurrency(p.valor)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
