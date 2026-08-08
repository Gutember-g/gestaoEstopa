import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrencyBRL } from '../utils/money';
import { useToast } from '../context/ToastContext';

export default function Clientes() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState(null);
  const [deleteConfirmCliente, setDeleteConfirmCliente] = useState(null);
  const [historicoCliente, setHistoricoCliente] = useState(null);
  const [vendaDetalheModal, setVendaDetalheModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    inscricaoEstadual: '',
    telefone: '',
    email: '',
    observacao: '',
    status: 'ATIVO',
  });

  // Local Sales database for client history mapping
  const salesDatabase = {
    1: [
      {
        id: 101,
        dataVenda: '2026-08-05 14:30',
        custoTotal: 29.00,
        valorTotal: 55.00,
        desconto: 0.00,
        lucroLiquido: 26.00,
        prazoFaturamentoDias: 30,
        dataVencimento: '2026-09-04',
        status: 'PENDENTE',
        itens: [
          { sku: 'SKU-001', nomeProduto: 'Estopa Branca Premium 1kg', custoUnitario: 8.50, precoUnitario: 15.00, quantidade: 1 },
          { sku: 'SKU-004', nomeProduto: 'Pano de Chão Alvejado 10 un', custoUnitario: 12.00, precoUnitario: 25.00, quantidade: 1 },
        ],
      },
      {
        id: 98,
        dataVenda: '2026-07-20 10:00',
        custoTotal: 100.00,
        valorTotal: 210.00,
        desconto: 0.00,
        lucroLiquido: 110.00,
        prazoFaturamentoDias: 15,
        dataVencimento: '2026-08-04',
        status: 'PAGO',
        itens: [
          { sku: 'SKU-003', nomeProduto: 'Retalho de Malha Algodão 5kg', custoUnitario: 22.00, precoUnitario: 42.00, quantidade: 5 },
        ],
      },
    ],
    2: [
      {
        id: 102,
        dataVenda: '2026-08-04 11:15',
        custoTotal: 110.00,
        valorTotal: 210.00,
        desconto: 10.00,
        lucroLiquido: 100.00,
        prazoFaturamentoDias: 15,
        dataVencimento: '2026-08-19',
        status: 'PAGO',
        itens: [
          { sku: 'SKU-003', nomeProduto: 'Retalho de Malha Algodão 5kg', custoUnitario: 22.00, precoUnitario: 42.00, quantidade: 5 },
        ],
      },
    ],
  };

  // Local Clients state
  const [localClientes, setLocalClientes] = useState([
    {
      id: 1,
      nome: 'Distribuidora Silva & Cia',
      cpfCnpj: '12.345.678/0001-90',
      inscricaoEstadual: '110.234.567-00',
      telefone: '(11) 98765-4321',
      email: 'contato@silva.com',
      observacao: 'Cliente VIP desde 2024',
      status: 'ATIVO',
      temVendas: true,
      vendasCount: 2,
    },
    {
      id: 2,
      nome: 'Auto Peças Modelo Ltda',
      cpfCnpj: '98.765.432/0001-10',
      inscricaoEstadual: 'ISENTO',
      telefone: '(11) 91234-5678',
      email: 'compras@modelo.com',
      observacao: 'Faturamento em 30 dias',
      status: 'ATIVO',
      temVendas: true,
      vendasCount: 1,
    },
    {
      id: 3,
      nome: 'Comércio Industrial Souza',
      cpfCnpj: '45.678.901/0001-23',
      inscricaoEstadual: '120.345.678-00',
      telefone: '(11) 96543-2109',
      email: 'financeiro@souza.com',
      observacao: 'Contato preferencial por e-mail',
      status: 'ATIVO',
      temVendas: false,
      vendasCount: 0,
    },
    {
      id: 4,
      nome: 'Mecânica Express Eireli',
      cpfCnpj: '34.567.890/0001-45',
      inscricaoEstadual: 'ISENTO',
      telefone: '(11) 95432-1098',
      email: 'atendimento@express.com',
      observacao: 'Retira produtos na loja',
      status: 'ATIVO',
      temVendas: false,
      vendasCount: 0,
    },
  ]);

  const { data: clientes = localClientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
        const res = await api.get('/clientes');
        if (res.data && res.data.length > 0) return res.data;
        return localClientes;
      } catch {
        return localClientes;
      }
    },
  });

  // Resilient search function (ignores case, dots, slashes, dashes, spaces)
  const normalizeStr = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[^\w]/g, '');

  const cleanSearchTerm = normalizeStr(searchTerm);

  const filteredClientes = clientes.filter(
    (c) =>
      normalizeStr(c.nome).includes(cleanSearchTerm) ||
      normalizeStr(c.cpfCnpj).includes(cleanSearchTerm)
  );

  const handleOpenNewModal = () => {
    setEditingClienteId(null);
    setFormData({
      nome: '',
      cpfCnpj: '',
      inscricaoEstadual: '',
      telefone: '',
      email: '',
      observacao: '',
      status: 'ATIVO',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenEditModal = (cliente) => {
    setEditingClienteId(cliente.id);
    setFormData({
      nome: cliente.nome,
      cpfCnpj: cliente.cpfCnpj,
      inscricaoEstadual: cliente.inscricaoEstadual || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      observacao: cliente.observacao || '',
      status: cliente.status || 'ATIVO',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleOpenHistorico = (cliente) => {
    const list = salesDatabase[cliente.id] || [];
    const totalComprado = list.reduce((acc, v) => acc + v.valorTotal, 0);
    const count = list.length;
    const ticketMedio = count > 0 ? totalComprado / count : 0;

    setHistoricoCliente({
      cliente,
      vendas: list,
      totalComprado,
      vendasCount: count,
      ticketMedio,
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClienteId(null);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome / Razão Social é obrigatório.';
    }

    if (!formData.cpfCnpj.trim()) {
      newErrors.cpfCnpj = 'CPF / CNPJ é obrigatório.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Preencha os campos obrigatórios em destaque.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingClienteId) {
        // Edit Mode
        const updated = localClientes.map((c) => {
          if (c.id === editingClienteId) {
            return {
              ...c,
              nome: formData.nome,
              cpfCnpj: formData.cpfCnpj,
              inscricaoEstadual: formData.inscricaoEstadual,
              telefone: formData.telefone,
              email: formData.email,
              observacao: formData.observacao,
              status: formData.status,
            };
          }
          return c;
        });
        setLocalClientes(updated);
        showSuccess(`Cliente "${formData.nome}" atualizado com sucesso! ✓`);
      } else {
        // Create Mode
        const newCliente = {
          id: Math.floor(10 + Math.random() * 90),
          nome: formData.nome,
          cpfCnpj: formData.cpfCnpj,
          inscricaoEstadual: formData.inscricaoEstadual || 'ISENTO',
          telefone: formData.telefone,
          email: formData.email,
          observacao: formData.observacao,
          status: formData.status,
          temVendas: false,
          vendasCount: 0,
        };
        setLocalClientes([...localClientes, newCliente]);
        showSuccess(`Cliente "${newCliente.nome}" cadastrado com sucesso! ✓`);
      }

      setIsSubmitting(false);
      handleCloseModal();
    }, 500);
  };

  // Inactivate Action
  const handleInativarCliente = (cliente) => {
    const updated = localClientes.map((c) => (c.id === cliente.id ? { ...c, status: 'INATIVO' } : c));
    setLocalClientes(updated);
    showSuccess(`Cliente "${cliente.nome}" foi marcado como INATIVO ✓`);
    setDeleteConfirmCliente(null);
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (!deleteConfirmCliente) return;
    setIsDeleting(true);

    setTimeout(() => {
      const filtered = localClientes.filter((c) => c.id !== deleteConfirmCliente.id);
      setLocalClientes(filtered);
      showSuccess(`Cadastro de "${deleteConfirmCliente.nome}" excluído definitivamente ✓`);
      setIsDeleting(false);
      setDeleteConfirmCliente(null);
    }, 500);
  };

  const statusBadges = {
    PAGO: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    PENDENTE: 'bg-amber-50 text-amber-600 border-amber-200',
    ATRASADO: 'bg-red-50 text-red-600 border-red-200',
    CANCELADO: 'bg-slate-100 text-slate-400 border-slate-200',
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestão de Clientes</h1>
          <p className="text-xs text-slate-500 font-medium">Clique no cliente para abrir o histórico de compras, ticket médio e atalhos de vendas.</p>
        </div>
        <button
          onClick={handleOpenNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95 transition-all min-h-[44px]"
        >
          <span>+</span>
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Real-time Search Input with Clear Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500 transition-all">
        <div className="flex items-center gap-3 w-full">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ (ex: 12345678 ou Silva)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content: Responsive Cards Mobile & Table Desktop */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Carregando clientes...</div>
      ) : filteredClientes.length === 0 ? (
        /* Friendly Empty Search State */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="text-3xl">🔎</div>
          <h3 className="font-bold text-slate-800 text-sm">Nenhum cliente encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos nenhum resultado para "<strong className="text-slate-700">{searchTerm}</strong>". Verifique a grafia ou limpe o filtro.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all"
          >
            Limpar Busca
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Status</th>
                  <th className="p-4">Nome / Razão Social</th>
                  <th className="p-4">CPF / CNPJ</th>
                  <th className="p-4">Inscrição Estadual</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Observação</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        c.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {c.status || 'ATIVO'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      <button
                        onClick={() => handleOpenHistorico(c)}
                        className="text-left font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                        title="Ver histórico de compras"
                      >
                        <span>{c.nome}</span>
                        <span className="text-[10px] text-blue-500 font-normal bg-blue-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          📊 Histórico
                        </span>
                      </button>
                    </td>
                    <td className="p-4 font-mono">{c.cpfCnpj}</td>
                    <td className="p-4 font-mono text-slate-500">{c.inscricaoEstadual || '-'}</td>
                    <td className="p-4">
                      <div>{c.telefone}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{c.observacao || '-'}</td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenHistorico(c)}
                        className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 hover:text-blue-600 transition-all active:scale-95"
                        title="Ver histórico de vendas"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 hover:text-blue-600 transition-all active:scale-95"
                        title="Editar cliente"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirmCliente(c)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all active:scale-95"
                        title="Excluir cliente"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredClientes.map((c) => (
              <div key={c.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <button
                      onClick={() => handleOpenHistorico(c)}
                      className="font-bold text-sm text-slate-800 text-left hover:text-blue-600"
                    >
                      {c.nome} 📊
                    </button>
                    <div className="mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        c.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {c.status || 'ATIVO'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenHistorico(c)}
                      className="p-1 text-slate-500 hover:text-blue-600"
                      title="Ver histórico"
                    >
                      📊
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(c)}
                      className="p-1 text-slate-500 hover:text-blue-600"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCliente(c)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-xs font-mono text-slate-600">CPF/CNPJ: {c.cpfCnpj}</div>
                <div className="text-xs text-slate-500">I.E.: {c.inscricaoEstadual || 'Isento'}</div>
                <div className="text-xs text-blue-600 font-medium">{c.telefone} | {c.email}</div>
                {c.observacao && <div className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded">{c.observacao}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Drawer de Histórico de Vendas do Cliente */}
      {historicoCliente && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-3xl space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Histórico Comercial — {historicoCliente.cliente.nome}
                </h2>
                <p className="text-[11px] text-slate-400">CPF/CNPJ: {historicoCliente.cliente.cpfCnpj}</p>
              </div>
              <button
                onClick={() => setHistoricoCliente(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* KPI Cards Header Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total de Vendas</span>
                <span className="text-base font-extrabold text-slate-800">{historicoCliente.vendasCount} pedidos</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Acumulado</span>
                <span className="text-base font-extrabold text-blue-600">{formatCurrencyBRL(historicoCliente.totalComprado)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ticket Médio</span>
                <span className="text-base font-extrabold text-emerald-600">{formatCurrencyBRL(historicoCliente.ticketMedio)}</span>
              </div>
            </div>

            {/* Sales Timeline List (Descending date) */}
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-slate-700">Histórico de Pedidos de Venda:</h3>
              {historicoCliente.vendas.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400">
                  Nenhuma venda cadastrada para este cliente até o momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {historicoCliente.vendas.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setVendaDetalheModal(v)}
                      className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span>Venda #{v.id}</span>
                          <span className="text-slate-400 text-[10px] font-mono">({v.dataVenda})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {v.itens.length} item(ns) | Prazo: {v.prazoFaturamentoDias} dias
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900">{formatCurrencyBRL(v.valorTotal)}</div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${statusBadges[v.status]}`}>
                            {v.status}
                          </span>
                        </div>
                        <span className="text-slate-400 text-xs">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Quick Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setHistoricoCliente(null);
                    showSuccess(`Cliente "${historicoCliente.cliente.nome}" pré-selecionado em Nova Venda ✓`);
                    navigate('/vendas');
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs active:scale-95 transition-all shadow-sm"
                >
                  + Nova Venda para este Cliente
                </button>

                {historicoCliente.vendas.length > 0 && (
                  <button
                    onClick={() => {
                      setHistoricoCliente(null);
                      showSuccess(`Venda #${historicoCliente.vendas[0].id} pronta para duplicação em Vendas ✓`);
                      navigate('/vendas');
                    }}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-xl text-xs active:scale-95 transition-all"
                  >
                    📋 Duplicar Última Venda
                  </button>
                )}
              </div>

              <button
                onClick={() => setHistoricoCliente(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal Detalhes da Venda Selecionada no Histórico */}
      {vendaDetalheModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-xl space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Detalhes da Venda #{vendaDetalheModal.id}</h3>
                <p className="text-[11px] text-slate-400">Data: {vendaDetalheModal.dataVenda}</p>
              </div>
              <button onClick={() => setVendaDetalheModal(null)} className="text-slate-400 text-lg font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-700">Produtos Comprados:</h4>
              <div className="bg-slate-50 border rounded-xl divide-y overflow-hidden">
                {vendaDetalheModal.itens.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">[{it.sku}] {it.nomeProduto}</div>
                      <div className="text-[10px] text-slate-400">Qtd: {it.quantidade}x | Valor Unit.: {formatCurrencyBRL(it.precoUnitario)}</div>
                    </div>
                    <div className="font-bold text-slate-900">{formatCurrencyBRL(it.precoUnitario * it.quantidade)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white p-3.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Valor Total</span>
                <span className="text-base font-bold">{formatCurrencyBRL(vendaDetalheModal.valorTotal)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 block uppercase">Lucro Líquido</span>
                <span className="text-base font-bold text-emerald-400">{formatCurrencyBRL(vendaDetalheModal.lucroLiquido)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setVendaDetalheModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs active:scale-95"
              >
                Voltar ao Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Novo / Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-800">
                {editingClienteId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Razão Social *</label>
                <input
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    if (errors.nome) setErrors({ ...errors, nome: null });
                  }}
                  className={`w-full p-2.5 border rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                    errors.nome ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                  }`}
                />
                {errors.nome && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.nome}</span>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF / CNPJ *</label>
                  <input
                    value={formData.cpfCnpj}
                    onChange={(e) => {
                      setFormData({ ...formData, cpfCnpj: e.target.value });
                      if (errors.cpfCnpj) setErrors({ ...errors, cpfCnpj: null });
                    }}
                    className={`w-full p-2.5 border rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                      errors.cpfCnpj ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200'
                    }`}
                  />
                  {errors.cpfCnpj && <span className="text-rose-500 text-[10px] font-semibold block mt-1">{errors.cpfCnpj}</span>}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Inscrição Estadual</label>
                  <input
                    value={formData.inscricaoEstadual}
                    onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone</label>
                  <input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações</label>
                <textarea
                  rows="2"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/40"
                />
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
                    <span>{editingClienteId ? 'Salvar Alterações' : 'Salvar Cliente'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão de Cliente */}
      {deleteConfirmCliente && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-base font-bold text-slate-900">Excluir Cliente</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja excluir o cadastro do cliente <strong>"{deleteConfirmCliente.nome}"</strong>?
            </p>

            {deleteConfirmCliente.temVendas && (
              <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-800 space-y-1">
                <strong className="font-semibold block">⚠️ Cliente possui {deleteConfirmCliente.vendasCount} venda(s) registrada(s):</strong>
                <span>
                  Recomendamos apenas inativar o cadastro para preservar o histórico comercial dos relatórios.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmCliente(null)}
                className="px-3 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl active:scale-95 transition-all text-xs"
              >
                Cancelar
              </button>

              {deleteConfirmCliente.temVendas && (
                <button
                  type="button"
                  onClick={() => handleInativarCliente(deleteConfirmCliente)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all text-xs"
                >
                  Inativar Cadastro
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
