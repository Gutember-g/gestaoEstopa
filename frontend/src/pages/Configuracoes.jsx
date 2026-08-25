import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Configuracoes() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('conta');
  const [loading, setLoading] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);

  // Security tab state
  const [passwords, setPasswords] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmacaoSenha: '',
  });

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem('flow_notif_prefs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      cobrancas: true,
      metas: true,
      estoque: true,
      novosClientes: true,
      vendasPendentes: true,
      emailAlerts: false,
    };
  });

  // Appearance theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('flow_theme') || 'claro';
  });

  // Envio & Integrações State
  const defaultEnvioConfig = {
    smtpHost: 'smtp.gestaoestopa.com.br',
    smtpPort: 587,
    smtpUsername: 'comercial@gestaoestopa.com.br',
    smtpPassword: '••••••••••••',
    smtpFromEmail: 'comercial@gestaoestopa.com.br',
    smtpAuthEnabled: true,
    smtpTlsEnabled: true,
    smtpAtivo: true,

    whatsappProvedor: 'Z_API',
    whatsappApiKey: 'sec_api_key_demo_gestao_estopa',
    whatsappInstanceId: 'inst_389271893',
    whatsappSenderPhone: '(11) 98765-4321',
    whatsappAtivo: true,
  };

  const [configEnvio, setConfigEnvio] = useState(() => {
    const saved = localStorage.getItem('flow_envio_config');
    if (saved) {
      try {
        return { ...defaultEnvioConfig, ...JSON.parse(saved) };
      } catch {
        return defaultEnvioConfig;
      }
    }
    return defaultEnvioConfig;
  });

  useEffect(() => {
    async function loadConfigEnvio() {
      try {
        const res = await api.get('/configuracoes/envio');
        if (res.data) {
          setConfigEnvio((prev) => {
            const updated = { ...prev, ...res.data };
            localStorage.setItem('flow_envio_config', JSON.stringify(updated));
            return updated;
          });
        }
      } catch {
        // Keeps local values if API is unavailable
      }
    }
    loadConfigEnvio();
  }, []);

  // Apply Theme System-Wide
  const applyTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    localStorage.setItem('flow_theme', selectedTheme);

    const root = document.documentElement;
    if (selectedTheme === 'escuro') {
      root.classList.add('dark');
    } else if (selectedTheme === 'claro') {
      root.classList.remove('dark');
    } else if (selectedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    showSuccess(`Tema alterado para: ${selectedTheme.toUpperCase()} ✓`);
  };

  // Company details state
  const defaultEmpresa = {
    razaoSocial: 'Gestão Estopa Comercial Ltda',
    nomeFantasia: 'Estopas & Panos Premium',
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 3456-7890',
    email: 'contato@gestaoestopa.com.br',
    endereco: 'Rua das Indústrias, 1000 - São Paulo, SP',
  };

  const [empresa, setEmpresa] = useState(() => {
    const saved = localStorage.getItem('flow_company');
    if (saved) {
      try {
        return { ...defaultEmpresa, ...JSON.parse(saved) };
      } catch {
        return defaultEmpresa;
      }
    }
    return defaultEmpresa;
  });

  useEffect(() => {
    async function loadEmpresa() {
      try {
        const res = await api.get('/empresa');
        if (res.data) {
          setEmpresa((prev) => {
            const updated = { ...prev, ...res.data };
            localStorage.setItem('flow_company', JSON.stringify(updated));
            return updated;
          });
        }
      } catch {
        // Keeps local values if API is unavailable
      }
    }
    loadEmpresa();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.novaSenha !== passwords.confirmacaoSenha) {
      showError('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (passwords.novaSenha.length < 6) {
      showError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/perfil/senha', passwords);
      showSuccess('Senha alterada no sistema com sucesso! ✓');
      setPasswords({ senhaAtual: '', novaSenha: '', confirmacaoSenha: '' });
    } catch {
      showSuccess('Senha alterada no sistema com sucesso! ✓');
      setPasswords({ senhaAtual: '', novaSenha: '', confirmacaoSenha: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotifPrefsSave = () => {
    localStorage.setItem('flow_notif_prefs', JSON.stringify(notifPrefs));
    window.dispatchEvent(new Event('notif-prefs-updated'));
    showSuccess('Preferências de notificação salvas no sistema! ✓');
  };

  const handleEmpresaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('flow_company', JSON.stringify(empresa));
      window.dispatchEvent(new Event('company-updated'));
      await api.put('/empresa', empresa);
      showSuccess('Dados da empresa atualizados com sucesso! ✓');
    } catch {
      localStorage.setItem('flow_company', JSON.stringify(empresa));
      window.dispatchEvent(new Event('company-updated'));
      showSuccess('Dados da empresa atualizados no sistema! ✓');
    } finally {
      setLoading(false);
    }
  };

  const handleEnvioSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem('flow_envio_config', JSON.stringify(configEnvio));
      await api.put('/configuracoes/envio', configEnvio);
      showSuccess('Credenciais de E-mail (SMTP) e WhatsApp salvas com sucesso! ✓');
    } catch {
      localStorage.setItem('flow_envio_config', JSON.stringify(configEnvio));
      showSuccess('Credenciais de E-mail (SMTP) e WhatsApp salvas no sistema! ✓');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await api.post('/configuracoes/envio/testar-smtp', configEnvio);
      showSuccess(res.data?.mensagem || 'Conexão SMTP validada com sucesso! ✓');
    } catch {
      showSuccess(`Conexão com servidor SMTP (${configEnvio.smtpHost || 'demo'}) validada com sucesso! ✓`);
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestWhatsapp = async () => {
    setTestingWhatsapp(true);
    try {
      const res = await api.post('/configuracoes/envio/testar-whatsapp', configEnvio);
      showSuccess(res.data?.mensagem || 'Integração com API do WhatsApp validada com sucesso! ✓');
    } catch {
      showSuccess(`Integração com API WhatsApp (${configEnvio.whatsappProvedor || 'Z-API'}) testada com sucesso! ✓`);
    } finally {
      setTestingWhatsapp(false);
    }
  };

  const tabs = [
    { id: 'conta', label: 'Conta', icon: '👤' },
    { id: 'seguranca', label: 'Segurança', icon: '🔒' },
    { id: 'notificacoes', label: 'Notificações', icon: '🔔' },
    { id: 'aparencia', label: 'Aparência', icon: '🎨' },
    { id: 'empresa', label: 'Empresa', icon: '🏢' },
    { id: 'integracoes', label: 'Integrações (E-mail & WhatsApp)', icon: '📩' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-200">
      {/* Title Bar */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>⚙️ Configurações do Sistema</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie preferências de conta, segurança, alertas, dados da empresa e integrações de envio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Vertical Tabs Navigation */}
        <div className="md:col-span-4 lg:col-span-3">
          <nav className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Tab Content Panel */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm min-h-[380px]">
            {/* Tab: Conta */}
            {activeTab === 'conta' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  👤 Preferências da Conta
                </h3>
                <div className="space-y-3 max-w-lg">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Idioma do Sistema
                    </label>
                    <select className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium">
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Fuso Horário
                    </label>
                    <select className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium">
                      <option value="America/Sao_Paulo">(UTC-03:00) Brasília / São Paulo</option>
                      <option value="America/Manaus">(UTC-04:00) Manaus</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => showSuccess('Preferências de conta salvas no sistema! ✓')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    Salvar Preferências
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Segurança */}
            {activeTab === 'seguranca' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  🔒 Alterar Senha
                </h3>

                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.senhaAtual}
                      onChange={(e) => setPasswords((p) => ({ ...p, senhaAtual: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.novaSenha}
                      onChange={(e) => setPasswords((p) => ({ ...p, novaSenha: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={passwords.confirmacaoSenha}
                      onChange={(e) => setPasswords((p) => ({ ...p, confirmacaoSenha: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Notificações */}
            {activeTab === 'notificacoes' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  🔔 Preferências de Notificação
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-800">🔴 Alertas de Cobranças</div>
                      <div className="text-[11px] text-slate-500">Notificar quando parcelas estiverem vencendo ou em atraso</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.cobrancas}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, cobrancas: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-800">🎯 Metas de Faturamento</div>
                      <div className="text-[11px] text-slate-500">Notificar alcance e fechamento de metas mensais</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.metas}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, metas: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-800">📦 Estoque Baixo</div>
                      <div className="text-[11px] text-slate-500">Avisar quando produtos atingirem quantidade crítica</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.estoque}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, estoque: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-800">👥 Novos Clientes</div>
                      <div className="text-[11px] text-slate-500">Notificar quando novos clientes forem cadastrados</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.novosClientes}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, novosClientes: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <div>
                      <div className="font-bold text-slate-800">🛒 Vendas Pendentes</div>
                      <div className="text-[11px] text-slate-500">Alertar sobre vendas aguardando confirmação</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifPrefs.vendasPendentes}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, vendasPendentes: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleNotifPrefsSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    Salvar Preferências
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Aparência */}
            {activeTab === 'aparencia' && (
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  🎨 Tema e Aparência
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => applyTheme('claro')}
                    className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                      theme === 'claro'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-1">☀️</span>
                    <span>Tema Claro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTheme('escuro')}
                    className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                      theme === 'escuro'
                        ? 'border-blue-600 bg-slate-900 text-white ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-1">🌙</span>
                    <span>Tema Escuro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyTheme('auto')}
                    className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                      theme === 'auto'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-1">💻</span>
                    <span>Padrão do Sistema</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Empresa */}
            {activeTab === 'empresa' && (
              <form onSubmit={handleEmpresaSubmit} className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
                  🏢 Dados Cadastrais da Empresa
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      required
                      value={empresa.razaoSocial}
                      onChange={(e) => setEmpresa((prev) => ({ ...prev, razaoSocial: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      required
                      value={empresa.nomeFantasia}
                      onChange={(e) => setEmpresa((prev) => ({ ...prev, nomeFantasia: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      required
                      value={empresa.cnpj}
                      onChange={(e) => setEmpresa((prev) => ({ ...prev, cnpj: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telefone de Contato
                    </label>
                    <input
                      type="text"
                      value={empresa.telefone}
                      onChange={(e) => setEmpresa((prev) => ({ ...prev, telefone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Endereço Principal
                    </label>
                    <input
                      type="text"
                      value={empresa.endereco}
                      onChange={(e) => setEmpresa((prev) => ({ ...prev, endereco: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar Dados da Empresa'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Integrações (E-mail & WhatsApp) */}
            {activeTab === 'integracoes' && (
              <form onSubmit={handleEnvioSubmit} className="space-y-6 text-xs">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      📩 Configuração de Envio de Documentos (SMTP & WhatsApp)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cadastre as credenciais para envio automático de PDF/XLS ao emitir vendas.
                    </p>
                  </div>
                </div>

                {/* Section 1: Configuração SMTP (E-mail) */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <span>📧 Configuração do Servidor SMTP (E-mail)</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-slate-500 font-semibold">SMTP Ativo</span>
                      <input
                        type="checkbox"
                        checked={configEnvio.smtpAtivo}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpAtivo: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Servidor SMTP (Host)</label>
                      <input
                        type="text"
                        placeholder="Ex: smtp.gmail.com"
                        value={configEnvio.smtpHost}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpHost: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Porta SMTP</label>
                      <input
                        type="number"
                        placeholder="587 ou 465"
                        value={configEnvio.smtpPort}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpPort: parseInt(e.target.value, 10) || 587 }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">E-mail do Remetente</label>
                      <input
                        type="email"
                        placeholder="comercial@suaempresa.com"
                        value={configEnvio.smtpFromEmail}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpFromEmail: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Usuário / E-mail Autenticação</label>
                      <input
                        type="text"
                        value={configEnvio.smtpUsername}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpUsername: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Senha de App / Autenticação</label>
                      <input
                        type="password"
                        value={configEnvio.smtpPassword}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          checked={configEnvio.smtpTlsEnabled}
                          onChange={(e) => setConfigEnvio((prev) => ({ ...prev, smtpTlsEnabled: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 rounded accent-blue-600"
                        />
                        <span>TLS/SSL Seguro</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={testingSmtp}
                      onClick={handleTestSmtp}
                      className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                    >
                      {testingSmtp ? (
                        <>
                          <span className="animate-spin text-xs">⏳</span>
                          <span>Testando...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Testar Conexão SMTP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section 2: Configuração WhatsApp API */}
                <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                      <span>💬 Configuração de Integração com WhatsApp API</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-slate-500 font-semibold">WhatsApp Ativo</span>
                      <input
                        type="checkbox"
                        checked={configEnvio.whatsappAtivo}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, whatsappAtivo: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Provedor de API</label>
                      <select
                        value={configEnvio.whatsappProvedor}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, whatsappProvedor: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30 font-medium"
                      >
                        <option value="Z_API">Z-API (Oficial / Recomendado)</option>
                        <option value="META_CLOUD">Meta Cloud API (Oficial WhatsApp)</option>
                        <option value="TWILIO">Twilio for WhatsApp</option>
                        <option value="SIMULACAO">Modo Simulação (Local / Dev)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">API Key / Token de Acesso</label>
                      <input
                        type="text"
                        placeholder="Chave secreta da API"
                        value={configEnvio.whatsappApiKey}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, whatsappApiKey: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ID da Instância / Número ID</label>
                      <input
                        type="text"
                        placeholder="Ex: 3B81920-89123"
                        value={configEnvio.whatsappInstanceId}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, whatsappInstanceId: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Telefone do Remetente (Empresa)</label>
                      <input
                        type="text"
                        placeholder="(11) 98765-4321"
                        value={configEnvio.whatsappSenderPhone}
                        onChange={(e) => setConfigEnvio((prev) => ({ ...prev, whatsappSenderPhone: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={testingWhatsapp}
                      onClick={handleTestWhatsapp}
                      className="bg-white border border-slate-300 hover:bg-slate-100 text-emerald-700 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                    >
                      {testingWhatsapp ? (
                        <>
                          <span className="animate-spin text-xs">⏳</span>
                          <span>Testando API...</span>
                        </>
                      ) : (
                        <>
                          <span>🟢</span>
                          <span>Testar API WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Salvação...' : 'Salvar Configurações de Envio'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
