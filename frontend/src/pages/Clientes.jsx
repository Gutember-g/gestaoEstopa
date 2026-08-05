import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function Clientes() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    inscricaoEstadual: '',
    telefone: '',
    email: '',
    observacao: '',
  });

  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      try {
        const res = await api.get('/clientes');
        return res.data;
      } catch {
        return [
          { id: 1, nome: 'Distribuidora Silva & Cia', cpfCnpj: '12.345.678/0001-90', inscricaoEstadual: '110.234.567-00', telefone: '(11) 98765-4321', email: 'contato@silva.com', observacao: 'Cliente VIP desde 2024' },
          { id: 2, nome: 'Auto Peças Modelo Ltda', cpfCnpj: '98.765.432/0001-10', inscricaoEstadual: 'ISENTO', telefone: '(11) 91234-5678', email: 'compras@modelo.com', observacao: 'Faturamento em 30 dias' },
        ];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (newCliente) => api.post('/clientes', newCliente),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      setShowModal(false);
      setFormData({ nome: '', cpfCnpj: '', inscricaoEstadual: '', telefone: '', email: '', observacao: '' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cpfCnpj.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Gestão de Clientes</h1>
          <p className="text-xs text-slate-500 font-medium">Cadastro completo com suporte a CPF/CNPJ, Inscrição Estadual e observações.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 min-h-[44px]"
        >
          <span>+</span>
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <span className="text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nome ou CPF/CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Content: Responsive Cards Mobile & Table Desktop */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Carregando clientes...</div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">CPF / CNPJ</th>
                  <th className="p-4">Inscrição Estadual</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{c.nome}</td>
                    <td className="p-4 font-mono">{c.cpfCnpj}</td>
                    <td className="p-4 font-mono text-slate-500">{c.inscricaoEstadual || '-'}</td>
                    <td className="p-4">
                      <div>{c.telefone}</div>
                      <div className="text-[11px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{c.observacao || '-'}</td>
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
                  <h3 className="font-bold text-sm text-slate-800">{c.nome}</h3>
                  <span className="text-[10px] bg-slate-100 font-mono px-2 py-0.5 rounded text-slate-600">#{c.id}</span>
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-base font-bold text-slate-800">Cadastrar Novo Cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Nome Razão Social *</label>
                <input
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">CPF / CNPJ *</label>
                  <input
                    required
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Inscrição Estadual</label>
                  <input
                    value={formData.inscricaoEstadual}
                    onChange={(e) => setFormData({ ...formData, inscricaoEstadual: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Telefone</label>
                  <input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Observações</label>
                <textarea
                  rows="2"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="w-full mt-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
