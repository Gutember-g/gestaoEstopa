import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const currentTenant = localStorage.getItem('tenantId') || 'empresa_demo';
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const handleTenantChange = (e) => {
    localStorage.setItem('tenantId', e.target.value);
    window.location.reload();
  };

  const tabs = [
    { id: 'geral', label: 'Visão Geral' },
    { id: 'diretoria', label: 'Diretoria' },
    { id: 'cobrancas', label: 'Minhas Cobranças' },
  ];

  // Global Mock Catalog Data for Unified Search
  const globalCatalog = {
    clientes: [
      { id: 1, nome: 'Distribuidora Silva & Cia', cpfCnpj: '12.345.678/0001-90' },
      { id: 2, nome: 'Auto Peças Modelo Ltda', cpfCnpj: '98.765.432/0001-10' },
      { id: 3, nome: 'Comércio Industrial Souza', cpfCnpj: '45.678.901/0001-23' },
      { id: 4, nome: 'Mecânica Express Eireli', cpfCnpj: '34.567.890/0001-45' },
    ],
    produtos: [
      { id: 1, sku: 'SKU-001', nome: 'Estopa Branca Premium 1kg', preco: 15.00 },
      { id: 2, sku: 'SKU-002', nome: 'Estopa Colorida Especial 500g', preco: 7.50 },
      { id: 3, sku: 'SKU-003', nome: 'Retalho de Malha Algodão 5kg', preco: 42.00 },
      { id: 4, sku: 'SKU-004', nome: 'Pano de Chão Alvejado 10 un', preco: 25.00 },
    ],
    vendas: [
      { id: 101, clienteNome: 'Distribuidora Silva & Cia', valorTotal: 55.00, status: 'PENDENTE' },
      { id: 102, clienteNome: 'Auto Peças Modelo Ltda', valorTotal: 210.00, status: 'PAGO' },
    ],
  };

  const normalizeStr = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/[^\w]/g, '');

  const cleanTerm = normalizeStr(globalSearch);

  // Filter matching results per category
  const matchingClientes = cleanTerm
    ? globalCatalog.clientes.filter(
        (c) => normalizeStr(c.nome).includes(cleanTerm) || normalizeStr(c.cpfCnpj).includes(cleanTerm)
      )
    : [];

  const matchingProdutos = cleanTerm
    ? globalCatalog.produtos.filter(
        (p) => normalizeStr(p.nome).includes(cleanTerm) || normalizeStr(p.sku).includes(cleanTerm)
      )
    : [];

  const matchingVendas = cleanTerm
    ? globalCatalog.vendas.filter(
        (v) =>
          normalizeStr(v.id).includes(cleanTerm) ||
          normalizeStr(v.clienteNome).includes(cleanTerm)
      )
    : [];

  const hasAnyResults =
    matchingClientes.length > 0 || matchingProdutos.length > 0 || matchingVendas.length > 0;

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateToResult = (path) => {
    setIsDropdownOpen(false);
    setGlobalSearch('');
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1E1E2D] border-b border-slate-800 text-white px-4 h-14 flex items-center justify-between shadow-md">
      {/* Left: Brand & Top Tab Navigation */}
      <div className="flex items-center gap-6">
        <div
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-bold text-base text-blue-400 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-600/30">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
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
        {/* Quick Global Search Input with Floating Panel */}
        <div ref={searchRef} className="relative hidden sm:block w-48 lg:w-72">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Pesquisar clientes, produtos, vendas..."
              value={globalSearch}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setIsDropdownOpen(true);
              }}
              className="w-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-400 rounded-lg pl-7 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-200 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Floating Dropdown Results Panel */}
          {isDropdownOpen && globalSearch.trim() !== '' && (
            <div className="absolute left-0 right-0 mt-2 bg-[#1E1E2D] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto divide-y divide-slate-800">
              {!hasAnyResults ? (
                <div className="p-4 text-center text-slate-400 text-xs font-medium">
                  Nenhum resultado encontrado para "<span className="text-slate-200 font-bold">{globalSearch}</span>".
                </div>
              ) : (
                <>
                  {/* Category: Clientes */}
                  {matchingClientes.length > 0 && (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-blue-400 px-2 py-1 tracking-wider">
                        👥 Clientes ({matchingClientes.length})
                      </div>
                      {matchingClientes.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleNavigateToResult('/clientes')}
                          className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-200">{c.nome}</div>
                            <div className="text-[10px] text-slate-400 font-mono">CPF/CNPJ: {c.cpfCnpj}</div>
                          </div>
                          <span className="text-[10px] text-blue-400">Ver →</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: Produtos */}
                  {matchingProdutos.length > 0 && (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 px-2 py-1 tracking-wider">
                        📦 Produtos ({matchingProdutos.length})
                      </div>
                      {matchingProdutos.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleNavigateToResult('/produtos')}
                          className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-200">[{p.sku}] {p.nome}</div>
                            <div className="text-[10px] text-emerald-400 font-mono">R$ {p.preco.toFixed(2)}</div>
                          </div>
                          <span className="text-[10px] text-emerald-400">Ver →</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category: Vendas */}
                  {matchingVendas.length > 0 && (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] uppercase font-bold text-amber-400 px-2 py-1 tracking-wider">
                        🛒 Vendas ({matchingVendas.length})
                      </div>
                      {matchingVendas.slice(0, 3).map((v) => (
                        <div
                          key={v.id}
                          onClick={() => handleNavigateToResult('/vendas')}
                          className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-bold text-slate-200">Venda #{v.id} — {v.clienteNome}</div>
                            <div className="text-[10px] text-amber-400 font-mono">Total: R$ {v.valorTotal.toFixed(2)} ({v.status})</div>
                          </div>
                          <span className="text-[10px] text-amber-400">Ver →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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

        {/* Notifications Icon */}
        <button className="relative p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg active:scale-95 transition-all">
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
