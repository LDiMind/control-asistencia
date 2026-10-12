export type EstadoAsistencia = 
  | 'puntual'
  | 'tarde'
  | 'falta_injustificada'
  | 'falta_justificada'
  | 'franco'
  | 'pendiente';

export interface Empleado {
  id: string;
  nombre: string;
  legajo: string;
  cargo: string;
  foto_url?: string;
  telefono?: string;
  activo?: boolean;
}

export interface HorarioAsignado {
  id: string;
  empleado_id: string;
  fecha: string; // YYYY-MM-DD
  hora_entrada_programada: string; // HH:mm
  hora_salida_programada: string; // HH:mm
  es_franco: boolean;
  horas_programadas?: number;
}

export interface Asistencia {
  id: string;
  empleado_id: string;
  fecha: string; // YYYY-MM-DD
  hora_ingreso_real?: string; // HH:mm
  hora_egreso_real?: string; // HH:mm
  horas_extras: number; // decimal hours
  estado: EstadoAsistencia;
  observaciones?: string;
  certificado_url?: string;
  minutos_tarde?: number;
  horas_trabajadas?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export type TabType = 'personal' | 'asistencia' | 'horarios' | 'calendario' | 'reportes';

export type UserRole = 'admin' | 'supervisor' | 'empleado';

export interface DateRangeFilter {
  tipo: 'hoy' | 'semanal' | 'quincenal' | 'mensual' | 'personalizado';
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}
