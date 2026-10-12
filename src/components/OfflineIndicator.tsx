import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-slate-900/90 text-amber-300 px-4 py-1.5 text-xs font-semibold shadow-xl border border-amber-400/30 backdrop-blur-md animate-bounce">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Modo Sin Conexión — Datos guardados localmente</span>
    </div>
  );
};
