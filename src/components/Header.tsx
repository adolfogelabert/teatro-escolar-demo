import React from 'react';
import { Presentation, PresentationId } from '../types';
import { formatCOP } from '../data/theaterData';
import { Sparkles, Calendar, Clock, GraduationCap, Building2, Ticket, Settings, Info } from 'lucide-react';

interface HeaderProps {
  presentations: Presentation[];
  currentPresentation: Presentation;
  onSelectPresentation: (id: PresentationId) => void;
  ticketPrice: number;
  selectedCount: number;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  presentations,
  currentPresentation,
  onSelectPresentation,
  ticketPrice,
  selectedCount,
  isAdminOpen,
  onToggleAdmin,
  onOpenInfo,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top institution bar */}
      <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
              T
            </span>
            <span className="font-semibold tracking-wide uppercase">
              Temporada de Teatro Escolar 2026
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">Auditorio Principal & Teatro Mayor</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Reserva por Consignación Bancaria</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={onOpenInfo}
                className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer p-1"
                title="Información y guía de uso"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Guía</span>
              </button>
              <button
                onClick={onToggleAdmin}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer font-medium ${
                  isAdminOpen
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAdminOpen ? 'Cerrar' : 'Admin'}</span>
                <span className="sm:hidden">{isAdminOpen ? '✕' : '⚙'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Title & Presentation Switcher */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Sistema Oficial de Asignación
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Precio por boleta:{' '}
                <strong className="text-indigo-900 font-bold">{formatCOP(ticketPrice)}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight mt-0.5">
              Teatro Escolar • Asignación de Asientos
            </h1>
          </div>

          {/* Presentation Tabs (Preescolar, Primaria, Bachillerato) with vibrant pill styling */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0" id="event-selector">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1 hidden sm:inline">
              Presentación:
            </span>
            {presentations.map((p) => {
              const isActive = p.id === currentPresentation.id;
              return (
                <button
                  key={p.id}
                  id={`btn-presentation-${p.id}`}
                  onClick={() => onSelectPresentation(p.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      p.id === 'preescolar'
                        ? 'bg-amber-300'
                        : p.id === 'primaria'
                        ? 'bg-emerald-300'
                        : 'bg-cyan-300'
                    }`}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Presentation Active Details Banner */}
        <div className="mt-3 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-indigo-50/50 border border-indigo-100 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`font-bold px-3 py-1 rounded-full border text-xs shadow-2xs ${currentPresentation.badgeColor}`}>
              {currentPresentation.name} • {currentPresentation.grades}
            </span>
            <div className="flex items-center gap-1.5 text-indigo-950 font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{currentPresentation.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-600 text-xs">
            <div className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentPresentation.date}</span>
            </div>
            <div className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentPresentation.time}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
