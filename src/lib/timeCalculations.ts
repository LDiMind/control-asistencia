import { EstadoAsistencia, HorarioAsignado } from '../types';

/**
 * Converts "HH:mm" or "HH:mm:ss" to total minutes from midnight
 */
export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight to "HH:mm" string
 */
export function minutesToTime(totalMinutes: number): string {
  const norm = (totalMinutes % 1440 + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const minutes = norm % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculates duration in hours between two HH:mm strings (handles overnight shift)
 */
export function calculateHoursBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin < startMin) {
    // Crosses midnight
    endMin += 1440;
  }
  const diffMinutes = endMin - startMin;
  return Math.round((diffMinutes / 60) * 100) / 100;
}

/**
 * Calculates tardiness in minutes.
 * If real entry is later than scheduled entry (beyond optional 5 min grace), returns minutes late.
 */
export function calculateTardiness(
  scheduledEntry?: string,
  realEntry?: string,
  graceMinutes: number = 5
): number {
  if (!scheduledEntry || !realEntry) return 0;
  const scheduledMin = timeToMinutes(scheduledEntry);
  const realMin = timeToMinutes(realEntry);
  const diff = realMin - scheduledMin;
  if (diff > graceMinutes) {
    return diff;
  }
  return 0;
}

/**
 * Computes overtime hours:
 * 1. If scheduled exit exists, any time worked after scheduled exit.
 * 2. Or if total hours worked exceeds scheduled total hours.
 */
export function calculateOvertime(
  scheduledEntry?: string,
  scheduledExit?: string,
  realEntry?: string,
  realExit?: string
): number {
  if (!realEntry || !realExit) return 0;

  // Real duration in hours
  const realHours = calculateHoursBetween(realEntry, realExit);

  if (!scheduledEntry || !scheduledExit) {
    // If no schedule (e.g. work on a day off), all hours are overtime if > 0
    return realHours;
  }

  const scheduledHours = calculateHoursBetween(scheduledEntry, scheduledExit);
  
  // Method: if real hours exceeded scheduled hours by at least 15 minutes (0.25h)
  const diff = realHours - scheduledHours;
  if (diff >= 0.25) {
    return Math.round(diff * 100) / 100;
  }

  return 0;
}

/**
 * Automatically evaluates attendance status based on inputs
 */
export function evaluateStatus(params: {
  isFranco?: boolean;
  realEntry?: string;
  realExit?: string;
  scheduledEntry?: string;
  hasMedicalCertificate?: boolean;
  manualStatus?: EstadoAsistencia;
  dateStr: string;
}): EstadoAsistencia {
  const { isFranco, realEntry, scheduledEntry, hasMedicalCertificate, manualStatus, dateStr } = params;

  // If user set a specific manual status, respect justified absence or custom
  if (manualStatus === 'falta_justificada' || hasMedicalCertificate) {
    return 'falta_justificada';
  }

  if (isFranco) {
    return 'franco';
  }

  const today = new Date().toISOString().split('T')[0];
  const isFuture = dateStr > today;

  if (isFuture) {
    return 'pendiente';
  }

  if (!realEntry) {
    // Today might still be pending if workday hasn't passed, or absent
    if (dateStr === today) {
      return manualStatus === 'falta_injustificada' ? 'falta_injustificada' : 'pendiente';
    }
    return 'falta_injustificada';
  }

  // Real entry exists: check if tardy
  const lateMin = calculateTardiness(scheduledEntry, realEntry, 5);
  if (lateMin > 0) {
    return 'tarde';
  }

  return 'puntual';
}

/**
 * Returns formatted date in Spanish: "Lunes 12 de Octubre"
 */
export function formatDateSpanish(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns short date: "Lun 12/10"
 */
export function formatShortDateSpanish(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
    return `${dayName} ${d}/${m}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns YYYY-MM-DD for today in local timezone
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns default shift presets
 */
export const SHIFT_PRESETS = [
  { id: 'manana', label: 'Turno Mañana (08:00 - 16:00)', start: '08:00', end: '16:00', hours: 8 },
  { id: 'tarde', label: 'Turno Tarde (14:00 - 22:00)', start: '14:00', end: '22:00', hours: 8 },
  { id: 'noche', label: 'Turno Noche (22:00 - 06:00)', start: '22:00', end: '06:00', hours: 8 },
  { id: 'oficina', label: 'Horario Comercial (09:00 - 18:00)', start: '09:00', end: '18:00', hours: 9 },
  { id: 'medio', label: 'Media Jornada (08:00 - 12:00)', start: '08:00', end: '12:00', hours: 4 },
];
