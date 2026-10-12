import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Layers, 
  Code, 
  Terminal,
  RefreshCw,
  Server
} from 'lucide-react';
import { 
  SUPABASE_SQL_SCRIPT, 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabase';
import { resetLocalData } from '../lib/storage';

interface SupabaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseGuideModal: React.FC<SupabaseGuideModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [activeTab, setActiveTab] = useState<'conexion' | 'sql' | 'guia'>('conexion');

  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url.trim(), anonKey.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error de conexión' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = () => {
    saveStoredSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: Boolean(url.trim() && anonKey.trim()),
    });
    onConfigUpdated();
    alert('Configuración guardada. La aplicación utilizará la base de datos Supabase.');
  };

  const handleResetData = () => {
    if (confirm('¿Restablecer la base de datos local con los empleados y registros iniciales?')) {
      resetLocalData();
      onConfigUpdated();
      alert('Datos locales restablecidos correctamente.');
      onClose();
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Integración Supabase & Despliegue
              </h3>
              <p className="text-xs text-indigo-200">
                Estructura de Base de Datos y Alojamiento Gratuito
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('conexion')}
            className={`pb-2.5 px-3 rounded-t-xl transition border-b-2 ${
              activeTab === 'conexion'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conexión Supabase
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 rounded-t-xl transition border-b-2 ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Script SQL (Tablas)
          </button>
          <button
            onClick={() => setActiveTab('guia')}
            className={`pb-2.5 px-3 rounded-t-xl transition border-b-2 ${
              activeTab === 'guia'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Guía Vercel / Netlify (Gratis)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: CONEXIÓN */}
          {activeTab === 'conexion' && (
            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 text-indigo-950">
                <p className="font-semibold mb-1">
                  💡 Modo Dual Inteligente:
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Esta aplicación funciona <strong>100% offline</strong> y guarda los datos de forma instantánea en tu dispositivo. Para conectar una base de datos centralizada en la nube con Supabase, ingresa las credenciales de tu proyecto a continuación.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzabcdefghijklm.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:bg-white focus:outline-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  La encuentras en tu panel de Supabase: <em>Project Settings &gt; API &gt; Project API keys (anon public)</em>.
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting || !url || !anonKey}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition active:scale-95 disabled:opacity-40"
                >
                  {isTesting ? 'Probando conexión...' : 'Probar Conexión'}
                </button>
                <button
                  onClick={handleSaveConnection}
                  disabled={!url || !anonKey}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm active:scale-95 disabled:opacity-40"
                >
                  Guardar y Activar Supabase
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border font-medium ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              {/* Reset seed data button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Restablecer Datos Locales</span>
                  <span className="text-[11px] text-slate-500">Recargar nómina de empleados y asistencias de demostración.</span>
                </div>
                <button
                  onClick={handleResetData}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Restablecer
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCRIPT */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    Script DDL para Tablas de Supabase
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Copia y pega este script en el <strong>SQL Editor</strong> de Supabase.
                  </p>
                </div>
                <button
                  onClick={copySql}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl p-3.5 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-[50vh] border border-slate-800">
                <pre>{SUPABASE_SQL_SCRIPT}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: GUÍA DE DESPLIEGUE GRATUITO */}
          {activeTab === 'guia' && (
            <div className="space-y-4 text-xs text-slate-700">
              {/* 1-Click ZIP Download Callout */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">¿Dónde están los archivos para GitHub?</h4>
                    <p className="text-[11px] text-indigo-200">
                      Descárgalos con 1 solo clic en tu computadora directamente desde aquí:
                    </p>
                  </div>
                </div>

                <a
                  href="/control-asistencia.zip"
                  download="control-asistencia.zip"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 text-center"
                >
                  <Copy className="w-4 h-4" />
                  <span>📥 Descargar Archivos del Proyecto (.ZIP)</span>
                </a>

                <p className="text-[10px] text-indigo-200 text-center">
                  Una vez descargado, descomprímelo en tu computadora y arrastra su contenido a GitHub.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                  Paso a Paso: Subir los Archivos a GitHub
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                  <li>Haz clic arriba en el botón verde <strong>"Descargar Archivos del Proyecto (.ZIP)"</strong>. Se guardará un archivo llamado <code>control-asistencia.zip</code> en tu carpeta de Descargas.</li>
                  <li>Ve a tu carpeta de Descargas en tu PC, haz clic derecho sobre <code>control-asistencia.zip</code> y elige <strong>"Extraer todo..."</strong> o <strong>"Descomprimir"</strong>.</li>
                  <li>Abre tu nuevo repositorio en <strong>GitHub</strong> en el navegador.</li>
                  <li>Haz clic en el botón <strong>"Add file"</strong> y elige <strong>"Upload files"</strong>.</li>
                  <li>Selecciona y arrastra <strong>todos los archivos y carpetas descomprimidos</strong> al recuadro de GitHub.</li>
                  <li>Baja hasta el final y haz clic en el botón verde <strong>"Commit changes"</strong>. ¡Listo! Tus archivos ya están en GitHub.</li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                  Conectar con Vercel (Poner la App en Internet)
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                  <li>Entra a <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">vercel.com</a> e inicia sesión con tu cuenta de GitHub.</li>
                  <li>Haz clic en <strong>"Add New..." &gt; "Project"</strong>.</li>
                  <li>Verás tu repositorio de GitHub recién creado. Haz clic en <strong>"Import"</strong>.</li>
                  <li>En <strong>Environment Variables</strong> (opcional), añade tus claves de Supabase:
                    <ul className="list-disc list-inside pl-4 text-slate-500 font-mono text-[10px] mt-0.5">
                      <li><code>VITE_SUPABASE_URL</code></li>
                      <li><code>VITE_SUPABASE_ANON_KEY</code></li>
                    </ul>
                  </li>
                  <li>Haz clic en <strong>Deploy</strong>. En 45 segundos Vercel te dará tu enlace web gratis (HTTPS).</li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs">3</span>
                  Instalación en tu Teléfono Móvil (PWA)
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Abre el enlace que te dio Vercel en tu teléfono:
                  <br />
                  &bull; <strong>En Android:</strong> Toca el botón <em>Instalar</em> que aparece en la parte superior de la aplicación.
                  <br />
                  &bull; <strong>En iPhone (Safari):</strong> Toca el botón de <em>Compartir</em> y luego <em>"Agregar a pantalla de inicio"</em>.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
