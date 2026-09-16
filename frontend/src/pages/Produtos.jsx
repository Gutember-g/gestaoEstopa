import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatCurrencyBRL, applyCurrencyMask, parseCurrencyToNumber } from '../utils/money';
import { useToast } from '../context/ToastContext';
import ActionButton from '../components/ActionButton';

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
  const [localProdutos, setLocalProdutos] = useState([]);

  const { data: produtosRaw = [], isLoading, refetch: refetchProdutos } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      try {
        const res = await api.get('/produtos');
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.content)) return res.data.content;
        return [];
      } catch {
        return [];
      }
    },
  });

  const produtos = Array.isArray(produtosRaw)
    ? produtosRaw
    : (produtosRaw && Array.isArray(produtosRaw.content) ? produtosRaw.content : []);

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

  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
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

    try {
      const margem = parseFloat(calculateMarginPreview());
      const payload = {
        sku: `SKU-00${Math.floor(100 + Math.random() * 900)}`,
        nome: formData.nome.trim(),
        precoCusto: custo,
        precoVenda: venda,
        margemLucro: margem,
        status: formData.status,
      };

      if (editingProdutoId) {
        await api.put(`/produtos/${editingProdutoId}`, payload);
        showSuccess(`Produto "${formData.nome}" atualizado com sucesso! ✓`);
      } else {
        await api.post('/produtos', payload);
        showSuccess(`Produto "${formData.nome}" cadastrado com sucesso! ✓`);
      }

      await queryClient.invalidateQueries(['produtos']);
      handleCloseModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erro ao salvar produto no banco de dados.';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inactivate Action
  const handleInativarProduto = async (prod) => {
    try {
      await api.put(`/produtos/${prod.id}`, {
        ...prod,
        status: 'INATIVO',
      });
      showSuccess(`Produto "${prod.nome}" foi inativado ✓`);
      await queryClient.invalidateQueries(['produtos']);
    } catch (err) {
      showError(err.response?.data?.message || 'Erro ao inativar produto.');
    } finally {
      setDeleteConfirmProd(null);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteConfirmProd) return;
    setIsDeleting(true);

    try {
      await api.delete(`/produtos/${deleteConfirmProd.id}`);
      showSuccess(`Produto "${deleteConfirmProd.nome}" excluído definitivamente ✓`);
      await queryClient.invalidateQueries(['produtos']);
      setDeleteConfirmProd(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Erro ao excluir produto do banco de dados.');
    } finally {
      setIsDeleting(false);
    }
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
      ) : produtos.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📦
          </div>
          <p className="text-sm font-semibold text-slate-700">Nenhum produto cadastrado</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Clique em "+ Novo Produto" para adicionar o primeiro item ao catálogo.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto pr-2">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Preço de Custo</th>
                  <th className="p-4">Preço de Venda</th>
                  <th className="p-4">Margem de Lucro</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produtos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors h-auto">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{p.nome}</div>
                      {p.sku && <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>}
                    </td>
                    <td className="p-4 font-mono text-slate-600 font-medium">
                      {formatCurrencyBRL(p.precoCusto)}
                    </td>
                    <td className="p-4 font-mono font-extrabold text-blue-600">
                      {formatCurrencyBRL(p.precoVenda)}
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-mono">
                        +{typeof p.margemLucro === 'number' ? p.margemLucro.toFixed(2).replace('.', ',') : p.margemLucro}%
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                          p.status === 'ATIVO'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right w-36">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton
                          label="Editar"
                          icon="✏️"
                          variant="outline"
                          size="xs"
                          title="Editar produto"
                          onClick={() => handleOpenEditModal(p)}
                        />
                        <ActionButton
                          label="Excluir"
                          icon="🗑️"
                          variant="dangerSubtle"
                          size="xs"
                          title="Excluir produto"
                          onClick={() => setDeleteConfirmProd(p)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {produtos.map((p) => (
              <div key={p.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{p.nome}</div>
                    {p.sku && <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>}
                    <div className="mt-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                        p.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ActionButton
                      label="Editar"
                      icon="✏️"
                      variant="outline"
                      size="xs"
                      title="Editar produto"
                      onClick={() => handleOpenEditModal(p)}
                    />
                    <ActionButton
                      label="Excluir"
                      icon="🗑️"
                      variant="dangerSubtle"
                      size="xs"
                      title="Excluir produto"
                      onClick={() => setDeleteConfirmProd(p)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Custo: {formatCurrencyBRL(p.precoCusto)}</span>
                  <span className="font-extrabold text-blue-600 font-mono text-xs">Venda: {formatCurrencyBRL(p.precoVenda)}</span>
                  <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                    +{typeof p.margemLucro === 'number' ? p.margemLucro.toFixed(2).replace('.', ',') : p.margemLucro}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Novo / Editar Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex justify-between items-center border-b p-4 sm:px-6 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-800">
                {editingProdutoId ? 'Editar Produto' : 'Cadastrar Produto'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-xs">
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
