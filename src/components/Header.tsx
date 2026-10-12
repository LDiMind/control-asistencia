import React, { useState } from 'react';
import { Database, Download, ShieldCheck, Sparkles, UserCheck, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { UserRole } from '../types';

interface HeaderProps {
  userRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  onRoleChange,
  isSupabaseConnected,
  onOpenSupabaseModal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* App Title & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-[0_3px_10px_rgba(79,70,229,0.3)]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-sm tracking-tight text-slate-800">
                ASISTENCIA PRO
              </h1>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 tracking-wider">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-none">
              Control Mobile-First &bull; RRHH
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition shadow-xs active:scale-95 ${
              isSupabaseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Configuración de Supabase y Base de Datos"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Database className="w-3 h-3" />
            <span className="hidden sm:inline">
              {isSupabaseConnected ? 'Supabase' : 'Modo Local'}
            </span>
          </button>

          {/* SQL & Deploy Help */}
          <button
            onClick={onOpenSupabaseModal}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Guía de Instalación, SQL y Supabase"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* PWA Install Button if available */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs transition active:scale-95 animate-pulse"
              title="Instalar App en tu pantalla de inicio"
            >
              <Download className="w-3 h-3" />
              <span>Instalar</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSPrompt(true)}
              className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-[11px] font-semibold hover:bg-slate-200 transition"
              title="Instalar en iPhone"
            >
              <Download className="w-3 h-3" />
              <span>iOS</span>
            </button>
          )}

          {/* Role Pill Switcher */}
          <div className="relative group">
            <button
              onClick={() =>
                onRoleChange(userRole === 'admin' ? 'supervisor' : 'admin')
              }
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition"
              title="Alternar Rol Administrador / Supervisor"
            >
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              <span>{userRole === 'admin' ? 'Admin' : 'Superv.'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Instalar en tu iPhone o iPad</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              1. Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra de Safari.<br />
              2. Desplázate hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.<br />
              3. ¡Listo! Podrás usarla en pantalla completa como una app nativa.
            </p>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
