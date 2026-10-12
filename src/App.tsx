/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  TabType, 
  Empleado, 
  HorarioAsignado, 
  Asistencia, 
  UserRole 
} from './types';
import { 
  fetchEmpleados, 
  fetchHorarios, 
  fetchAsistencias, 
  saveEmpleado, 
  deleteEmpleado, 
  saveHorario, 
  saveAsistencia 
} from './lib/storage';
import { getStoredSupabaseConfig } from './lib/supabase';
import { getTodayString } from './lib/timeCalculations';

// Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PersonalTab } from './components/PersonalTab';
import { AsistenciaTab } from './components/AsistenciaTab';
import { HorariosTab } from './components/HorariosTab';
import { CalendarioTab } from './components/CalendarioTab';
import { ReportesTab } from './components/ReportesTab';
import { CertificateModal } from './components/CertificateModal';
import { SupabaseGuideModal } from './components/SupabaseGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('asistencia');
  const [userRole, setUserRole] = useState<UserRole>('supervisor');

  // Core Data
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [horarios, setHorarios] = useState<HorarioAsignado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase Config State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Certificate Modal State
  const [certModal, setCertModal] = useState<{
    isOpen: boolean;
    imageUrl?: string;
    empName?: string;
    fecha?: string;
    obs?: string;
  }>({
    isOpen: false,
  });

  // Cross-tab deep links
  const [selectedEmpForAttendance, setSelectedEmpForAttendance] = useState<string | undefined>();
  const [selectedEmpForCalendar, setSelectedEmpForCalendar] = useState<string | undefined>();

  // Load Data
  const loadData = async () => {
    try {
      const config = getStoredSupabaseConfig();
      setIsSupabaseConnected(Boolean(config.isConnected && config.url && config.anonKey));

      const [emps, hors, asists] = await Promise.all([
        fetchEmpleados(),
        fetchHorarios(),
        fetchAsistencias(),
      ]);

      setEmpleados(emps);
      setHorarios(hors);
      setAsistencias(asists);
    } catch (e) {
      console.error('Error loading initial data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Data Mutations
  const handleSaveEmpleado = async (empData: Omit<Empleado, 'id'> & { id?: string }) => {
    const saved = await saveEmpleado(empData);
    setEmpleados((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteEmpleado = async (id: string) => {
    await deleteEmpleado(id);
    setEmpleados((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveHorario = async (hor: HorarioAsignado) => {
    const saved = await saveHorario(hor);
    setHorarios((prev) => {
      const idx = prev.findIndex(
        (h) => h.empleado_id === saved.empleado_id && h.fecha === saved.fecha
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleSaveAsistencia = async (asist: Asistencia) => {
    const saved = await saveAsistencia(asist);
    setAsistencias((prev) => {
      const idx = prev.findIndex(
        (a) => a.empleado_id === saved.empleado_id && a.fecha === saved.fecha
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  // Certificate Modal Opener
  const handleViewCertificate = (
    imageUrl: string,
    empName: string,
    fecha: string,
    obs?: string
  ) => {
    setCertModal({
      isOpen: true,
      imageUrl,
      empName,
      fecha,
      obs,
    });
  };

  // Navigate from Personal to Asistencia
  const handleSelectEmpleadoForAttendance = (empleadoId: string) => {
    setSelectedEmpForAttendance(empleadoId);
    setCurrentTab('asistencia');
  };

  // Navigate from Personal to Calendar
  const handleSelectEmpleadoForCalendar = (empleadoId: string) => {
    setSelectedEmpForCalendar(empleadoId);
    setCurrentTab('calendario');
  };

  // Navigate from Calendar to Asistencia for specific date
  const handleGoToAttendanceDate = (dateStr: string, empId?: string) => {
    if (empId) setSelectedEmpForAttendance(empId);
    setCurrentTab('asistencia');
  };

  // Compute pending count for today
  const todayStr = getTodayString();
  const todayRecords = asistencias.filter((a) => a.fecha === todayStr);
  const pendingCount = empleados.filter((emp) => {
    const rec = todayRecords.find((a) => a.empleado_id === emp.id);
    const hor = horarios.find((h) => h.empleado_id === emp.id && h.fecha === todayStr);
    if (hor?.es_franco) return false;
    return !rec || rec.estado === 'pendiente';
  }).length;

  const todayAsistencias = asistencias.filter((a) => a.fecha === todayStr);
  const todayHorarios = horarios.filter((h) => h.fecha === todayStr);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col antialiased">
      {/* Offline Alert Indicator */}
      <OfflineIndicator />

      {/* Header */}
      <Header
        userRole={userRole}
        onRoleChange={setUserRole}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full pt-1.5 transition-all">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="font-bold text-slate-700 text-sm">Cargando sistema de asistencia...</p>
            <p className="text-xs text-slate-400 mt-1">Sincronizando nómina y registros</p>
          </div>
        ) : (
          <>
            {currentTab === 'personal' && (
              <PersonalTab
                empleados={empleados}
                asistenciasHoy={todayAsistencias}
                horariosHoy={todayHorarios}
                onSaveEmpleado={handleSaveEmpleado}
                onDeleteEmpleado={handleDeleteEmpleado}
                onSelectEmpleadoForAttendance={handleSelectEmpleadoForAttendance}
                onSelectEmpleadoForCalendar={handleSelectEmpleadoForCalendar}
              />
            )}

            {currentTab === 'asistencia' && (
              <AsistenciaTab
                empleados={empleados}
                horarios={horarios}
                asistencias={asistencias}
                onSaveAsistencia={handleSaveAsistencia}
                onViewCertificate={handleViewCertificate}
                selectedEmpleadoId={selectedEmpForAttendance}
                onClearSelectedEmpleado={() => setSelectedEmpForAttendance(undefined)}
              />
            )}

            {currentTab === 'horarios' && (
              <HorariosTab
                empleados={empleados}
                horarios={horarios}
                onSaveHorario={handleSaveHorario}
              />
            )}

            {currentTab === 'calendario' && (
              <CalendarioTab
                empleados={empleados}
                horarios={horarios}
                asistencias={asistencias}
                onViewCertificate={handleViewCertificate}
                onGoToAttendanceDate={handleGoToAttendanceDate}
                initialSelectedEmpId={selectedEmpForCalendar}
              />
            )}

            {currentTab === 'reportes' && (
              <ReportesTab
                empleados={empleados}
                horarios={horarios}
                asistencias={asistencias}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedEmpForAttendance(undefined);
          setCurrentTab(tab);
        }}
        pendingCount={pendingCount}
      />

      {/* High-Resolution Medical Certificate Modal */}
      <CertificateModal
        isOpen={certModal.isOpen}
        onClose={() => setCertModal({ isOpen: false })}
        imageUrl={certModal.imageUrl}
        empleadoNombre={certModal.empName}
        fecha={certModal.fecha}
        observaciones={certModal.obs}
      />

      {/* Supabase, SQL & Deployment Modal */}
      <SupabaseGuideModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={() => loadData()}
      />
    </div>
  );
}
