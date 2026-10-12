import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  BadgeCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Briefcase, 
  Calendar,
  AlertCircle,
  X,
  Camera,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Empleado, Asistencia, HorarioAsignado, EstadoAsistencia } from '../types';

interface PersonalTabProps {
  empleados: Empleado[];
  asistenciasHoy: Asistencia[];
  horariosHoy: HorarioAsignado[];
  onSaveEmpleado: (empleado: Omit<Empleado, 'id'> & { id?: string }) => Promise<void>;
  onDeleteEmpleado: (id: string) => Promise<void>;
  onSelectEmpleadoForAttendance?: (empleadoId: string) => void;
  onSelectEmpleadoForCalendar?: (empleadoId: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const PersonalTab: React.FC<PersonalTabProps> = ({
  empleados,
  asistenciasHoy,
  horariosHoy,
  onSaveEmpleado,
  onDeleteEmpleado,
  onSelectEmpleadoForAttendance,
  onSelectEmpleadoForCalendar,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [legajo, setLegajo] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoUrl, setFotoUrl] = useState(AVATAR_PRESETS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openNewModal = () => {
    setEditingEmp(null);
    setNombre('');
    // Auto increment legajo suggestion
    const nextNum = 1000 + empleados.length + 1;
    setLegajo(`LEG-${nextNum}`);
    setCargo('');
    setTelefono('');
    setFotoUrl(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
    setModalOpen(true);
  };

  const openEditModal = (emp: Empleado) => {
    setEditingEmp(emp);
    setNombre(emp.nombre);
    setLegajo(emp.legajo);
    setCargo(emp.cargo);
    setTelefono(emp.telefono || '');
    setFotoUrl(emp.foto_url || AVATAR_PRESETS[0]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !legajo.trim() || !cargo.trim()) {
      alert('Por favor completa Nombre, Legajo y Cargo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveEmpleado({
        id: editingEmp?.id,
        nombre: nombre.trim(),
        legajo: legajo.trim().toUpperCase(),
        cargo: cargo.trim(),
        telefono: telefono.trim(),
        foto_url: fotoUrl,
        activo: true,
      });
      setModalOpen(false);
    } catch (err: any) {
      alert('Error guardando empleado: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmpleados = empleados.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.nombre.toLowerCase().includes(q) ||
      emp.legajo.toLowerCase().includes(q) ||
      emp.cargo.toLowerCase().includes(q)
    );
  });

  const getTodayStatusInfo = (empId: string) => {
    const asist = asistenciasHoy.find((a) => a.empleado_id === empId);
    const hor = horariosHoy.find((h) => h.empleado_id === empId);

    if (hor?.es_franco) {
      return {
        label: 'Franco / Libre',
        color: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-400',
      };
    }

    if (!asist || asist.estado === 'pendiente') {
      return {
        label: 'Pendiente de Ingreso',
        color: 'bg-amber-50 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
      };
    }

    switch (asist.estado) {
      case 'puntual':
        return {
          label: asist.hora_egreso_real ? 'Jornada Completa' : 'Presente (Puntual)',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'tarde':
        return {
          label: `Llegada Tarde (+${asist.minutos_tarde || '15'}m)`,
          color: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
        };
      case 'falta_justificada':
        return {
          label: 'Falta Médica (Justificada)',
          color: 'bg-sky-50 text-sky-800 border-sky-300',
          dot: 'bg-sky-500',
        };
      case 'falta_injustificada':
        return {
          label: 'Ausente (Injustificada)',
          color: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
        };
      default:
        return {
          label: 'Pendiente',
          color: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
        };
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 sm:px-4 max-w-md mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                Directorio Activo
              </span>
              <h2 className="text-xl font-black tracking-tight">Nómina de Personal</h2>
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-1.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs px-3.5 py-2 rounded-2xl shadow-md transition active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-indigo-700" />
              <span>Nuevo</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
            <div className="bg-white/10 rounded-2xl py-2 px-1 backdrop-blur-xs">
              <span className="text-lg font-black block leading-none">{empleados.length}</span>
              <span className="text-[10px] text-indigo-200 uppercase font-semibold">Total</span>
            </div>
            <div className="bg-emerald-500/20 rounded-2xl py-2 px-1 backdrop-blur-xs border border-emerald-400/30">
              <span className="text-lg font-black block leading-none text-emerald-300">
                {asistenciasHoy.filter((a) => a.estado === 'puntual' || a.estado === 'tarde').length}
              </span>
              <span className="text-[10px] text-emerald-200 uppercase font-semibold">En Planta</span>
            </div>
            <div className="bg-rose-500/20 rounded-2xl py-2 px-1 backdrop-blur-xs border border-rose-400/30">
              <span className="text-lg font-black block leading-none text-rose-300">
                {asistenciasHoy.filter((a) => a.estado === 'falta_injustificada' || a.estado === 'falta_justificada').length}
              </span>
              <span className="text-[10px] text-rose-200 uppercase font-semibold">Ausentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, cargo o legajo..."
          className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium shadow-xs focus:outline-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Employees Card List */}
      <div className="space-y-3">
        {filteredEmpleados.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No se encontraron empleados</h4>
            <p className="text-xs text-slate-600 mt-1">
              {search ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer empleado arriba.'}
            </p>
          </div>
        ) : (
          filteredEmpleados.map((emp) => {
            const statusInfo = getTodayStatusInfo(emp.id);
            const asist = asistenciasHoy.find((a) => a.empleado_id === emp.id);

            return (
              <div
                key={emp.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-[0_3px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <img
                    src={emp.foto_url || AVATAR_PRESETS[0]}
                    alt={emp.nombre}
                    className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-50 shadow-xs shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate leading-snug">
                        {emp.nombre}
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
                        {emp.legajo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.cargo}</span>
                    </div>

                    {emp.telefono && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                        <span>{emp.telefono}</span>
                      </div>
                    )}

                    {/* Today's Status Pill */}
                    <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${statusInfo.color}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        <span>{statusInfo.label}</span>
                      </div>

                      {asist?.hora_ingreso_real && (
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Entrada: {asist.hora_ingreso_real}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Quick Action Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {onSelectEmpleadoForAttendance && (
                      <button
                        onClick={() => onSelectEmpleadoForAttendance(emp.id)}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl transition active:scale-95 flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Cargar Asistencia
                      </button>
                    )}
                    {onSelectEmpleadoForCalendar && (
                      <button
                        onClick={() => onSelectEmpleadoForCalendar(emp.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition active:scale-95 flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Ver Mes
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                      title="Editar Datos"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar a ${emp.nombre}?`)) {
                          onDeleteEmpleado(emp.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition"
                      title="Eliminar Empleado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingEmp ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {/* Photo selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Foto de Perfil
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={fotoUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-xs shrink-0"
                  />
                  <div className="flex-1">
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Elige un avatar rápido:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {AVATAR_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFotoUrl(p)}
                          className={`w-7 h-7 rounded-xl overflow-hidden shrink-0 transition ${
                            fotoUrl === p ? 'ring-2 ring-indigo-600 scale-105' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={p} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Marcelo Fernández"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° de Legajo *
                  </label>
                  <input
                    type="text"
                    required
                    value={legajo}
                    onChange={(e) => setLegajo(e.target.value)}
                    placeholder="LEG-1005"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:bg-white focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Puesto *
                  </label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Operario / Técnico"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:bg-white focus:outline-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingEmp ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
