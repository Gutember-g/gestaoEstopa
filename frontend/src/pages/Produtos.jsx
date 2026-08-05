import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function Produtos() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    precoCusto: '',
    precoVenda: '',
    status: 'ATIVO',
  });

  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      try {
        const res = await api.get('/produtos');
        return res.data;
      } catch {
        return [
          { id: 1, nome: 'Estopa Branca Especial 1kg', precoCusto: 8.50, precoVenda: 18.00, margemLucro: 111.76, status: 'ATIVO' },
          { id: 2, nome: 'Estopa Colorida Limpeza 500g', precoCusto: 4.20, precoVenda: 9.50, margemLucro: 126.19, status: 'ATIVO' },
          { id: 3, nome: 'Panos de Chão Algodão Pacote 10x', precoCusto: 15.00, precoVenda: 28.00, margemLucro: 86.67, status: 'ATIVO' },
          { id: 4, nome: 'Retalho Industrial Fardo 5kg', precoCusto: 22.00, precoVenda: 35.00, margemLucro: 59.09, status: 'INATIVO' },
        ];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newProduto) => api.post('/produtos', newProduto),
    onSuccess: () => {
      queryClient.invalidateQueries(['produtos']);
      setShowModal(false);
      setFormData({ nome: '', precoCusto: '', precoVenda: '', status: 'ATIVO' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const calculateMarginPreview = () => {
    const custo = parseFloat(formData.precoCusto) || 0;
    const venda = parseFloat(formData.precoVenda) || 0;
    if (custo > 0 && venda > 0) {
      return (((venda - custo) / custo) * 100).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Catálogo de Produtos</h1>
          <p className="text-xs text-slate-500 font-medium">Controle de preços de custo, venda, margem de lucro calculada e status.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 min-h-[44px]"
        >
          <span>+</span>
          <span>Novo Produto</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Carregando catálogo...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {produtos.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    p.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {p.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">#{p.id}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mt-2">{p.nome}</h3>
              </div>

              <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Preço de Custo:</span>
                  <span className="font-mono">{formatCurrency(p.precoCusto)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold">
                  <span>Preço de Venda:</span>
                  <span className="text-blue-600">{formatCurrency(p.precoVenda)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400 text-[11px]">Margem de Lucro:</span>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    +{p.margemLucro}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-800">Cadastrar Produto</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nome do Produto *</label>
                <input
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Preço de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precoCusto}
                    onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precoVenda}
                    onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Margem Preview */}
              <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Margem Estimada:</span>
                <span className="font-extrabold text-emerald-600 text-sm">+{calculateMarginPreview()}%</span>
              </div>

              <div>
                <label className="font-bold text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
