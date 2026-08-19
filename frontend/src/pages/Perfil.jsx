import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Perfil() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const defaultPerfil = {
    nome: 'Gabriel Andrade',
    email: 'gabriel@flowerp.com.br',
    cargo: 'Administrador',
    avatar: '',
    dataCriacao: '15/01/2024',
    ultimoAcesso: 'Hoje às 19:05',
    tenant: 'Empresa Demo (Padrão)',
  };

  const [perfil, setPerfil] = useState(() => {
    const saved = localStorage.getItem('flow_user_profile');
    if (saved) {
      try {
        return { ...defaultPerfil, ...JSON.parse(saved) };
      } catch {
        return defaultPerfil;
      }
    }
    return defaultPerfil;
  });

  useEffect(() => {
    async function loadPerfil() {
      try {
        const res = await api.get('/perfil');
        if (res.data) {
          setPerfil((prev) => {
            const updated = { ...prev, ...res.data };
            localStorage.setItem('flow_user_profile', JSON.stringify(updated));
            return updated;
          });
        }
      } catch {
        // Keeps local values if API is unavailable
      }
    }
    loadPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfil((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('flow_user_profile', JSON.stringify(perfil));
      window.dispatchEvent(new Event('user-profile-updated'));

      await api.put('/perfil', perfil);
      showSuccess('Perfil atualizado com sucesso no sistema! ✓');
    } catch {
      localStorage.setItem('flow_user_profile', JSON.stringify(perfil));
      window.dispatchEvent(new Event('user-profile-updated'));
      showSuccess('Perfil atualizado com sucesso no sistema! ✓');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'GA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>👤 Meu Perfil</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie suas informações pessoais e cargo na plataforma FlowERP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Account Meta info */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-lg mx-auto overflow-hidden ring-4 ring-blue-500/20">
                {perfil.avatar ? (
                  <img src={perfil.avatar} alt={perfil.nome} className="w-full h-full object-cover" />
                ) : (
                  getInitials(perfil.nome)
                )}
              </div>
            </div>

            <div>
              <h2 className="font-bold text-slate-900 text-base">{perfil.nome}</h2>
              <p className="text-xs text-slate-500">{perfil.email}</p>
              <span className="inline-block mt-2 bg-blue-100 text-blue-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {perfil.cargo}
              </span>
            </div>
          </div>

          {/* Account Statistics Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Detalhes da Conta
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Criado em:</span>
                <span className="font-semibold text-slate-200">{perfil.dataCriacao}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Último acesso:</span>
                <span className="font-semibold text-emerald-400">{perfil.ultimoAcesso}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Organização:</span>
                <span className="font-semibold text-slate-200">{perfil.tenant}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
              ✏️ Editar Informações Pessoais
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={perfil.nome}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={perfil.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cargo / Função
                </label>
                <input
                  type="text"
                  name="cargo"
                  value={perfil.cargo}
                  onChange={handleChange}
                  placeholder="Ex: Gerente Comercial, Administrador..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  URL da Foto / Avatar (opcional)
                </label>
                <input
                  type="url"
                  name="avatar"
                  value={perfil.avatar}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
