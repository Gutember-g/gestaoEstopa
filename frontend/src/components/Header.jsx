import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import api from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import UserMenuDropdown from './UserMenuDropdown';
import { formatCurrencyBRL } from '../utils/money';

export default function Header() {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ clientes: [], produtos: [], vendas: [] });
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: '🏠' },
    { label: 'Vendas', path: '/vendas', icon: '🛒' },
    { label: 'Financeiro', path: '/financeiro', icon: '💰' },
    { label: 'Clientes', path: '/clientes', icon: '👥' },
    { label: 'Produtos', path: '/produtos', icon: '📦' },
  ];

  // Debounce ~300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(globalSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [globalSearch]);

  // Fetch real search results from backend API
  useEffect(() => {
    const term = debouncedSearch.trim();
    if (!term) {
      setSearchResults({ clientes: [], produtos: [], vendas: [] });
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);

    async function fetchSearch() {
      try {
        const res = await api.get('/busca-global', { params: { q: term } });
        if (active && res.data) {
          setSearchResults({
            clientes: res.data.clientes || [],
            produtos: res.data.produtos || [],
            vendas: res.data.vendas || [],
          });
        }
      } catch (err) {
        console.warn('[GlobalSearch] Erro ao buscar via API:', err);
      } finally {
        if (active) setIsSearching(false);
      }
    }

    fetchSearch();
    return () => {
      active = false;
    };
  }, [debouncedSearch]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateToResult = (path) => {
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    setGlobalSearch('');
    navigate(path);
  };

  const matchingClientes = (searchResults.clientes || []).slice(0, 5);
  const matchingProdutos = (searchResults.produtos || []).slice(0, 5);
  const matchingVendas = (searchResults.vendas || []).slice(0, 5);

  const hasAnyResults =
    matchingClientes.length > 0 || matchingProdutos.length > 0 || matchingVendas.length > 0;

  const renderSearchResultsPanel = () => {
    if (!isDropdownOpen || globalSearch.trim() === '') return null;

    return (
      <div className="absolute left-0 right-0 mt-2 bg-[#1E1E2D] border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 max-h-80 overflow-y-auto divide-y divide-slate-800">
        {isSearching ? (
          <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <span className="animate-spin text-blue-400">⏳</span> Pesquisando...
          </div>
        ) : !hasAnyResults ? (
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
                {matchingClientes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleNavigateToResult('/clientes')}
                    className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-200">{c.nome}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        CPF/CNPJ: {c.cpfCnpj || '-'}
                      </div>
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
                {matchingProdutos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleNavigateToResult('/produtos')}
                    className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-200">
                        [{p.sku || 'SKU'}] {p.nome}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {formatCurrencyBRL(p.precoVenda || 0)}
                      </div>
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
                {matchingVendas.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleNavigateToResult('/vendas')}
                    className="px-2.5 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-200">
                        Venda #{v.id} — {v.clienteNome || 'Cliente'}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        Total: {formatCurrencyBRL(v.valorTotal || 0)} ({v.status || 'CONFIRMADA'})
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400">Ver →</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
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
          {/* Mobile Search Button Toggle */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setIsDropdownOpen(true);
            }}
            className="sm:hidden p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Pesquisar"
          >
            <span className="text-sm">🔍</span>
          </button>

          {/* Desktop Quick Global Search Input with Floating Panel */}
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

            {renderSearchResultsPanel()}
          </div>

          {/* Notifications Dropdown */}
          <NotificationDropdown />

          {/* User Profile Avatar Menu */}
          <UserMenuDropdown />
        </div>
      </header>

      {/* Expandable Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div ref={mobileSearchRef} className="sm:hidden px-4 py-2 bg-[#191926] border-b border-slate-800 relative z-30 animate-in slide-in-from-top duration-150">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Pesquisar clientes, produtos, vendas..."
              value={globalSearch}
              autoFocus
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setIsDropdownOpen(true);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-400 rounded-lg pl-7 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
          {renderSearchResultsPanel()}
        </div>
      )}

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

