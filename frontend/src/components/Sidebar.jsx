import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const navItems = [
    { label: 'Home', path: '/dashboard', icon: '🏠' },
    { label: 'Vendas', path: '/vendas', icon: '🛒' },
    { label: 'Financeiro', path: '/financeiro', icon: '💰' },
    { label: 'Clientes', path: '/clientes', icon: '👥' },
    { label: 'Produtos', path: '/produtos', icon: '📦' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#1E1E2D] text-slate-300 min-h-[calc(100vh-56px)] border-r border-slate-800/80 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <nav className="flex-1 py-4 space-y-1">
        {!isCollapsed && (
          <div className="px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Principal
          </div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 text-xs font-semibold transition-all duration-150 relative ${
                isActive
                  ? 'border-l-2 border-emerald-400 text-white bg-white/5'
                  : 'border-l-2 border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse / Expand Toggle Button */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="text-[10px] text-slate-500 font-mono">v1.0.0 (Dev)</div>
        )}
        <button
          onClick={onToggleCollapse}
          className="w-full md:w-auto p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center text-xs font-bold"
          title={isCollapsed ? 'Expandir Menu' : 'Colapsar Menu'}
        >
          {isCollapsed ? '➔' : '← Colapsar'}
        </button>
      </div>
    </aside>
  );
}
