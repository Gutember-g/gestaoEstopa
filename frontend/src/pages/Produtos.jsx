import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from '../utils/money';
import { useToast } from '../context/ToastContext';

export default function Produtos() {
  const { showSuccess, showError } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingProdutoId, setEditingProdutoId] = useState(null);
  const [deleteConfirmProd, setDeleteConfirmProd] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    precoCustoFormatted: 'R$ 0,00',
    precoVendaFormatted: 'R$ 0,00',
    status: 'ATIVO',
  });

  // Local Products List
  const [localProdutos, setLocalProdutos] = useState([
    { id: 1, sku: 'SKU-001', nome: 'Estopa Branca Especial 1kg', precoCusto: 8.50, precoVenda: 18.00, margemLucro: 111.76, status: 'ATIVO', temVendas: true },
    { id: 2, sku: 'SKU-002', nome: 'Estopa Colorida Limpeza 500g', precoCusto: 4.20, precoVenda: 9.50, margemLucro: 126.19, status: 'ATIVO', temVendas: true },
    { id: 3, sku: 'SKU-003', nome: 'Panos de Chão Algodão Pacote 10x', precoCusto: 15.00, precoVenda: 28.00, margemLucro: 86.67, status: 'ATIVO', temVendas: true },
    { id: 4, sku: 'SKU-004', nome: 'Retalho Industrial Fardo 5kg', precoCusto: 22.00, precoVenda: 35.00, margemLucro: 59.09, status: 'INATIVO', temVendas: false },
  ]);

  const { data: produtos = localProdutos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      try {
        const res = await api.get('/produtos');
        if (res.data && res.data.length > 0) return res.data;
        return localProdutos;
      } catch {
        return localProdutos;
      }
    },
  });

  const handleOpenNewModal = () => {
    setEditingProdutoId(null);
    setFormData({
      nome: '',
      precoCustoFormatted: 'R$ 0,00',
      precoVendaFormatted: 'R$ 0,00',
      status: 'ATIVO',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProdutoId(prod.id);
    setFormData({
      nome: prod.nome,
      precoCustoFormatted: formatCurrencyBRL(prod.precoCusto),
      precoVendaFormatted: formatCurrencyBRL(prod.precoVenda),
      status: prod.status,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProdutoId(null);
    setErrors({});
  };

  const calculateMarginPreview = () => {
    const custo = parseCurrencyToNumber(formData.precoCustoFormatted);
    const venda = parseCurrencyToNumber(formData.precoVendaFormatted);
    if (custo > 0 && venda > 0) {
      return (((venda - custo) / custo) * 100).toFixed(2);
    }
    return '0.00';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome do produto é obrigatório.';
    }

    const custo = parseCurrencyToNumber(formData.precoCustoFormatted);
    const venda = parseCurrencyToNumber(formData.precoVendaFormatted);

    if (custo <= 0) {
      newErrors.precoCustoFormatted = 'Preço de custo deve ser maior que zero.';
    }
    if (venda <= 0) {
      newErrors.precoVendaFormatted = 'Preço de venda deve ser maior que zero.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Corrija os campos obrigatórios em destaque.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const margem = parseFloat(calculateMarginPreview());

      if (editingProdutoId) {
        // Edit mode
        const updated = localProdutos.map((p) => {
          if (p.id === editingProdutoId) {
            return {
              ...p,
              nome: formData.nome,
              precoCusto: custo,
              precoVenda: venda,
              margemLucro: margem,
              status: formData.status,
            };
          }
          return p;
        });
        setLocalProdutos(updated);
        showSuccess(`Produto "${formData.nome}" atualizado com sucesso! ✓`);
      } else {
        // Create mode
        const newProd = {
          id: Math.floor(10 + Math.random() * 90),
          sku: `SKU-00${localProdutos.length + 1}`,
          nome: formData.nome,
          precoCusto: custo,
          precoVenda: venda,
          margemLucro: margem,
          status: formData.status,
          temVendas: false,
        };
        setLocalProdutos([...localProdutos, newProd]);
        showSuccess(`Produto "${newProd.nome}" cadastrado com sucesso! ✓`);
      }

      setIsSubmitting(false);
      handleCloseModal();
    }, 500);
  };

  // Inactivate Action
  const handleInativarProduto = (prod) => {
    const updated = localProdutos.map((p) => (p.id === prod.id ? { ...p, status: 'INATIVO' } : p));
    setLocalProdutos(updated);
    showSuccess(`Produto "${prod.nome}" foi inativado ✓`);
    setDeleteConfirmProd(null);
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deleteConfirmProd) return;
    setIsDeleting(true);

    setTimeout(() => {
      const filtered = localProdutos.filter((p) => p.id !== deleteConfirmProd.id);
      setLocalProdutos(filtered);
      showSuccess(`Produto "${deleteConfirmProd.nome}" excluído definitivamente ✓`);
      setIsDeleting(false);
      setDeleteConfirmProd(null);
    }, 500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Catálogo de Produtos</h1>
          <p className="text-xs text-slate-500 font-medium">Controle de preços de custo, venda, margem de lucro calculada e status.</p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all min-h-[44px]"
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
            <div key={p.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between group hover:border-blue-300 hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    p.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {p.status}
                  </span>
                  
                  {/* Action buttons (Hover/Visible) */}
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1 hover:bg-slate-100 rounded text-xs text-slate-600 hover:text-blue-600 active:scale-95 transition-all"
                      title="Editar produto"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirmProd(p)}
                      className="p-1 hover:bg-rose-50 rounded text-xs text-slate-400 hover:text-rose-600 active:scale-95 transition-all"
                      title="Excluir produto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mt-2">{p.nome}</h3>
              </div>

              <div className="space-y-1 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Preço de Custo:</span>
                  <span className="font-mono">{formatCurrencyBRL(p.precoCusto)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-bold">
                  <span>Preço de Venda:</span>
                  <span className="text-blue-600">{formatCurrencyBRL(p.precoVenda)}</span>
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

      {/* Modal Novo / Editar Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-800">
                {editingProdutoId ? 'Editar Produto' : 'Cadastrar Produto'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Produto *</label>
                <input
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    if (errors.nome) setErrors({ ...errors, nome: null });
                  }}
                  placeholder="Ex: Estopa Branca Especial 1kg"
                  className={`w-full p-2.5 border rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                    errors.nome ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                  }`}
                />
                {errors.nome && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.nome}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço de Custo (R$) *</label>
                  <input
                    type="text"
                    value={formData.precoCustoFormatted}
                    onChange={(e) => {
                      setFormData({ ...formData, precoCustoFormatted: applyCurrencyMask(e.target.value) });
                      if (errors.precoCustoFormatted) setErrors({ ...errors, precoCustoFormatted: null });
                    }}
                    className={`w-full p-2.5 border rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                      errors.precoCustoFormatted ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.precoCustoFormatted && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.precoCustoFormatted}</span>}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="text"
                    value={formData.precoVendaFormatted}
                    onChange={(e) => {
                      setFormData({ ...formData, precoVendaFormatted: applyCurrencyMask(e.target.value) });
                      if (errors.precoVendaFormatted) setErrors({ ...errors, precoVendaFormatted: null });
                    }}
                    className={`w-full p-2.5 border rounded-lg font-bold text-blue-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                      errors.precoVendaFormatted ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.precoVendaFormatted && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.precoVendaFormatted}</span>}
                </div>
              </div>

              {/* Margem Preview */}
              <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center text-xs border border-slate-100">
                <span className="font-medium text-slate-600">Margem de Lucro Estimada:</span>
                <span className="font-extrabold text-emerald-600 text-sm">+{calculateMarginPreview()}%</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>{editingProdutoId ? 'Salvar Alterações' : 'Salvar Produto'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão de Produto */}
      {deleteConfirmProd && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-base font-bold text-slate-900">Excluir Produto</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja excluir o produto <strong>"{deleteConfirmProd.nome}"</strong>?
            </p>

            {deleteConfirmProd.temVendas && (
              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-800 space-y-1">
                <strong className="font-semibold block">⚠️ Produto vinculado a vendas existentes:</strong>
                <span>
                  Recomendamos inativar este produto para preservar o histórico de vendas já realizadas.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmProd(null)}
                className="px-3 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl active:scale-95 transition-all text-xs"
              >
                Cancelar
              </button>

              {deleteConfirmProd.temVendas && (
                <button
                  type="button"
                  onClick={() => handleInativarProduto(deleteConfirmProd)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all text-xs"
                >
                  Inativar Produto
                </button>
              )}

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
