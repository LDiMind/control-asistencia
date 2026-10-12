import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, FileText, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  empleadoNombre?: string;
  fecha?: string;
  observaciones?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  empleadoNombre,
  fecha,
  observaciones,
}) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `Certificado_${empleadoNombre?.replace(/\s+/g, '_') || 'Medico'}_${fecha || 'doc'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                Certificado Médico Adjunto
              </h3>
              <p className="text-xs text-sky-100">
                {empleadoNombre || 'Empleado'} &bull; {fecha || 'Fecha'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-95"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Observation banner */}
        {observaciones && (
          <div className="px-5 py-3 bg-sky-50 border-b border-sky-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <div className="text-xs text-sky-900">
              <span className="font-semibold">Diagnóstico / Motivo: </span>
              {observaciones}
            </div>
          </div>
        )}

        {/* Image Preview Container */}
        <div className="relative flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center min-h-[260px] max-h-[55vh]">
          {imageUrl ? (
            <div
              className="transition-transform duration-200 ease-out origin-center max-w-full"
              style={{ transform: `scale(${zoom})` }}
            >
              <img
                src={imageUrl}
                alt="Certificado Médico"
                className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No hay comprobante de imagen adjunto</p>
            </div>
          )}
        </div>

        {/* Toolbar Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setZoom((prev) => Math.max(0.7, prev - 0.2))}
              disabled={zoom <= 0.7}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-1 text-slate-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.2))}
              disabled={zoom >= 2.5}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-2">
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Descargar
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
