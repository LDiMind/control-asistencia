import React from 'react';
import { Users, Clock, CalendarClock, CalendarDays, FileSpreadsheet } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  pendingCount = 0,
}) => {
  const tabs = [
    {
      id: 'personal' as TabType,
      label: 'Personal',
      icon: Users,
    },
    {
      id: 'asistencia' as TabType,
      label: 'Asistencia',
      icon: Clock,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'horarios' as TabType,
      label: 'Horarios',
      icon: CalendarClock,
    },
    {
      id: 'calendario' as TabType,
      label: 'Calendario',
      icon: CalendarDays,
    },
    {
      id: 'reportes' as TabType,
      label: 'Reportes',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-all">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 group active:scale-95 flex-1 ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              {/* Active Indicator Glow/Pill */}
              {isActive && (
                <span className="absolute -top-1.5 w-8 h-1 bg-indigo-600 rounded-full shadow-[0_2px_8px_rgba(79,70,229,0.5)] transition-all" />
              )}

              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-50 shadow-inner text-indigo-600 scale-105'
                    : 'group-hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center border-2 border-white shadow-xs animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-0.5 tracking-tight transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
