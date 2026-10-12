import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  Sparkles,
  Info,
  ExternalLink,
  Flame,
  Check,
  User
} from 'lucide-react';
import { Empleado, HorarioAsignado, Asistencia, EstadoAsistencia } from '../types';
import { 
  getTodayString, 
  formatDateSpanish, 
  calculateTardiness, 
  calculateOvertime, 
  calculateHoursBetween,
  evaluateStatus,
  minutesToTime
} from '../lib/timeCalculations';

interface AsistenciaTabProps {
  empleados: Empleado[];
  horarios: HorarioAsignado[];
  asistencias: Asistencia[];
  onSaveAsistencia: (asistencia: Asistencia) => Promise<void>;
  onViewCertificate: (certUrl: string, empName: string, fecha: string, obs?: string) => void;
  selectedEmpleadoId?: string;
  onClearSelectedEmpleado?: () => void;
}

export const AsistenciaTab: React.FC<AsistenciaTabProps> = ({
  empleados,
  horarios,
  asistencias,
  onSaveAsistencia,
  onViewCertificate,
  selectedEmpleadoId,
  onClearSelectedEmpleado,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activeEmpFilter, setActiveEmpFilter] = useState<string>(selectedEmpleadoId || 'todos');
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Quick Date Navigation
  const changeDateByDays = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const nextY = date.getFullYear();
    const nextM = (date.getMonth() + 1).toString().padStart(2, '0');
    const nextD = date.getDate().toString().padStart(2, '0');
    setSelectedDate(`${nextY}-${nextM}-${nextD}`);
  };

  const isToday = selectedDate === getTodayString();

  // Filter employees
  const targetEmpleados = activeEmpFilter !== 'todos'
    ? empleados.filter((e) => e.id === activeEmpFilter)
    : empleados;

  // Handler to update an attendance field
  const handleRecordChange = async (
    empId: string,
    updates: Partial<Asistencia>
  ) => {
    const current = asistencias.find(
      (a) => a.empleado_id === empId && a.fecha === selectedDate
    );
    const hor = horarios.find(
      (h) => h.empleado_id === empId && h.fecha === selectedDate
    );

    const baseRecord: Asistencia = current || {
      id: `asist-${empId}-${selectedDate}`,
      empleado_id: empId,
      fecha: selectedDate,
      horas_extras: 0,
      estado: hor?.es_franco ? 'franco' : 'pendiente',
    };

    const merged: Asistencia = {
      ...baseRecord,
      ...updates,
    };

    // Calculate tardiness & overtime if times changed
    const scheduledIn = hor?.hora_entrada_programada;
    const scheduledOut = hor?.hora_salida_programada;
    const realIn = merged.hora_ingreso_real;
    const realOut = merged.hora_egreso_real;

    if (realIn) {
      merged.minutos_tarde = calculateTardiness(scheduledIn, realIn, 5);
    } else {
      merged.minutos_tarde = 0;
    }

    if (realIn && realOut) {
      merged.horas_trabajadas = calculateHoursBetween(realIn, realOut);
      // If user did not manually force a different overtime, calculate
      merged.horas_extras = calculateOvertime(scheduledIn, scheduledOut, realIn, realOut);
    }

    // Auto-update status if user didn't explicitly pick a special status
    if (!updates.estado) {
      merged.estado = evaluateStatus({
        isFranco: hor?.es_franco,
        realEntry: merged.hora_ingreso_real,
        realExit: merged.hora_egreso_real,
        scheduledEntry: scheduledIn,
        hasMedicalCertificate: Boolean(merged.certificado_url),
        manualStatus: merged.estado,
        dateStr: selectedDate,
      });
    }

    await onSaveAsistencia(merged);
    setSavedSuccessId(empId);
    setTimeout(() => setSavedSuccessId(null), 2000);
  };

  // Image Upload handler (supports camera & file pick)
  const handleImageUpload = (
    empId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('La imagen no debe superar los 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      await handleRecordChange(empId, {
        certificado_url: base64Url,
        estado: 'falta_justificada', // auto assign justified absence
      });
    };
    reader.readAsDataURL(file);
  };

  // Quick punch now
  const handlePunchNow = (empId: string, type: 'ingreso' | 'egreso') => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    if (type === 'ingreso') {
      handleRecordChange(empId, { hora_ingreso_real: currentTime });
    } else {
      handleRecordChange(empId, { hora_egreso_real: currentTime });
    }
  };

  // Summary stats for selected date
  const dateRecords = asistencias.filter((a) => a.fecha === selectedDate);
  const totalPuntuales = dateRecords.filter((a) => a.estado === 'puntual').length;
  const totalTardes = dateRecords.filter((a) => a.estado === 'tarde').length;
  const totalMedicas = dateRecords.filter((a) => a.estado === 'falta_justificada').length;
  const totalInjust = dateRecords.filter((a) => a.estado === 'falta_injustificada').length;
  const totalFrancos = dateRecords.filter((a) => a.estado === 'franco').length;

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4">
      {/* Date Switcher Bar */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
            title="Día Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-bold text-sm text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium capitalize mt-0.5">
              {formatDateSpanish(selectedDate)}
            </p>
          </div>

          <button
            onClick={() => changeDateByDays(1)}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
            title="Día Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick today shortcut */}
        {!isToday && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 text-center">
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1 rounded-xl transition"
            >
              Ir a la fecha de Hoy
            </button>
          </div>
        )}
      </div>

      {/* Date Metrics Pill Ribbon */}
      <div className="grid grid-cols-5 gap-1.5 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl py-2 px-1">
          <span className="text-base font-black text-emerald-700 leading-none block">
            {totalPuntuales}
          </span>
          <span className="text-[9px] font-bold text-emerald-800 uppercase">Puntual</span>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-2xl py-2 px-1">
          <span className="text-base font-black text-rose-700 leading-none block">
            {totalTardes}
          </span>
          <span className="text-[9px] font-bold text-rose-800 uppercase">Tarde</span>
        </div>
        <div className="bg-sky-50 border border-sky-200 rounded-2xl py-2 px-1">
          <span className="text-base font-black text-sky-700 leading-none block">
            {totalMedicas}
          </span>
          <span className="text-[9px] font-bold text-sky-800 uppercase">Médica</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl py-2 px-1">
          <span className="text-base font-black text-red-700 leading-none block">
            {totalInjust}
          </span>
          <span className="text-[9px] font-bold text-red-800 uppercase">Falta</span>
        </div>
        <div className="bg-slate-100 border border-slate-200 rounded-2xl py-2 px-1">
          <span className="text-base font-black text-slate-700 leading-none block">
            {totalFrancos}
          </span>
          <span className="text-[9px] font-bold text-slate-800 uppercase">Franco</span>
        </div>
      </div>

      {/* Employee Filter dropdown */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>Filtrar:</span>
        </div>
        <select
          value={activeEmpFilter}
          onChange={(e) => setActiveEmpFilter(e.target.value)}
          className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none flex-1 text-right cursor-pointer"
        >
          <option value="todos">Todos los Empleados ({empleados.length})</option>
          {empleados.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre} ({emp.legajo})
            </option>
          ))}
        </select>
        {activeEmpFilter !== 'todos' && (
          <button
            onClick={() => {
              setActiveEmpFilter('todos');
              if (onClearSelectedEmpleado) onClearSelectedEmpleado();
            }}
            className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md hover:bg-slate-200"
          >
            Quitar
          </button>
        )}
      </div>

      {/* Attendance Cards by Employee */}
      <div className="space-y-4">
        {targetEmpleados.map((emp) => {
          const hor = horarios.find(
            (h) => h.empleado_id === emp.id && h.fecha === selectedDate
          );
          const asist = asistencias.find(
            (a) => a.empleado_id === emp.id && a.fecha === selectedDate
          );

          const isSavedJustNow = savedSuccessId === emp.id;
          const isFranco = hor?.es_franco || asist?.estado === 'franco';
          const scheduledText = hor?.es_franco
            ? 'DÍA FRANCO (Descanso)'
            : hor?.hora_entrada_programada && hor?.hora_salida_programada
            ? `Turno: ${hor.hora_entrada_programada} a ${hor.hora_salida_programada}`
            : 'Sin horario asignado';

          const minutosTarde = asist?.minutos_tarde || 0;
          const horasExtras = Number(asist?.horas_extras) || 0;
          const horasTrabajadas = asist?.horas_trabajadas || 0;

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-3xl p-4 border transition-all duration-200 relative shadow-[0_3px_14px_rgba(0,0,0,0.03)] ${
                isSavedJustNow
                  ? 'border-emerald-400 ring-2 ring-emerald-100'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start gap-3">
                <img
                  src={emp.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={emp.nombre}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {emp.nombre}
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {emp.legajo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-600 truncate">{scheduledText}</span>
                  </div>
                </div>
              </div>

              {/* Status & Alerts Bar */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Status Dropdown */}
                <div className="flex-1 min-w-[140px]">
                  <select
                    value={asist?.estado || (isFranco ? 'franco' : 'pendiente')}
                    onChange={(e) =>
                      handleRecordChange(emp.id, {
                        estado: e.target.value as EstadoAsistencia,
                      })
                    }
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold border transition ${
                      asist?.estado === 'puntual'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : asist?.estado === 'tarde'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : asist?.estado === 'falta_justificada'
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : asist?.estado === 'falta_injustificada'
                        ? 'bg-red-50 text-red-800 border-red-300'
                        : asist?.estado === 'franco'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="puntual">Puntual / Trabajado</option>
                    <option value="tarde">Llegada Tarde</option>
                    <option value="falta_justificada">Falta Justificada (Médica)</option>
                    <option value="falta_injustificada">Falta Injustificada</option>
                    <option value="franco">Día Franco / Libre</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>

                {/* Tardiness indicator */}
                {minutosTarde > 0 && (
                  <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    +{minutosTarde} min tarde
                  </span>
                )}

                {/* Overtime indicator */}
                {horasExtras > 0 && (
                  <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1">
                    <Flame className="w-3 h-3 text-purple-600" />
                    +{horasExtras}h extras
                  </span>
                )}

                {/* Effective hours indicator */}
                {horasTrabajadas > 0 && (
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-xl text-[10px] font-semibold">
                    {horasTrabajadas}h trabajadas
                  </span>
                )}
              </div>

              {/* Real In & Out Pickers */}
              <div className="mt-3.5 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Ingreso Real */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Ingreso Real
                      </label>
                      {isToday && (
                        <button
                          type="button"
                          onClick={() => handlePunchNow(emp.id, 'ingreso')}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Ahora
                        </button>
                      )}
                    </div>
                    <input
                      type="time"
                      value={asist?.hora_ingreso_real || ''}
                      onChange={(e) =>
                        handleRecordChange(emp.id, {
                          hora_ingreso_real: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-indigo-500 shadow-xs"
                    />
                  </div>

                  {/* Egreso Real */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Egreso Real
                      </label>
                      {isToday && (
                        <button
                          type="button"
                          onClick={() => handlePunchNow(emp.id, 'egreso')}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Ahora
                        </button>
                      )}
                    </div>
                    <input
                      type="time"
                      value={asist?.hora_egreso_real || ''}
                      onChange={(e) =>
                        handleRecordChange(emp.id, {
                          hora_egreso_real: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-indigo-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Overtime manual override (optional) */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-xs">
                  <span className="text-[11px] font-medium text-slate-500">
                    Horas extras calculadas / manuales:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="12"
                      value={asist?.horas_extras ?? 0}
                      onChange={(e) =>
                        handleRecordChange(emp.id, {
                          horas_extras: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right font-mono font-bold text-xs"
                    />
                    <span className="text-[11px] text-slate-500 font-semibold">hs</span>
                  </div>
                </div>
              </div>

              {/* Observaciones Free Text Module */}
              <div className="mt-3">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Observaciones / Justificación diaria
                </label>
                <textarea
                  rows={2}
                  value={asist?.observaciones || ''}
                  onChange={(e) =>
                    handleRecordChange(emp.id, {
                      observaciones: e.target.value,
                    })
                  }
                  placeholder="Detalles de demoras, licencias, avisos o tareas realizadas..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-500 transition resize-none"
                />
              </div>

              {/* Medical Certificate Image Attachment Section */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    Certificado Médico / Comprobante
                  </span>
                </div>

                {asist?.certificado_url ? (
                  /* Attached Certificate Preview Card */
                  <div className="mt-2 bg-sky-50/70 border border-sky-200 rounded-2xl p-2.5 flex items-center justify-between gap-3">
                    <div
                      onClick={() =>
                        onViewCertificate(
                          asist.certificado_url!,
                          emp.nombre,
                          selectedDate,
                          asist.observaciones
                        )
                      }
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 group"
                    >
                      <img
                        src={asist.certificado_url}
                        alt="Comprobante"
                        className="w-12 h-12 object-cover rounded-xl border border-sky-300 bg-white shadow-xs group-hover:scale-105 transition"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-sky-900 block truncate group-hover:text-sky-700">
                          Certificado adjunto
                        </span>
                        <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Toca para ver o ampliar
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRecordChange(emp.id, {
                          certificado_url: undefined,
                        })
                      }
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Quitar certificado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Upload Button and Trigger */
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-dashed border-slate-300 rounded-2xl py-2 px-3 text-center transition flex items-center justify-center gap-2 active:scale-95">
                      <Camera className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold">Tomar Foto o Subir Certificado</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleImageUpload(emp.id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Auto-saved feedback */}
              {isSavedJustNow && (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 py-1 rounded-xl">
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardado correctamente</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
