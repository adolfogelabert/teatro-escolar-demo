import React, { useState } from 'react';
import { Presentation, PresentationId, Seat, SeatInventory, SeatStatus } from '../types';
import { formatCOP } from '../data/theaterData';
import {
  ShieldAlert,
  Settings,
  RefreshCw,
  Lock,
  Unlock,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Search,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface AdminPanelProps {
  presentations: Presentation[];
  currentPresentation: Presentation;
  onSelectPresentation: (id: PresentationId) => void;
  seats: Seat[];
  inventory: SeatInventory;
  ticketPrice: number;
  onUpdateTicketPrice: (newPrice: number) => void;
  onUpdateSeatStatus: (seatId: string, newStatus: SeatStatus) => void;
  onBatchUpdateRow: (row: string, newStatus: SeatStatus) => void;
  onBatchUpdateSection: (sectionId: string, newStatus: SeatStatus) => void;
  onResetPresentation: (presentationId: PresentationId) => void;
  onSimulateFullHouse: (presentationId: PresentationId) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  presentations,
  currentPresentation,
  onSelectPresentation,
  seats,
  inventory,
  ticketPrice,
  onUpdateTicketPrice,
  onUpdateSeatStatus,
  onBatchUpdateRow,
  onBatchUpdateSection,
  onResetPresentation,
  onSimulateFullHouse,
  onClose,
}) => {
  const [tempPrice, setTempPrice] = useState<string>(ticketPrice.toString());
  const [selectedRow, setSelectedRow] = useState<string>('C');
  const [selectedSection, setSelectedSection] = useState<string>('balcon3');
  const [seatSearch, setSeatSearch] = useState<string>('');

  // Estadísticas en tiempo real
  const stats = React.useMemo(() => {
    let disponible = 0;
    let seleccionado = 0;
    let ocupado = 0;
    let bloqueado = 0;

    seats.forEach((seat) => {
      const st = inventory[seat.id] || (seat.defaultBlocked ? 'bloqueado' : 'disponible');
      if (st === 'disponible') disponible++;
      else if (st === 'seleccionado') seleccionado++;
      else if (st === 'ocupado') ocupado++;
      else if (st === 'bloqueado') bloqueado++;
    });

    const total = seats.length;
    const revenue = ocupado * ticketPrice;
    const potentialRevenue = (disponible + ocupado + seleccionado) * ticketPrice;

    return {
      total,
      disponible,
      seleccionado,
      ocupado,
      bloqueado,
      revenue,
      potentialRevenue,
      occupancyRate: total > 0 ? Math.round((ocupado / (total - bloqueado)) * 100) : 0,
    };
  }, [seats, inventory, ticketPrice]);

  const handlePriceSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(tempPrice.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val >= 1000) {
      onUpdateTicketPrice(val);
      alert(`Precio por boleta actualizado a ${formatCOP(val)} exitosamente.`);
    }
  };

  // Unique list of rows for the batch row selector
  const availableRows = Array.from(new Set(seats.map((s) => s.row))).sort();

  // Filtered seats for manual inspector
  const filteredSeats = seats
    .filter((s) => {
      if (!seatSearch) return true;
      const query = seatSearch.toLowerCase();
      return (
        s.label.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.row.toLowerCase().includes(query) ||
        s.number.toString().includes(query)
      );
    })
    .slice(0, 40); // limit to 40 for responsiveness

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 shadow-2xl p-5 sm:p-7 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Panel Administrativo & Taquilla
              </h2>
              <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                MODO ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Control de inventario de asientos, bloqueos manuales, precios y métricas de taquilla
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
        >
          Cerrar Panel
        </button>
      </div>

      {/* Presentation Switcher inside Admin */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <span>Gestionando función:</span>
          <span className="text-amber-400 font-extrabold">{currentPresentation.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {presentations.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPresentation(p.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                p.id === currentPresentation.id
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Seats */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Asientos</div>
          <div className="text-xl font-black text-white mt-0.5">{stats.total}</div>
          <div className="text-[10px] text-slate-500">Capacidad Total</div>
        </div>

        {/* Disponibles (Verde) */}
        <div className="bg-slate-800/80 border border-emerald-900/50 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Disponibles
          </div>
          <div className="text-xl font-black text-emerald-300 mt-0.5">{stats.disponible}</div>
          <div className="text-[10px] text-emerald-600">Listos para compra</div>
        </div>

        {/* Ocupados / Pagados (Rojo) */}
        <div className="bg-slate-800/80 border border-rose-900/50 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Vendidos/Pagados
          </div>
          <div className="text-xl font-black text-rose-300 mt-0.5">{stats.ocupado}</div>
          <div className="text-[10px] text-rose-600">{stats.occupancyRate}% ocupación</div>
        </div>

        {/* Bloqueados (Gris) */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-500" />
            Bloqueados
          </div>
          <div className="text-xl font-black text-stone-300 mt-0.5">{stats.bloqueado}</div>
          <div className="text-[10px] text-stone-500">Palcos y Fila A-B</div>
        </div>

        {/* Recaudo Actual */}
        <div className="bg-slate-800/80 border border-amber-900/50 rounded-2xl p-3 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="text-[10px] uppercase font-bold text-amber-400">Recaudo Confirmado</div>
          <div className="text-xl font-black text-amber-300 mt-0.5 font-mono">
            {formatCOP(stats.revenue)}
          </div>
          <div className="text-[10px] text-slate-400">
            Potencial total: {formatCOP(stats.potentialRevenue)}
          </div>
        </div>
      </div>

      {/* Control Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Global Price Modifier */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Precio Global de Boleta
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Modifica la variable global de precio ($80.000 COP por defecto).
            </p>
          </div>

          <form onSubmit={handlePriceSave} className="flex gap-2">
            <input
              type="number"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:border-amber-400 outline-none"
              placeholder="80000"
              step="5000"
              min="1000"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Guardar
            </button>
          </form>
        </div>

        {/* 2. Batch Row & Section Actions */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
              <Lock className="w-4 h-4 text-amber-400" />
              Bloqueo Masivo por Fila
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Aplica estados a una fila completa con un solo clic.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={selectedRow}
                onChange={(e) => setSelectedRow(e.target.value)}
                className="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold outline-none"
              >
                {availableRows.map((r) => (
                  <option key={r} value={r}>
                    Fila {r}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onBatchUpdateRow(selectedRow, 'bloqueado')}
                className="w-1/4 py-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Bloquear fila"
              >
                Bloquear
              </button>

              <button
                onClick={() => onBatchUpdateRow(selectedRow, 'disponible')}
                className="w-1/4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Habilitar fila"
              >
                Liberar
              </button>
            </div>
          </div>
        </div>

        {/* 3. Preset & Reset Actions */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5 mb-1">
              <RefreshCw className="w-4 h-4 text-rose-400" />
              Acciones de Demostración
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Carga datos de prueba o restablece el inventario inicial.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSimulateFullHouse(currentPresentation.id)}
              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Simular 65% Venta</span>
            </button>

            <button
              onClick={() => onResetPresentation(currentPresentation.id)}
              className="w-1/2 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resetear Función</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Seat Inspector / Status Switcher */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              Inspección y Taquilla Física Asiento por Asiento
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={seatSearch}
              onChange={(e) => setSeatSearch(e.target.value)}
              placeholder="Buscar por fila o asiento..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
          {filteredSeats.map((seat) => {
            const currentStatus =
              inventory[seat.id] || (seat.defaultBlocked ? 'bloqueado' : 'disponible');

            return (
              <div
                key={seat.id}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white text-[11px]">{seat.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {seat.id} • {formatCOP(ticketPrice)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Toggle status quickly */}
                  <select
                    value={currentStatus}
                    onChange={(e) => onUpdateSeatStatus(seat.id, e.target.value as SeatStatus)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                      currentStatus === 'disponible'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : currentStatus === 'seleccionado'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : currentStatus === 'ocupado'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-stone-800 text-stone-300 border-stone-600'
                    }`}
                  >
                    <option value="disponible">Disponible (Verde)</option>
                    <option value="ocupado">Vendido (Rojo)</option>
                    <option value="bloqueado">Bloqueado (Gris)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
