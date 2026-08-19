import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Preference filter helper
  const getPrefs = () => {
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
    };
  };

  const [prefs, setPrefs] = useState(getPrefs);

  // Initial notifications list
  const [rawNotifications, setRawNotifications] = useState([
    {
      id: 1,
      tipo: 'cobranca',
      icon: '🔴',
      titulo: 'Cobrança Vencida',
      descricao: 'Parcela de R$ 1.250,00 da empresa Silva & Cia venceu ontem.',
      timestamp: 'há 10 min',
      lida: false,
      link: '/financeiro',
    },
    {
      id: 2,
      tipo: 'meta',
      icon: '🎯',
      titulo: 'Meta de Faturamento Atingida!',
      descricao: 'Parabéns! A meta mensal de R$ 250.000,00 foi ultrapassada.',
      timestamp: 'há 2 horas',
      lida: false,
      link: '/dashboard',
    },
    {
      id: 3,
      tipo: 'estoque',
      icon: '📦',
      titulo: 'Estoque Baixo',
      descricao: 'Estopa Branca Premium 1kg atingiu o nível crítico (3 un).',
      timestamp: 'há 4 horas',
      lida: false,
      link: '/produtos',
    },
    {
      id: 4,
      tipo: 'cliente',
      icon: '👥',
      titulo: 'Novo Cliente Cadastrado',
      descricao: 'Mecânica Express Eireli foi cadastrado no sistema.',
      timestamp: 'ontem',
      lida: true,
      link: '/clientes',
    },
    {
      id: 5,
      tipo: 'venda',
      icon: '🛒',
      titulo: 'Venda Pendente de Confirmação',
      descricao: 'Venda #103 no valor de R$ 3.400,00 aguarda aprovação.',
      timestamp: 'ontem',
      lida: true,
      link: '/vendas',
    },
  ]);

  // Listen for preference updates
  useEffect(() => {
    const handleNotifPrefsUpdate = () => {
      setPrefs(getPrefs());
    };
    window.addEventListener('notif-prefs-updated', handleNotifPrefsUpdate);
    return () => window.removeEventListener('notif-prefs-updated', handleNotifPrefsUpdate);
  }, []);

  // Fetch from API if backend is available
  useEffect(() => {
    async function fetchNotificacoes() {
      try {
        const res = await api.get('/notificacoes');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setRawNotifications(res.data);
        }
      } catch {
        // Keeps mock notifications when API is not available
      }
    }
    fetchNotificacoes();
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

  // Filter notifications according to active preferences
  const notifications = rawNotifications.filter((n) => {
    if (n.tipo === 'cobranca' && prefs.cobrancas === false) return false;
    if (n.tipo === 'meta' && prefs.metas === false) return false;
    if (n.tipo === 'estoque' && prefs.estoque === false) return false;
    if (n.tipo === 'cliente' && prefs.novosClientes === false) return false;
    if (n.tipo === 'venda' && prefs.vendasPendentes === false) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    setRawNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    try {
      await api.patch(`/notificacoes/${id}/marcar-lida`);
    } catch {
      // Ignora
    }
  };

  const markAllAsRead = async () => {
    setRawNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    try {
      await api.post('/notificacoes/marcar-todas-lidas');
    } catch {
      // Ignora
    }
  };

  const handleNotificationClick = (item) => {
    setRawNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, lida: true } : n))
    );
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg active:scale-95 transition-all focus:outline-none"
        title="Notificações"
      >
        <span className="text-sm">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-[#1E1E2D] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1E1E2D] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-800">
          {/* Header */}
          <div className="p-3.5 bg-slate-900/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">Notificações</span>
              {unreadCount > 0 ? (
                <span className="bg-rose-500/20 text-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Todas lidas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Nenhuma notificação relevante no momento.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 flex items-start gap-3 hover:bg-slate-800/80 cursor-pointer transition-colors relative group ${
                    !item.lida ? 'bg-blue-950/20' : 'opacity-75'
                  }`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-bold ${
                          !item.lida ? 'text-slate-100' : 'text-slate-300'
                        }`}
                      >
                        {item.titulo}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {item.descricao}
                    </p>
                  </div>
                  {!item.lida && (
                    <button
                      onClick={(e) => markAsRead(item.id, e)}
                      title="Marcar como lida"
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-blue-400 p-1 transition-opacity"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-900/60 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/configuracoes');
              }}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-200"
            >
              ⚙️ Gerenciar preferências de notificação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
