import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { clearAccessToken } from '../services/authStore';
import { useToast } from '../context/ToastContext';

export default function UserMenuDropdown() {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const defaultUser = {
    nome: 'Gabriel Andrade',
    email: 'gabriel@flowerp.com.br',
    cargo: 'Administrador',
    avatar: '',
  };

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('flow_user_profile');
    if (saved) {
      try {
        return { ...defaultUser, ...JSON.parse(saved) };
      } catch {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  const loadUserProfile = async () => {
    const saved = localStorage.getItem('flow_user_profile');
    if (saved) {
      try {
        setUser((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        // Ignora
      }
    }
    try {
      const res = await api.get('/perfil');
      if (res.data) {
        setUser((prev) => ({ ...prev, ...res.data }));
      }
    } catch {
      // Fallback local mock
    }
  };

  useEffect(() => {
    loadUserProfile();

    const handleProfileUpdate = () => {
      loadUserProfile();
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignora erro se backend offline
    }
    clearAccessToken();
    showSuccess('Sessão encerrada com sucesso.');
    navigate('/login');
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
    <div ref={dropdownRef} className="relative">
      {/* Avatar Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none group cursor-pointer"
        title="Perfil do Usuário"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-xs text-white shadow-md ring-2 ring-blue-500/30 group-hover:ring-blue-400 transition-all overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
          ) : (
            getInitials(user.nome)
          )}
        </div>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1E1E2D] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-800">
          {/* User Info Header */}
          <div className="p-4 bg-slate-900/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
              ) : (
                getInitials(user.nome)
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-bold text-white text-xs truncate">{user.nome}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              <span className="inline-block mt-1 bg-blue-500/20 text-blue-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-blue-500/30">
                {user.cargo}
              </span>
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/perfil');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl font-semibold transition-colors"
            >
              <span className="text-sm">👤</span>
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/configuracoes');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl font-semibold transition-colors"
            >
              <span className="text-sm">⚙️</span>
              <span>Configurações</span>
            </button>
          </div>

          {/* Footer / Logout */}
          <div className="p-1.5 bg-slate-900/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl font-semibold transition-colors"
            >
              <span className="text-sm">🚪</span>
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
