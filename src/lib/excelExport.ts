import * as XLSX from 'xlsx';
import { Empleado, HorarioAsignado, Asistencia, DateRangeFilter } from '../types';
import { formatDateSpanish, formatShortDateSpanish, calculateTardiness, calculateHoursBetween } from './timeCalculations';

export interface ExportReportParams {
  empleados: Empleado[];
  horarios: HorarioAsignado[];
  asistencias: Asistencia[];
  filtro: DateRangeFilter;
  empleadoFiltroId?: string; // 'todos' or specific employee id
}

export function exportAttendanceToExcel(params: ExportReportParams): void {
  const { empleados, horarios, asistencias, filtro, empleadoFiltroId } = params;

  // Filter employees
  const targetEmpleados = empleadoFiltroId && empleadoFiltroId !== 'todos'
    ? empleados.filter((e) => e.id === empleadoFiltroId)
    : empleados;

  // Filter records within date range
  const filteredAsistencias = asistencias.filter((a) => {
    const inDate = a.fecha >= filtro.desde && a.fecha <= filtro.hasta;
    const inEmp = targetEmpleados.some((e) => e.id === a.empleado_id);
    return inDate && inEmp;
  });

  // -------------------------------------------------------------
  // HOJA 1: RESUMEN EJECUTIVO POR EMPLEADO
  // -------------------------------------------------------------
  const summaryRows: any[] = [];

  // Title and header info
  summaryRows.push(['REPORTE DE ASISTENCIA Y CONTROL HORARIO']);
  summaryRows.push([`Rango: ${filtro.desde} al ${filtro.hasta} (${filtro.tipo.toUpperCase()})`]);
  summaryRows.push([`Fecha de Generación: ${new Date().toLocaleString('es-ES')}`]);
  summaryRows.push([]); // blank row

  // Table header
  summaryRows.push([
    'Legajo',
    'Empleado',
    'Cargo',
    'Días Puntuales',
    'Llegadas Tarde',
    'Minutos Tarde Totales',
    'Faltas Injustificadas',
    'Faltas Justificadas (Médicas)',
    'Días Francos',
    'Horas Trabajadas',
    'Horas Extras Totales',
  ]);

  let totalGeneralHoras = 0;
  let totalGeneralExtras = 0;
  let totalGeneralTardanzas = 0;
  let totalGeneralFaltasInjust = 0;
  let totalGeneralFaltasJust = 0;

  targetEmpleados.forEach((emp) => {
    const empRecords = filteredAsistencias.filter((a) => a.empleado_id === emp.id);

    let puntuales = 0;
    let tardes = 0;
    let minTarde = 0;
    let faltasInjust = 0;
    let faltasJust = 0;
    let francos = 0;
    let horasTrabajadas = 0;
    let horasExtras = 0;

    empRecords.forEach((rec) => {
      if (rec.estado === 'puntual') puntuales++;
      if (rec.estado === 'tarde') {
        tardes++;
        minTarde += rec.minutos_tarde || 0;
      }
      if (rec.estado === 'falta_injustificada') faltasInjust++;
      if (rec.estado === 'falta_justificada') faltasJust++;
      if (rec.estado === 'franco') francos++;

      if (rec.hora_ingreso_real && rec.hora_egreso_real) {
        horasTrabajadas += calculateHoursBetween(rec.hora_ingreso_real, rec.hora_egreso_real);
      }
      horasExtras += Number(rec.horas_extras) || 0;
    });

    totalGeneralHoras += horasTrabajadas;
    totalGeneralExtras += horasExtras;
    totalGeneralTardanzas += tardes;
    totalGeneralFaltasInjust += faltasInjust;
    totalGeneralFaltasJust += faltasJust;

    summaryRows.push([
      emp.legajo,
      emp.nombre,
      emp.cargo,
      puntuales,
      tardes,
      minTarde,
      faltasInjust,
      faltasJust,
      francos,
      Math.round(horasTrabajadas * 100) / 100,
      Math.round(horasExtras * 100) / 100,
    ]);
  });

  // Totals Row
  summaryRows.push([]);
  summaryRows.push([
    'TOTALES GENERALES',
    `${targetEmpleados.length} Empleados`,
    '',
    '',
    totalGeneralTardanzas,
    '',
    totalGeneralFaltasInjust,
    totalGeneralFaltasJust,
    '',
    Math.round(totalGeneralHoras * 100) / 100,
    Math.round(totalGeneralExtras * 100) / 100,
  ]);

  // -------------------------------------------------------------
  // HOJA 2: REGISTRO DIARIO DETALLADO
  // -------------------------------------------------------------
  const detailRows: any[] = [];
  detailRows.push(['DETALLE CRONOLÓGICO DE ASISTENCIA Y OBSERVACIONES']);
  detailRows.push([]);

  detailRows.push([
    'Fecha',
    'Día',
    'Legajo',
    'Empleado',
    'Cargo',
    'Horario Programado',
    'Ingreso Real',
    'Egreso Real',
    'Estado',
    'Min. Tarde',
    'Hs Extras',
    'Certificado Médico',
    'Observaciones',
  ]);

  // Sort chronological
  const sortedRecords = [...filteredAsistencias].sort((a, b) => a.fecha.localeCompare(b.fecha));

  sortedRecords.forEach((rec) => {
    const emp = empleados.find((e) => e.id === rec.empleado_id);
    const hor = horarios.find((h) => h.empleado_id === rec.empleado_id && h.fecha === rec.fecha);

    const programado = hor?.es_franco
      ? 'FRANCO'
      : hor?.hora_entrada_programada && hor?.hora_salida_programada
      ? `${hor.hora_entrada_programada} - ${hor.hora_salida_programada}`
      : 'No asignado';

    let estadoLabel = 'Pendiente';
    if (rec.estado === 'puntual') estadoLabel = 'Puntual';
    else if (rec.estado === 'tarde') estadoLabel = 'Llegada Tarde';
    else if (rec.estado === 'falta_justificada') estadoLabel = 'Falta Justificada';
    else if (rec.estado === 'falta_injustificada') estadoLabel = 'Falta Injustificada';
    else if (rec.estado === 'franco') estadoLabel = 'Día Franco';

    const [y, m, d] = rec.fecha.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });

    detailRows.push([
      rec.fecha,
      dayName.toUpperCase(),
      emp?.legajo || 'N/A',
      emp?.nombre || 'Desconocido',
      emp?.cargo || 'N/A',
      programado,
      rec.hora_ingreso_real || '--:--',
      rec.hora_egreso_real || '--:--',
      estadoLabel,
      rec.minutos_tarde || 0,
      Number(rec.horas_extras) || 0,
      rec.certificado_url ? 'SÍ (Adjunto)' : 'No',
      rec.observaciones || '',
    ]);
  });

  // Create workbook and add sheets
  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);

  // Column widths for clarity
  wsSummary['!cols'] = [
    { wch: 12 }, // Legajo
    { wch: 26 }, // Empleado
    { wch: 22 }, // Cargo
    { wch: 14 }, // Puntuales
    { wch: 14 }, // Tardes
    { wch: 20 }, // Minutos Tarde
    { wch: 20 }, // Faltas Injust
    { wch: 24 }, // Faltas Just
    { wch: 14 }, // Francos
    { wch: 16 }, // Hs Trabajadas
    { wch: 18 }, // Hs Extras
  ];

  wsDetail['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 8 },  // Dia
    { wch: 12 }, // Legajo
    { wch: 26 }, // Empleado
    { wch: 22 }, // Cargo
    { wch: 18 }, // Programado
    { wch: 12 }, // Ingreso
    { wch: 12 }, // Egreso
    { wch: 18 }, // Estado
    { wch: 12 }, // Min Tarde
    { wch: 10 }, // Hs Extras
    { wch: 18 }, // Certificado
    { wch: 35 }, // Observaciones
  ];

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen General');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle de Asistencias');

  // Trigger download with date stamp
  const fileName = `Control_Asistencia_${filtro.desde}_al_${filtro.hasta}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
