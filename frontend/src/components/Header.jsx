import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import UserMenuDropdown from './UserMenuDropdown';

export default function Header() {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: '🏠' },
    { label: 'Vendas', path: '/vendas', icon: '🛒' },
    { label: 'Financeiro', path: '/financeiro', icon: '💰' },
    { label: 'Clientes', path: '/clientes', icon: '👥' },
    { label: 'Produtos', path: '/produtos', icon: '📦' },
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
    <>
      <header className="sticky top-0 z-40 bg-[#1E1E2D] border-b border-slate-800 text-white px-4 h-14 flex items-center justify-between shadow-md">
        {/* Left: Hamburger Button (Mobile) & Brand / Logo */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none transition-colors"
            title="Abrir Menu de Navegação"
          >
            <span className="text-xl leading-none">☰</span>
          </button>

          <div
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 font-bold text-base text-blue-400 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-600/30">
              F
            </div>
            <span className="text-white tracking-tight font-extrabold text-sm">FlowERP</span>
          </div>
        </div>

        {/* Right Controls: Quick Search, Notifications & User Menu Dropdown */}
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

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Profile Avatar Menu */}
          <UserMenuDropdown />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          />

          {/* Drawer Panel */}
          <div className="relative w-64 bg-[#1E1E2D] text-slate-300 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-600/30">
                  F
                </div>
                <span className="text-white tracking-tight font-extrabold text-sm">FlowERP</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              <div className="px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Navegação Principal
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 text-xs font-semibold transition-all duration-150 relative ${
                      isActive
                        ? 'border-l-2 border-emerald-400 text-white bg-white/5 font-bold'
                        : 'border-l-2 border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
              FlowERP Mobile v1.0.0
            </div>
          </div>
        </div>
      )}
    </>
  );
}
