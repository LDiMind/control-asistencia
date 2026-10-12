import React, { useState } from 'react';
import { 
  CalendarClock, 
  Clock, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Coffee, 
  Check, 
  AlertCircle,
  Copy,
  Users
} from 'lucide-react';
import { Empleado, HorarioAsignado } from '../types';
import { 
  getTodayString, 
  formatDateSpanish, 
  SHIFT_PRESETS,
  calculateHoursBetween 
} from '../lib/timeCalculations';

interface HorariosTabProps {
  empleados: Empleado[];
  horarios: HorarioAsignado[];
  onSaveHorario: (horario: HorarioAsignado) => Promise<void>;
}

export const HorariosTab: React.FC<HorariosTabProps> = ({
  empleados,
  horarios,
  onSaveHorario,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedEmpId, setSelectedEmpId] = useState<string>(empleados[0]?.id || '');
  const [savedFeedback, setSavedFeedback] = useState(false);

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

  const currentHorario = horarios.find(
    (h) => h.empleado_id === selectedEmpId && h.fecha === selectedDate
  );

  const [entrada, setEntrada] = useState(currentHorario?.hora_entrada_programada || '08:00');
  const [salida, setSalida] = useState(currentHorario?.hora_salida_programada || '16:00');
  const [isFranco, setIsFranco] = useState(currentHorario?.es_franco || false);

  // Sync state whenever employee or date changes
  React.useEffect(() => {
    const found = horarios.find(
      (h) => h.empleado_id === selectedEmpId && h.fecha === selectedDate
    );
    if (found) {
      setEntrada(found.hora_entrada_programada || '08:00');
      setSalida(found.hora_salida_programada || '16:00');
      setIsFranco(found.es_franco);
    } else {
      setEntrada('08:00');
      setSalida('16:00');
      setIsFranco(false);
    }
  }, [selectedEmpId, selectedDate, horarios]);

  const handleApplyPreset = (start: string, end: string) => {
    setEntrada(start);
    setSalida(end);
    setIsFranco(false);
  };

  const handleSave = async (empIdToSave = selectedEmpId, dateToSave = selectedDate, franco = isFranco, inTime = entrada, outTime = salida) => {
    const hours = franco ? 0 : calculateHoursBetween(inTime, outTime);
    const newHorario: HorarioAsignado = {
      id: `hor-${empIdToSave}-${dateToSave}`,
      empleado_id: empIdToSave,
      fecha: dateToSave,
      hora_entrada_programada: franco ? '' : inTime,
      hora_salida_programada: franco ? '' : outTime,
      es_franco: franco,
      horas_programadas: hours,
    };

    await onSaveHorario(newHorario);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // Bulk Apply: Assign this shift to Monday-Friday of current week
  const handleApplyToWeek = async () => {
    if (!selectedEmpId) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);

    // Find Monday of current week
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    const promises = [];
    for (let i = 0; i < 5; i++) {
      const dCopy = new Date(monday);
      dCopy.setDate(monday.getDate() + i);
      const yStr = dCopy.getFullYear();
      const mStr = (dCopy.getMonth() + 1).toString().padStart(2, '0');
      const dStr = dCopy.getDate().toString().padStart(2, '0');
      const targetDate = `${yStr}-${mStr}-${dStr}`;
      promises.push(handleSave(selectedEmpId, targetDate, isFranco, entrada, salida));
    }

    await Promise.all(promises);
    alert('¡Turno aplicado exitosamente de Lunes a Viernes para el empleado seleccionado!');
  };

  // Bulk Apply to ALL employees for this date
  const handleApplyToAllEmployees = async () => {
    if (!confirm(`¿Asignar este mismo horario a TODOS los empleados para la fecha ${selectedDate}?`)) {
      return;
    }
    const promises = empleados.map((e) =>
      handleSave(e.id, selectedDate, isFranco, entrada, salida)
    );
    await Promise.all(promises);
    alert(`¡Horario asignado a ${empleados.length} empleados!`);
  };

  const selectedEmp = empleados.find((e) => e.id === selectedEmpId);
  const totalHoras = isFranco ? 0 : calculateHoursBetween(entrada, salida);

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-700 to-indigo-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock className="w-5 h-5 text-indigo-300" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              Planificación Operativa
            </span>
          </div>
          <h2 className="text-xl font-black">Asignación de Horarios</h2>
          <p className="text-xs text-indigo-200 mt-1">
            Configura turnos rotativos, días francos y jornadas laborales.
          </p>
        </div>
      </div>

      {/* Date Switcher */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-xs flex items-center justify-between gap-2">
        <button
          onClick={() => changeDateByDays(-1)}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-1.5">
            <Calendar className="w-4 h-4 text-violet-600" />
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
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Select Employee Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase">
          1. Selecciona el Empleado
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {empleados.map((emp) => {
            const isSelected = emp.id === selectedEmpId;
            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold shrink-0 transition active:scale-95 ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <img
                  src={emp.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="truncate max-w-[110px]">{emp.nombre.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shift Config Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase">
            2. Definir Horario para {selectedEmp?.nombre.split(' ')[0] || 'Empleado'}
          </label>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg">
            {isFranco ? '0 hs (Franco)' : `${totalHoras} hs programadas`}
          </span>
        </div>

        {/* Día Franco Toggle Button */}
        <div
          onClick={() => setIsFranco(!isFranco)}
          className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex items-center justify-between ${
            isFranco
              ? 'bg-slate-800 text-white border-slate-900 shadow-md'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Coffee className={`w-5 h-5 ${isFranco ? 'text-amber-300' : 'text-slate-400'}`} />
            <div>
              <span className="font-bold text-xs block">
                {isFranco ? 'Día Franco Asignado (Descanso)' : '¿Asignar como Día Franco?'}
              </span>
              <span className={`text-[10px] ${isFranco ? 'text-slate-300' : 'text-slate-400'}`}>
                {isFranco ? 'No requiere presentismo laboral' : 'Toca para marcar franco'}
              </span>
            </div>
          </div>
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isFranco ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        {/* If Not Franco: Show Presets & Custom Times */}
        {!isFranco && (
          <>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                Plantillas Rápidas de Turnos
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SHIFT_PRESETS.map((preset) => {
                  const isCurrent = entrada === preset.start && salida === preset.end;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.start, preset.end)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        isCurrent
                          ? 'bg-violet-50 border-violet-400 text-violet-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block truncate font-bold text-[11px]">{preset.label.split('(')[0]}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {preset.start} - {preset.end} ({preset.hours}h)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Hora Entrada Programada
                </label>
                <input
                  type="time"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-violet-500 shadow-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Hora Salida Programada
                </label>
                <input
                  type="time"
                  value={salida}
                  onChange={(e) => setSalida(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-violet-500 shadow-xs"
                />
              </div>
            </div>
          </>
        )}

        {/* Save button */}
        <div className="pt-2">
          <button
            onClick={() => handleSave()}
            className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Horario para este Día</span>
          </button>
        </div>

        {savedFeedback && (
          <p className="text-center text-xs font-bold text-emerald-600 animate-fade-in">
            ¡Horario guardado correctamente!
          </p>
        )}
      </div>

      {/* Bulk actions */}
      <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 space-y-2.5">
        <span className="text-[11px] font-bold text-slate-600 uppercase block">
          Acciones Masivas Rápidas
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleApplyToWeek}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex flex-col items-center justify-center text-center shadow-xs transition active:scale-95"
          >
            <Copy className="w-4 h-4 text-violet-600 mb-1" />
            <span>Copiar a Semana (Lun-Vie)</span>
          </button>

          <button
            onClick={handleApplyToAllEmployees}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex flex-col items-center justify-center text-center shadow-xs transition active:scale-95"
          >
            <Users className="w-4 h-4 text-indigo-600 mb-1" />
            <span>Asignar a Todos Hoy</span>
          </button>
        </div>
      </div>

      {/* Daily schedule overview for today */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase">
          Nómina y Turnos del Día ({formatDateSpanish(selectedDate)})
        </h4>
        <div className="divide-y divide-slate-100">
          {empleados.map((emp) => {
            const h = horarios.find(
              (item) => item.empleado_id === emp.id && item.fecha === selectedDate
            );

            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition ${
                  emp.id === selectedEmpId ? 'bg-violet-50/60 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={emp.foto_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt=""
                    className="w-7 h-7 rounded-xl object-cover"
                  />
                  <div className="truncate">
                    <span className="text-xs text-slate-800 font-bold block truncate">
                      {emp.nombre}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {emp.legajo}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {h?.es_franco ? (
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      Franco
                    </span>
                  ) : h?.hora_entrada_programada ? (
                    <span className="text-[11px] font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                      {h.hora_entrada_programada} - {h.hora_salida_programada}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-600 italic">Sin turno</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
