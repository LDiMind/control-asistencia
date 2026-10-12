import { Empleado, HorarioAsignado, Asistencia, EstadoAsistencia } from '../types';
import { getSupabaseClient } from './supabase';
import { getTodayString, calculateTardiness, calculateOvertime } from './timeCalculations';

const KEY_EMPLEADOS = 'asistencia_empleados';
const KEY_HORARIOS = 'asistencia_horarios';
const KEY_ASISTENCIAS = 'asistencia_asistencias';

// Sample medical certificate image (clean high quality data URL or verified unDraw/document SVG image)
export const SAMPLE_CERTIFICATE_BASE64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="100%" height="100%" fill="%23fdfbf7"/><rect x="20" y="20" width="560" height="760" fill="none" stroke="%233b82f6" stroke-width="4" stroke-dasharray="8 4"/><text x="300" y="90" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="%231e3a8a" text-anchor="middle">CENTRO MÉDICO SAN MARTÍN</text><text x="300" y="125" font-family="Arial, sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">CERTIFICADO MÉDICO OFICIAL DE REPOSO LABORAL</text><line x1="60" y1="150" x2="540" y2="150" stroke="%23cbd5e1" stroke-width="2"/><text x="60" y="200" font-family="Arial, sans-serif" font-size="15" fill="%23334155">Fecha de Emisión: 10 de Octubre de 2026</text><text x="60" y="240" font-family="Arial, sans-serif" font-size="15" fill="%23334155">Paciente: Mariana Lucía Silva (Legajo: LEG-1002)</text><text x="60" y="280" font-family="Arial, sans-serif" font-size="15" fill="%23334155">Diagnóstico Clínico: Cuadro respiratorio agudo febril (CIE-10: J00)</text><text x="60" y="340" font-family="Arial, sans-serif" font-size="15" fill="%23334155">Indicación: Reposo médico laboral estricto por 48 horas.</text><rect x="60" y="400" width="480" height="180" rx="8" fill="%23f1f5f9"/><text x="80" y="440" font-family="Arial, sans-serif" font-size="14" fill="%23475569" font-weight="bold">Observaciones del Facultativo:</text><text x="80" y="475" font-family="Arial, sans-serif" font-size="13" fill="%2364748b">Tratamiento sintomático con antipiréticos e hidratación.</text><text x="80" y="505" font-family="Arial, sans-serif" font-size="13" fill="%2364748b">Apta para reincorporación al término del periodo indicado.</text><circle cx="430" cy="680" r="45" fill="none" stroke="%23ef4444" stroke-width="3" opacity="0.8"/><text x="430" y="675" font-family="Arial, sans-serif" font-size="12" fill="%23ef4444" font-weight="bold" text-anchor="middle">DR. H. RAMÍREZ</text><text x="430" y="695" font-family="Arial, sans-serif" font-size="10" fill="%23ef4444" text-anchor="middle">M.N. 129482</text><line x1="330" y1="720" x2="520" y2="720" stroke="%231e293b" stroke-width="2"/><text x="425" y="740" font-family="Arial, sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">Firma y Sello del Médico</text></svg>`;

export const SEED_EMPLEADOS: Empleado[] = [
  {
    id: 'emp-1',
    nombre: 'Carlos Alberto Gómez',
    legajo: 'LEG-1001',
    cargo: 'Técnico de Mantenimiento',
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    telefono: '+54 11 5521-8842',
    activo: true,
  },
  {
    id: 'emp-2',
    nombre: 'Mariana Lucía Silva',
    legajo: 'LEG-1002',
    cargo: 'Supervisora de Turno',
    foto_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    telefono: '+54 11 4412-9903',
    activo: true,
  },
  {
    id: 'emp-3',
    nombre: 'Juan Pablo Rossi',
    legajo: 'LEG-1003',
    cargo: 'Operador de Maquinaria',
    foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    telefono: '+54 11 6321-1194',
    activo: true,
  },
  {
    id: 'emp-4',
    nombre: 'Sofía Elena Morales',
    legajo: 'LEG-1004',
    cargo: 'Control de Calidad',
    foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    telefono: '+54 11 3901-7725',
    activo: true,
  },
  {
    id: 'emp-5',
    nombre: 'Diego Martín Castro',
    legajo: 'LEG-1005',
    cargo: 'Logística y Despacho',
    foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    telefono: '+54 11 2284-5511',
    activo: true,
  },
];

/**
 * Generates initial schedules and attendance for current month around today
 */
function generateInitialRecords(): { horarios: HorarioAsignado[]; asistencias: Asistencia[] } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based
  const currentDay = today.getDate();

  const horarios: HorarioAsignado[] = [];
  const asistencias: Asistencia[] = [];

  // Generate for days 1 to currentDay + 7
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const maxDay = Math.min(daysInMonth, currentDay + 7);

  for (let day = 1; day <= maxDay; day++) {
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Dom, 6 = Sab
    const yStr = year.toString();
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    const dateStr = `${yStr}-${mStr}-${dStr}`;

    SEED_EMPLEADOS.forEach((emp, empIdx) => {
      // Rotate rest days: Domingo is franco for most, or Sabado/Domingo
      const isFranco = (dayOfWeek === 0 && empIdx % 2 === 0) || (dayOfWeek === 6 && empIdx % 2 === 1);

      const horario: HorarioAsignado = {
        id: `hor-${emp.id}-${dateStr}`,
        empleado_id: emp.id,
        fecha: dateStr,
        hora_entrada_programada: isFranco ? '' : (empIdx % 2 === 0 ? '08:00' : '09:00'),
        hora_salida_programada: isFranco ? '' : (empIdx % 2 === 0 ? '16:00' : '17:00'),
        es_franco: isFranco,
        horas_programadas: isFranco ? 0 : 8,
      };
      horarios.push(horario);

      // Attendance records
      if (day < currentDay) {
        // Past days
        let estado: EstadoAsistencia = 'puntual';
        let horaIngreso = horario.hora_entrada_programada;
        let horaEgreso = horario.hora_salida_programada;
        let horasExtras = 0;
        let obs = '';
        let certUrl = undefined;

        if (isFranco) {
          estado = 'franco';
          horaIngreso = '';
          horaEgreso = '';
        } else {
          // Specific variations to demonstrate color codes & scenarios:
          if (emp.id === 'emp-2' && (day === currentDay - 1 || day === currentDay - 2)) {
            // Mariana Silva had medical leave
            estado = 'falta_justificada';
            horaIngreso = '';
            horaEgreso = '';
            obs = 'Presentó certificado médico por afección gripal (Dr. Ramírez)';
            certUrl = SAMPLE_CERTIFICATE_BASE64;
          } else if (emp.id === 'emp-3' && day === currentDay - 3) {
            // Juan Rossi was late
            estado = 'tarde';
            horaIngreso = '08:42'; // 42 min late
            horaEgreso = '16:00';
            obs = 'Demora en transporte público Línea 60';
          } else if (emp.id === 'emp-5' && day === currentDay - 2) {
            // Diego Castro absent unjustified
            estado = 'falta_injustificada';
            horaIngreso = '';
            horaEgreso = '';
            obs = 'Sin aviso previo';
          } else if (emp.id === 'emp-1' && day === currentDay - 1) {
            // Carlos Gómez worked 2 hours overtime
            estado = 'puntual';
            horaIngreso = '07:55';
            horaEgreso = '18:15';
            horasExtras = 2.25;
            obs = 'Reparación de urgencia en línea de envasado principal';
          } else {
            // Regular punctual
            estado = 'puntual';
            horaIngreso = horario.hora_entrada_programada;
            horaEgreso = horario.hora_salida_programada;
          }
        }

        asistencias.push({
          id: `asist-${emp.id}-${dateStr}`,
          empleado_id: emp.id,
          fecha: dateStr,
          hora_ingreso_real: horaIngreso,
          hora_egreso_real: horaEgreso,
          horas_extras: horasExtras,
          estado: estado,
          observaciones: obs,
          certificado_url: certUrl,
          minutos_tarde: estado === 'tarde' ? 42 : 0,
          horas_trabajadas: estado === 'puntual' || estado === 'tarde' ? (8 + horasExtras) : 0,
        });
      } else if (day === currentDay) {
        // TODAY
        if (isFranco) {
          asistencias.push({
            id: `asist-${emp.id}-${dateStr}`,
            empleado_id: emp.id,
            fecha: dateStr,
            estado: 'franco',
            horas_extras: 0,
            observaciones: 'Franco programado',
          });
        } else if (emp.id === 'emp-1') {
          // Already checked in today punctually
          asistencias.push({
            id: `asist-${emp.id}-${dateStr}`,
            empleado_id: emp.id,
            fecha: dateStr,
            hora_ingreso_real: '07:58',
            hora_egreso_real: '',
            horas_extras: 0,
            estado: 'puntual',
            observaciones: 'Ingreso puntual registrado',
          });
        } else if (emp.id === 'emp-2') {
          // Medical certificate continuation
          asistencias.push({
            id: `asist-${emp.id}-${dateStr}`,
            empleado_id: emp.id,
            fecha: dateStr,
            estado: 'falta_justificada',
            horas_extras: 0,
            observaciones: 'Reposo médico día 2 - Certificado adjunto',
            certificado_url: SAMPLE_CERTIFICATE_BASE64,
          });
        } else {
          // Pending for today
          asistencias.push({
            id: `asist-${emp.id}-${dateStr}`,
            empleado_id: emp.id,
            fecha: dateStr,
            estado: 'pendiente',
            horas_extras: 0,
          });
        }
      } else {
        // Future days
        asistencias.push({
          id: `asist-${emp.id}-${dateStr}`,
          empleado_id: emp.id,
          fecha: dateStr,
          estado: isFranco ? 'franco' : 'pendiente',
          horas_extras: 0,
        });
      }
    });
  }

  return { horarios, asistencias };
}

// ---------------------------------------------------------------------------
// DATA ACCESS FUNCTIONS
// ---------------------------------------------------------------------------

export async function fetchEmpleados(): Promise<Empleado[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('legajo', { ascending: true });
      if (!error && data && data.length > 0) {
        localStorage.setItem(KEY_EMPLEADOS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchEmpleados failed, falling back to local', e);
    }
  }

  const local = localStorage.getItem(KEY_EMPLEADOS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  // Seed default
  localStorage.setItem(KEY_EMPLEADOS, JSON.stringify(SEED_EMPLEADOS));
  return SEED_EMPLEADOS;
}

export async function saveEmpleado(empleado: Omit<Empleado, 'id'> & { id?: string }): Promise<Empleado> {
  const supabase = getSupabaseClient();
  const id = empleado.id || `emp-${Date.now()}`;
  const record: Empleado = {
    ...empleado,
    id,
    activo: empleado.activo !== undefined ? empleado.activo : true,
  };

  if (supabase) {
    try {
      await supabase.from('empleados').upsert(record);
    } catch (e) {
      console.warn('Supabase saveEmpleado failed', e);
    }
  }

  // Local storage update
  const current = await fetchEmpleados();
  const index = current.findIndex((e) => e.id === record.id);
  let updated: Empleado[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = record;
  } else {
    updated = [record, ...current];
  }
  localStorage.setItem(KEY_EMPLEADOS, JSON.stringify(updated));
  return record;
}

export async function deleteEmpleado(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('empleados').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase deleteEmpleado failed', e);
    }
  }
  const current = await fetchEmpleados();
  const updated = current.filter((e) => e.id !== id);
  localStorage.setItem(KEY_EMPLEADOS, JSON.stringify(updated));
}

export async function fetchHorarios(): Promise<HorarioAsignado[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('horarios_asignados').select('*');
      if (!error && data && data.length > 0) {
        localStorage.setItem(KEY_HORARIOS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchHorarios failed', e);
    }
  }

  const local = localStorage.getItem(KEY_HORARIOS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  const initial = generateInitialRecords();
  localStorage.setItem(KEY_HORARIOS, JSON.stringify(initial.horarios));
  localStorage.setItem(KEY_ASISTENCIAS, JSON.stringify(initial.asistencias));
  return initial.horarios;
}

export async function saveHorario(horario: HorarioAsignado): Promise<HorarioAsignado> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('horarios_asignados').upsert(horario);
    } catch (e) {
      console.warn('Supabase saveHorario failed', e);
    }
  }

  const current = await fetchHorarios();
  const index = current.findIndex(
    (h) => h.empleado_id === horario.empleado_id && h.fecha === horario.fecha
  );
  let updated: HorarioAsignado[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = horario;
  } else {
    updated = [...current, horario];
  }
  localStorage.setItem(KEY_HORARIOS, JSON.stringify(updated));
  return horario;
}

export async function fetchAsistencias(): Promise<Asistencia[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('asistencias').select('*');
      if (!error && data && data.length > 0) {
        localStorage.setItem(KEY_ASISTENCIAS, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetchAsistencias failed', e);
    }
  }

  const local = localStorage.getItem(KEY_ASISTENCIAS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // ignore
    }
  }

  const initial = generateInitialRecords();
  localStorage.setItem(KEY_HORARIOS, JSON.stringify(initial.horarios));
  localStorage.setItem(KEY_ASISTENCIAS, JSON.stringify(initial.asistencias));
  return initial.asistencias;
}

export async function saveAsistencia(asistencia: Asistencia): Promise<Asistencia> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('asistencias').upsert(asistencia);
    } catch (e) {
      console.warn('Supabase saveAsistencia failed', e);
    }
  }

  const current = await fetchAsistencias();
  const index = current.findIndex(
    (a) => a.empleado_id === asistencia.empleado_id && a.fecha === asistencia.fecha
  );
  let updated: Asistencia[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = asistencia;
  } else {
    updated = [...current, asistencia];
  }
  localStorage.setItem(KEY_ASISTENCIAS, JSON.stringify(updated));
  return asistencia;
}

/**
 * Resets local data to rich defaults
 */
export function resetLocalData(): void {
  localStorage.removeItem(KEY_EMPLEADOS);
  localStorage.removeItem(KEY_HORARIOS);
  localStorage.removeItem(KEY_ASISTENCIAS);
  const initial = generateInitialRecords();
  localStorage.setItem(KEY_EMPLEADOS, JSON.stringify(SEED_EMPLEADOS));
  localStorage.setItem(KEY_HORARIOS, JSON.stringify(initial.horarios));
  localStorage.setItem(KEY_ASISTENCIAS, JSON.stringify(initial.asistencias));
}
