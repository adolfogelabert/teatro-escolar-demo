import React from 'react';
import { X, Ticket, Users, Layers, Lock, Sparkles, Hourglass, Building2, Mail } from 'lucide-react';
import { formatCOP } from '../data/theaterData';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketPrice: number;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, ticketPrice }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-xl max-h-screen sm:max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 id="info-modal-title" className="font-extrabold text-base">Guía del Sistema de Asignación</h3>
              <p className="text-xs text-slate-400">Teatro Escolar • Temporada 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600 overflow-y-auto flex-1 overscroll-contain">
          {/* Colors */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2.5">
              1. Estados y Códigos de Color de los Asientos:
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-[4px] border flex items-center justify-center font-bold text-[9px] text-white"
                  style={{ backgroundColor: '#4CAF50', borderColor: '#388E3C' }}
                >
                  ✓
                </span>
                <div>
                  <strong className="text-emerald-900 block font-bold">Disponible (#4CAF50)</strong>
                  <span className="text-[10px] text-emerald-700">Listo para reservar.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-[4px] border ring-1 ring-slate-900 flex items-center justify-center font-bold text-[9px] text-slate-900"
                  style={{ backgroundColor: '#FFEB3B', borderColor: '#EAB308' }}
                >
                  ★
                </span>
                <div>
                  <strong className="text-amber-900 block font-bold">Seleccionado (#FFEB3B)</strong>
                  <span className="text-[10px] text-amber-700">En tu carrito de reserva.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-[4px] border flex items-center justify-center font-bold text-[9px] text-white"
                  style={{ backgroundColor: '#7C3AED', borderColor: '#5B21B6' }}
                >
                  <Hourglass className="w-3 h-3" />
                </span>
                <div>
                  <strong className="text-purple-900 block font-bold">Reservado (#7C3AED)</strong>
                  <span className="text-[10px] text-purple-700">Pago por consignación pendiente (48h).</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-[4px] border flex items-center justify-center font-bold text-[9px] text-white"
                  style={{ backgroundColor: '#F44336', borderColor: '#D32F2F' }}
                >
                  ✕
                </span>
                <div>
                  <strong className="text-rose-900 block font-bold">Ocupado (#F44336)</strong>
                  <span className="text-[10px] text-rose-700">Consignación confirmada.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center gap-2 col-span-2">
                <span
                  className="w-5 h-5 rounded-[4px] border flex items-center justify-center font-bold text-[9px] text-slate-200"
                  style={{ backgroundColor: '#757575', borderColor: '#555555' }}
                >
                  <Lock className="w-3 h-3" />
                </span>
                <div>
                  <strong className="text-stone-900 block font-bold">Bloqueado (#757575)</strong>
                  <span className="text-[10px] text-stone-600">Palcos y 2 primeras filas de Platea.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              2. ¿Cómo funciona la reserva por consignación?
            </h4>
            <ol className="space-y-1.5 list-decimal pl-4 text-slate-600">
              <li>
                <strong>Selecciona</strong> los asientos disponibles (verde) y confírmalos.
              </li>
              <li>
                <strong>Crea tu reserva</strong> con tus datos. Los asientos quedan
                <span className="font-bold text-purple-700"> bloqueados (morado) por 48 horas</span>.
              </li>
              <li>
                <strong>Recibes un correo</strong> con el resumen, los datos para
                consignar y tu <em>código único de referencia</em>.
              </li>
              <li>
                <strong>Consignas</strong> el valor exacto usando el código de referencia como concepto y
                envías el comprobante al colegio.
              </li>
              <li>
                Una vez confirmado el pago, los asientos pasan a{' '}
                <span className="font-bold text-rose-700">Ocupado (rojo)</span>.
              </li>
              <li>
                Si en 48 horas <strong>no se recibe confirmación</strong>, los
                asientos vuelven automáticamente a <em>Disponible</em>.
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Entendido, ir al teatro
          </button>
        </div>
      </div>
    </div>
  );
};
