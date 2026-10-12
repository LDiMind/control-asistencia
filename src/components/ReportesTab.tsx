import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  User, 
  TrendingUp, 
  Clock, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Filter,
  Sparkles
} from 'lucide-react';
import { Empleado, HorarioAsignado, Asistencia, DateRangeFilter } from '../types';
import { exportAttendanceToExcel } from '../lib/excelExport';
import { getTodayString, calculateHoursBetween } from '../lib/timeCalculations';

interface ReportesTabProps {
  empleados: Empleado[];
  horarios: HorarioAsignado[];
  asistencias: Asistencia[];
}

export const ReportesTab: React.FC<ReportesTabProps> = ({
  empleados,
  horarios,
  asistencias,
}) => {
  const today = new Date();
  const todayStr = getTodayString();

  // Range type state
  const [filterType, setFilterType] = useState<DateRangeFilter['tipo']>('mensual');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('todos');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Custom date inputs
  const currentMonthStart = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;
  const [customDesde, setCustomDesde] = useState(currentMonthStart);
  const [customHasta, setCustomHasta] = useState(todayStr);

  // Compute active date range based on filterType
  const getComputedRange = (): { desde: string; hasta: string } => {
    const y = today.getFullYear();
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const d = today.getDate().toString().padStart(2, '0');

    if (filterType === 'hoy') {
      return { desde: todayStr, hasta: todayStr };
    }

    if (filterType === 'semanal') {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 6);
      const pastY = past7.getFullYear();
      const pastM = (past7.getMonth() + 1).toString().padStart(2, '0');
      const pastD = past7.getDate().toString().padStart(2, '0');
      return { desde: `${pastY}-${pastM}-${pastD}`, hasta: todayStr };
    }

    if (filterType === 'quincenal') {
      const dayNum = today.getDate();
      if (dayNum <= 15) {
        return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-15` };
      } else {
        const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
        return { desde: `${y}-${m}-16`, hasta: `${y}-${m}-${lastDay}` };
      }
    }

    if (filterType === 'mensual') {
      const lastDay = new Date(y, today.getMonth() + 1, 0).getDate();
      return { desde: `${y}-${m}-01`, hasta: `${y}-${m}-${lastDay}` };
    }

    // Personalizado
    return { desde: customDesde, hasta: customHasta };
  };

  const activeRange = getComputedRange();

  // Filter records within range
  const filteredAsistencias = asistencias.filter((a) => {
    const inRange = a.fecha >= activeRange.desde && a.fecha <= activeRange.hasta;
    const inEmp = selectedEmpId === 'todos' || a.empleado_id === selectedEmpId;
    return inRange && inEmp;
  });

  // KPI Calculations
  let totalHoras = 0;
  let totalExtras = 0;
  let totalPuntuales = 0;
  let totalTardes = 0;
  let totalMinutosTarde = 0;
  let totalFaltasJust = 0;
  let totalFaltasInjust = 0;
  let totalFrancos = 0;

  filteredAsistencias.forEach((a) => {
    if (a.estado === 'puntual') totalPuntuales++;
    if (a.estado === 'tarde') {
      totalTardes++;
      totalMinutosTarde += a.minutos_tarde || 0;
    }
    if (a.estado === 'falta_justificada') totalFaltasJust++;
    if (a.estado === 'falta_injustificada') totalFaltasInjust++;
    if (a.estado === 'franco') totalFrancos++;

    if (a.hora_ingreso_real && a.hora_egreso_real) {
      totalHoras += calculateHoursBetween(a.hora_ingreso_real, a.hora_egreso_real);
    }
    totalExtras += Number(a.horas_extras) || 0;
  });

  const totalDiasLaborales = totalPuntuales + totalTardes + totalFaltasJust + totalFaltasInjust;
  const puntualidadPct = totalDiasLaborales > 0
    ? Math.round((totalPuntuales / totalDiasLaborales) * 100)
    : 100;

  // Handle Export to Excel via SheetJS
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const filterConfig: DateRangeFilter = {
        tipo: filterType,
        desde: activeRange.desde,
        hasta: activeRange.hasta,
      };

      exportAttendanceToExcel({
        empleados,
        horarios,
        asistencias,
        filtro: filterConfig,
        empleadoFiltroId: selectedEmpId,
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err: any) {
      alert('Error generando Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Auditoría & Liquidación
            </span>
          </div>
          <h2 className="text-xl font-black">Reportes y Exportación Excel</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Filtra por período y descarga planillas formales con horas extras y tardanzas.
          </p>
        </div>
      </div>

      {/* Date Range & Filter Controls */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Rango de Fechas
          </span>
          <span className="text-[10px] font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
            {activeRange.desde} al {activeRange.hasta}
          </span>
        </div>

        {/* Quick Range Buttons */}
        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          {(
            [
              { id: 'hoy', label: 'Diario (Hoy)' },
              { id: 'semanal', label: 'Semanal (7d)' },
              { id: 'quincenal', label: 'Quincenal' },
              { id: 'mensual', label: 'Mes Completo' },
              { id: 'personalizado', label: 'Personalizado' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`py-2 px-1 rounded-xl text-center border transition active:scale-95 ${
                filterType === btn.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {filterType === 'personalizado' && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Desde:
              </label>
              <input
                type="date"
                value={customDesde}
                onChange={(e) => setCustomDesde(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Hasta:
              </label>
              <input
                type="date"
                value={customHasta}
                onChange={(e) => setCustomHasta(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Employee Filter */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Empleado:</span>
          </div>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="todos">Todos los Empleados ({empleados.length})</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} ({emp.legajo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Horas Trabajadas */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Horas Totales</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-slate-900 leading-none">
            {Math.round(totalHoras * 10) / 10}h
          </span>
          <span className="text-[10px] text-slate-600 block mt-1">Registradas en el rango</span>
        </div>

        {/* Horas Extras */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Horas Extras</span>
            <Flame className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-xl font-black text-purple-700 leading-none">
            +{Math.round(totalExtras * 10) / 10}h
          </span>
          <span className="text-[10px] text-slate-600 block mt-1">Adicionales acumuladas</span>
        </div>

        {/* Puntualidad */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Puntualidad</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-700 leading-none">
            {puntualidadPct}%
          </span>
          <span className="text-[10px] text-slate-600 block mt-1">
            {totalPuntuales} de {totalDiasLaborales} días
          </span>
        </div>

        {/* Tardanzas */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Tardanzas</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xl font-black text-rose-700 leading-none">
            {totalTardes}
          </span>
          <span className="text-[10px] text-slate-600 block mt-1">
            {totalMinutosTarde} min acumulados
          </span>
        </div>

        {/* Ausencias Justificadas */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Faltas Médicas</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-xl font-black text-sky-700 leading-none">
            {totalFaltasJust}
          </span>
          <span className="text-[10px] text-slate-600 block mt-1">Con certificado</span>
        </div>

        {/* Faltas Injustificadas */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] uppercase font-bold">Injustificadas</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-xl font-black text-red-700 leading-none">
            {totalFaltasInjust}
          </span>
          <span className="text-[10px] text-slate-600 block mt-1">Sin justificar</span>
        </div>
      </div>

      {/* Primary Excel Download Button (SheetJS Integration) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-lg text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-black text-slate-900 text-base">
            Descargar Reporte en Excel (.xlsx)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Genera un archivo compatible con Microsoft Excel y Google Sheets listo para presentar.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generando Excel...' : 'Descargar Archivo Excel'}</span>
        </button>

        {exportSuccess && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl border border-emerald-200 animate-fade-in flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>¡Archivo Excel descargado con éxito!</span>
          </div>
        )}
      </div>

      {/* Preview Table of Records */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase">
            Vista Previa de Registros ({filteredAsistencias.length})
          </h4>
          <span className="text-[10px] text-slate-400">Orden cronológico</span>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
          {filteredAsistencias.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs font-medium">
              No hay asistencias registradas en este período.
            </p>
          ) : (
            filteredAsistencias.slice(0, 15).map((a) => {
              const emp = empleados.find((e) => e.id === a.empleado_id);
              return (
                <div key={a.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">
                      {emp?.nombre || 'Empleado'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {a.fecha} &bull; {a.hora_ingreso_real || '--:--'} a {a.hora_egreso_real || '--:--'}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        a.estado === 'puntual'
                          ? 'bg-emerald-50 text-emerald-700'
                          : a.estado === 'tarde'
                          ? 'bg-rose-50 text-rose-700'
                          : a.estado === 'falta_justificada'
                          ? 'bg-sky-50 text-sky-700'
                          : a.estado === 'falta_injustificada'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {a.estado.replace('_', ' ').toUpperCase()}
                    </span>
                    {Number(a.horas_extras) > 0 && (
                      <span className="block text-[10px] font-bold text-purple-700">
                        +{a.horas_extras}h extras
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
