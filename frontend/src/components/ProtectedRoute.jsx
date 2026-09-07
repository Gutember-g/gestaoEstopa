import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAccessToken, setAccessToken, clearAccessToken } from '../services/authStore';
import api from '../services/api';

export default function ProtectedRoute({ children }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      // Se já temos um token válido em memória RAM
      if (getAccessToken()) {
        if (isMounted) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
        }
        return;
      }

      // Se não temos token em memória, tentar Silent Refresh via cookie HTTP-Only
      try {
        const tenantId = localStorage.getItem('tenantId') || 'empresa_demo';
        const res = await api.post('/auth/refresh', {}, {
          headers: { 'X-Tenant-ID': tenantId },
          withCredentials: true,
        });

        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          if (isMounted) {
            setIsAuthenticated(true);
          }
        } else {
          clearAccessToken();
          if (isMounted) {
            setIsAuthenticated(false);
          }
        }
      } catch {
        clearAccessToken();
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Enquanto estiver verificando a sessão, exibir um spinner limpo sem dar flash na tela protegida
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#1E1E2D] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
