import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Edit,
  Coffee
} from 'lucide-react';
import { Empleado, HorarioAsignado, Asistencia, EstadoAsistencia } from '../types';
import { formatDateSpanish, formatShortDateSpanish, calculateHoursBetween } from '../lib/timeCalculations';

interface CalendarioTabProps {
  empleados: Empleado[];
  horarios: HorarioAsignado[];
  asistencias: Asistencia[];
  onViewCertificate: (certUrl: string, empName: string, fecha: string, obs?: string) => void;
  onGoToAttendanceDate?: (dateStr: string, empId?: string) => void;
  initialSelectedEmpId?: string;
}

export const CalendarioTab: React.FC<CalendarioTabProps> = ({
  empleados,
  horarios,
  asistencias,
  onViewCertificate,
  onGoToAttendanceDate,
  initialSelectedEmpId,
}) => {
  // Calendar month & year state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-based
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialSelectedEmpId || empleados[0]?.id || ''
  );

  // Selected Day Detail Modal
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calculate days in month and starting day offset (0 = Mon, 6 = Sun)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // getDay(): 0 is Sunday. Convert to Monday=0, Sunday=6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  // Selected employee object
  const currentEmp = empleados.find((e) => e.id === selectedEmpId) || empleados[0];

  /**
   * Evaluates the color code rule for a day:
   * - Verde claro: Día trabajado / Puntual.
   * - Amarillo claro: Día pendiente / Turno futuro.
   * - Rojo claro: Falta no justificada o Llegada tarde.
   * - Azul/Rosa claro: Falta justificada (con imagen de certificado).
   * - Gris claro: Día Franco / Libre.
   */
  const getDayColorCode = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = dateStr > todayStr;

    const hor = horarios.find(
      (h) => h.empleado_id === selectedEmpId && h.fecha === dateStr
    );
    const asist = asistencias.find(
      (a) => a.empleado_id === selectedEmpId && a.fecha === dateStr
    );

    // 1. Gris claro: Día Franco / Libre
    if (hor?.es_franco || asist?.estado === 'franco') {
      return {
        bg: 'bg-slate-200/90 text-slate-800 border-slate-300',
        label: 'Franco / Libre',
        type: 'franco',
        badge: 'FRANCO',
      };
    }

    // 2. Azul / Rosa claro: Falta justificada (con certificado médico)
    if (asist?.estado === 'falta_justificada' || asist?.certificado_url) {
      return {
        bg: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
        label: 'Falta Justificada (Médica)',
        type: 'justificada',
        badge: 'MÉDICA',
      };
    }

    // 3. Rojo claro: Falta no justificada o Llegada tarde
    if (asist?.estado === 'falta_injustificada' || asist?.estado === 'tarde') {
      return {
        bg: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
        label: asist.estado === 'tarde' ? 'Llegada Tarde' : 'Falta Injustificada',
        type: 'rojo',
        badge: asist.estado === 'tarde' ? 'TARDE' : 'FALTA',
      };
    }

    // 4. Verde claro: Día trabajado / Puntual
    if (asist?.estado === 'puntual' || (asist?.hora_ingreso_real && !isFuture)) {
      return {
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        label: 'Día Trabajado / Puntual',
        type: 'puntual',
        badge: 'PUNTUAL',
      };
    }

    // 5. Amarillo claro: Día pendiente / Turno futuro
    if (isFuture || !asist || asist.estado === 'pendiente') {
      return {
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        label: 'Turno Futuro / Pendiente',
        type: 'pendiente',
        badge: 'PENDIENTE',
      };
    }

    // Fallback
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      label: 'Sin Registro',
      type: 'none',
      badge: '',
    };
  };

  // Selected Day Details for the Modal
  const selectedDayHor = selectedDayDate
    ? horarios.find((h) => h.empleado_id === selectedEmpId && h.fecha === selectedDayDate)
    : null;
  const selectedDayAsist = selectedDayDate
    ? asistencias.find((a) => a.empleado_id === selectedEmpId && a.fecha === selectedDayDate)
    : null;
  const selectedDayColor = selectedDayDate ? getDayColorCode(selectedDayDate) : null;

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4">
      {/* Header Selector Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-black text-slate-800">Calendario Mensual</h2>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
            Por Empleado
          </span>
        </div>

        {/* Employee Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <img
            src={currentEmp?.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt=""
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-white shrink-0"
          />
          <div className="flex-1 min-w-0">
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} ({emp.legajo})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 truncate">{currentEmp?.cargo}</p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-sm text-slate-800 tracking-tight">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Official Color Legend Card (Mandatory Rule) */}
      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 shadow-2xs">
        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 text-center">
          Código Oficial de Colores
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-emerald-200">
            <span className="w-3 h-3 rounded-md bg-emerald-200 border border-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-800 truncate">Verde: Trabajado / Puntual</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-200">
            <span className="w-3 h-3 rounded-md bg-amber-200 border border-amber-400 shrink-0" />
            <span className="font-semibold text-amber-800 truncate">Amarillo: Pendiente / Futuro</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-rose-200">
            <span className="w-3 h-3 rounded-md bg-rose-200 border border-rose-400 shrink-0" />
            <span className="font-semibold text-rose-800 truncate">Rojo: Tarde / Injustificada</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-sky-200">
            <span className="w-3 h-3 rounded-md bg-sky-200 border border-sky-400 shrink-0" />
            <span className="font-semibold text-sky-800 truncate">Azul: Falta Justificada (Cert.)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-300 col-span-2">
            <span className="w-3 h-3 rounded-md bg-slate-200 border border-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">Gris claro: Día Franco / Libre</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {daysOfWeek.map((day, i) => (
            <span
              key={i}
              className={`text-[11px] font-bold py-1 ${
                i >= 5 ? 'text-indigo-600' : 'text-slate-500'
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Days cells (Square Grid) */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty spacer cells before 1st of month */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-slate-50/50" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: totalDaysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const mStr = (currentMonth + 1).toString().padStart(2, '0');
            const dStr = dayNum.toString().padStart(2, '0');
            const dateStr = `${currentYear}-${mStr}-${dStr}`;

            const colorCode = getDayColorCode(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDayDate(dateStr)}
                className={`aspect-square rounded-2xl p-1 flex flex-col items-center justify-between transition-all duration-150 active:scale-90 border shadow-2xs ${colorCode.bg} ${
                  isToday ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
                }`}
                title={`${dayNum} de ${monthNames[currentMonth]}: ${colorCode.label}`}
              >
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-black leading-none">{dayNum}</span>
                  {colorCode.type === 'justificada' && (
                    <FileText className="w-3 h-3 text-sky-600" />
                  )}
                </div>

                <span className="text-[8px] font-mono font-bold tracking-tighter truncate w-full text-center leading-none">
                  {colorCode.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Day Detail Modal */}
      {selectedDayDate && selectedDayColor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Detalle de Fecha
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 capitalize">
                  {formatDateSpanish(selectedDayDate)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Banner */}
            <div className="mt-3.5 flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <img
                src={currentEmp?.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt=""
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-xs text-slate-900 block truncate">
                  {currentEmp?.nombre}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentEmp?.legajo} &bull; {currentEmp?.cargo}
                </span>
              </div>
            </div>

            {/* Status Highlight */}
            <div className={`mt-3 p-3 rounded-2xl border flex items-center gap-2.5 ${selectedDayColor.bg}`}>
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs font-bold block">{selectedDayColor.label}</span>
                <span className="text-[10px] opacity-80">
                  Estado registrado en el sistema
                </span>
              </div>
            </div>

            {/* Shift & Time Details */}
            <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Horario Programado:</span>
                <span className="font-bold text-slate-800">
                  {selectedDayHor?.es_franco
                    ? 'Día Franco'
                    : selectedDayHor?.hora_entrada_programada
                    ? `${selectedDayHor.hora_entrada_programada} a ${selectedDayHor.hora_salida_programada}`
                    : 'No programado'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Ingreso Real:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedDayAsist?.hora_ingreso_real || '--:--'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Egreso Real:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedDayAsist?.hora_egreso_real || '--:--'}
                </span>
              </div>

              {Number(selectedDayAsist?.minutos_tarde) > 0 && (
                <div className="flex items-center justify-between text-rose-700">
                  <span>Demora / Tardanza:</span>
                  <span className="font-bold font-mono">+{selectedDayAsist?.minutos_tarde} min</span>
                </div>
              )}

              {Number(selectedDayAsist?.horas_extras) > 0 && (
                <div className="flex items-center justify-between text-purple-700">
                  <span>Horas Extras:</span>
                  <span className="font-bold font-mono">+{selectedDayAsist?.horas_extras} hs</span>
                </div>
              )}

              {selectedDayAsist?.observaciones && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-0.5">
                    Observaciones:
                  </span>
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200">
                    {selectedDayAsist.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* Medical Certificate CTA if exists */}
            {selectedDayAsist?.certificado_url && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    const cert = selectedDayAsist.certificado_url!;
                    setSelectedDayDate(null);
                    onViewCertificate(
                      cert,
                      currentEmp.nombre,
                      selectedDayDate,
                      selectedDayAsist.observaciones
                    );
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Comprobante Médico Adjunto</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Go to edit attendance */}
            {onGoToAttendanceDate && (
              <div className="mt-3 pt-2">
                <button
                  onClick={() => {
                    onGoToAttendanceDate(selectedDayDate, selectedEmpId);
                    setSelectedDayDate(null);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Asistencia de este Día</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
