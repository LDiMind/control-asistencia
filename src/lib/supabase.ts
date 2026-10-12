import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_CONFIG = 'asistencia_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading Supabase config', e);
  }

  // Fallback to Vite env variables if provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey),
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (
    !supabaseInstance ||
    (supabaseInstance as any).supabaseUrl !== config.url
  ) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error('Failed to create Supabase client', e);
      return null;
    }
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL y Anon Key son obligatorias' };
  }

  try {
    const testClient = createClient(url, anonKey);
    // Simple query to verify connection
    const { data, error } = await testClient
      .from('empleados')
      .select('count', { count: 'exact', head: true });

    if (error) {
      // If table doesn't exist yet, it's connected to Supabase but tables need creating
      if (error.code === '42P01' || error.message.includes('relation "empleados" does not exist')) {
        return {
          success: true,
          message: '¡Conexión exitosa con Supabase! (Recuerda ejecutar el script SQL para crear las tablas).',
        };
      }
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: '¡Conexión establecida correctamente y tablas detectadas!',
    };
  } catch (err: any) {
    return { success: false, message: `Error de red o URL inválida: ${err.message || err}` };
  }
}

/**
 * Script SQL completo para Supabase (100% compatible con PostgreSQL)
 */
export const SUPABASE_SQL_SCRIPT = `-- ================================================================
-- SISTEMA DE CONTROL DE PERSONAL Y ASISTENCIA - SUPABASE SQL SCHEMA
-- ================================================================
-- Ejecuta este script completo en el "SQL Editor" de tu proyecto Supabase.

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla: empleados
CREATE TABLE IF NOT EXISTS public.empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    legajo TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL,
    foto_url TEXT,
    telefono TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla: horarios_asignados
CREATE TABLE IF NOT EXISTS public.horarios_asignados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada_programada TIME,
    hora_salida_programada TIME,
    es_franco BOOLEAN DEFAULT false,
    horas_programadas NUMERIC(4,2) DEFAULT 8.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empleado_id, fecha)
);

-- 4. Tabla: asistencias
CREATE TABLE IF NOT EXISTS public.asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empleado_id UUID NOT NULL REFERENCES public.empleados(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_ingreso_real TIME,
    hora_egreso_real TIME,
    horas_extras NUMERIC(5,2) DEFAULT 0.00,
    estado TEXT NOT NULL CHECK (estado IN ('puntual', 'tarde', 'falta_injustificada', 'falta_justificada', 'franco', 'pendiente')),
    observaciones TEXT,
    certificado_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(empleado_id, fecha)
);

-- 5. Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado ON public.asistencias(empleado_id);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON public.horarios_asignados(fecha);

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_asignados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acceso (Permitir lectura y escritura con clave pública/anon)
DROP POLICY IF EXISTS "Permitir todo a usuarios anon en empleados" ON public.empleados;
CREATE POLICY "Permitir todo a usuarios anon en empleados" 
ON public.empleados FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anon en horarios" ON public.horarios_asignados;
CREATE POLICY "Permitir todo a usuarios anon en horarios" 
ON public.horarios_asignados FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios anon en asistencias" ON public.asistencias;
CREATE POLICY "Permitir todo a usuarios anon en asistencias" 
ON public.asistencias FOR ALL USING (true) WITH CHECK (true);

-- 8. Bucket de Almacenamiento para Certificados Médicos (Opcional Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificados', 'certificados', true)
ON CONFLICT (id) DO NOTHING;

-- Política de almacenamiento público para certificados
DROP POLICY IF EXISTS "Acceso público certificados" ON storage.objects;
CREATE POLICY "Acceso público certificados" 
ON storage.objects FOR ALL USING (bucket_id = 'certificados') WITH CHECK (bucket_id = 'certificados');

-- ================================================================
-- DATOS SEMILLA (EMPLEADOS DE PRUEBA)
-- ================================================================
INSERT INTO public.empleados (nombre, legajo, cargo, foto_url)
VALUES 
  ('Carlos Alberto Gómez', 'LEG-1001', 'Técnico de Mantenimiento', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
  ('Mariana Lucía Silva', 'LEG-1002', 'Supervisora de Turno', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'),
  ('Juan Pablo Rossi', 'LEG-1003', 'Operador de Maquinaria', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
  ('Sofía Elena Morales', 'LEG-1004', 'Analista de Control de Calidad', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (legajo) DO NOTHING;
`;
