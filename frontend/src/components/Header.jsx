import React from 'react';

export default function Header({ activeTab, onTabChange }) {
  const currentTenant = localStorage.getItem('tenantId') || 'empresa_demo';

  const handleTenantChange = (e) => {
    localStorage.setItem('tenantId', e.target.value);
    window.location.reload();
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral' },
    { id: 'diretoria', label: 'Diretoria' },
    { id: 'cobrancas', label: 'Minhas Cobranças' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#1E1E2D] border-b border-slate-800 text-white px-4 h-14 flex items-center justify-between shadow-md">
      {/* Left: Brand & Top Tab Navigation */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-bold text-base text-blue-400">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black">
            F
          </div>
          <span className="hidden sm:inline text-white tracking-tight font-extrabold text-sm">FlowERP</span>
        </div>

        {/* Topbar Tabs Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right Controls: Search, Tenant Badge, Notifications & Profile Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Search Input */}
        <div className="relative hidden sm:block w-44 lg:w-60">
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-400 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>

        {/* Tenant Selector Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700/80 px-2 py-1 rounded-lg text-xs">
          <span className="text-slate-400 font-medium hidden lg:inline">Tenant:</span>
          <select
            value={currentTenant}
            onChange={handleTenantChange}
            className="bg-transparent text-blue-400 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            <option value="empresa_demo" className="bg-[#1E1E2D] text-white">Empresa Demo</option>
            <option value="filial_sp" className="bg-[#1E1E2D] text-white">Filial SP</option>
            <option value="filial_rj" className="bg-[#1E1E2D] text-white">Filial RJ</option>
          </select>
        </div>

        {/* Notifications Icon with Badge Counter */}
        <button className="relative p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <span className="text-sm">🔔</span>
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-[#1E1E2D]">
            5
          </span>
        </button>

        {/* User Profile Avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-blue-400/30">
          GA
        </div>
      </div>
    </header>
  );
}
