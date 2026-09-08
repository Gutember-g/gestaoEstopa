import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { VendaModalProvider } from '../context/VendaModalContext';

export default function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  // Load and apply saved theme on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('flow_theme') || 'claro';
    const root = document.documentElement;

    if (savedTheme === 'escuro') {
      root.classList.add('dark');
    } else if (savedTheme === 'claro') {
      root.classList.remove('dark');
    } else if (savedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: '🏠' },
    { label: 'Vendas', path: '/vendas', icon: '🛒' },
    { label: 'Financeiro', path: '/financeiro', icon: '💰' },
    { label: 'Clientes', path: '/clientes', icon: '👥' },
    { label: 'Produtos', path: '/produtos', icon: '📦' },
  ];

  return (
    <VendaModalProvider>
      <div className="min-h-screen flex flex-col bg-[#F3F5F9] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        {/* Top Header h-14 */}
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Body Grid */}
        <div className="flex flex-1">
          {/* Collapsible Sidebar */}
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
            <Outlet context={{ activeTab }} />
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (h-16) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1E1E2D] border-t border-slate-800/80 flex justify-around items-center h-16 z-30 px-1 shadow-2xl">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400 font-bold border-t-2 border-emerald-400 -mt-0.5' : 'text-slate-400'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </VendaModalProvider>
  );
}
