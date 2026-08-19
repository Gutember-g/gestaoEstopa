import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { setAccessToken } from '../services/authStore';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [tenantId, setTenantId] = useState('empresa_demo');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password, tenantId });
      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        localStorage.setItem('tenantId', tenantId);
        showSuccess('Autenticado com sucesso!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erro ao realizar login:', err);
      showError(err.response?.data?.message || 'Falha na autenticação. Verifique os dados ou entre no modo demo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    localStorage.setItem('tenantId', tenantId || 'empresa_demo');
    showSuccess('Acessando no modo de demonstração local.');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#1E1E2D] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-white">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 text-white font-black text-2xl mb-2">
            F
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">FlowERP</h1>
          <p className="text-xs text-slate-400">
            Gestão Comercial e Financeira Multi-tenant
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Usuário
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário..."
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tenant (Empresa)
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-sm text-blue-400 font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            >
              <option value="empresa_demo">Empresa Demo</option>
              <option value="filial_sp">Filial SP</option>
              <option value="filial_rj">Filial RJ</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">ou</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Demo Fallback Action */}
        <button
          type="button"
          onClick={handleDemoMode}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs border border-slate-700 transition-all active:scale-[0.98]"
        >
          🚀 Acessar Modo Demonstração (Sem Login)
        </button>
      </div>
    </div>
  );
}
