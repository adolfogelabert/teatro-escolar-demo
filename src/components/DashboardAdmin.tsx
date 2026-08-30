import React, { useState, useMemo } from 'react';
import {
  Presentation,
  PresentationId,
  Seat,
  SeatInventory,
  SeatStatus,
  Reservation,
  User,
} from '../types';
import { formatCOP } from '../data/theaterData';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  BarChart3,
  DollarSign,
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Plus,
  UserPlus,
  Shield,
  ShieldCheck,
  Eye,
  RotateCcw,
  TrendingUp,
  Calendar,
  Hourglass,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  Settings,
  ClipboardList,
  FileText,
  Search,
  Filter,
  Download,
  CircleDollarSign,
  Receipt,
  UserCheck,
  UserX,
  Timer,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardAdminProps {
  presentations: Presentation[];
  currentPresentation: Presentation;
  onSelectPresentation: (id: PresentationId) => void;
  seats: Seat[];
  inventory: SeatInventory;
  ticketPrice: number;
  reservations: Reservation[];
  onUpdateTicketPrice: (price: number) => void;
  onUpdateSeatStatus: (seatId: string, newStatus: SeatStatus) => void;
  onBatchUpdateRow: (rowLetter: string, newStatus: SeatStatus) => void;
  onBatchUpdateSection: (sectionId: string, newStatus: SeatStatus) => void;
  onResetPresentation: (presentationId: PresentationId) => void;
  onSimulateFullHouse: (presentationId: PresentationId) => void;
  onConfirmPayment: (reservationId: string) => void;
  onClose: () => void;
}

type AdminTab = 'dashboard' | 'seats' | 'reservations' | 'reports' | 'users' | 'settings';

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({
  presentations,
  currentPresentation,
  onSelectPresentation,
  seats,
  inventory,
  ticketPrice,
  reservations,
  onUpdateTicketPrice,
  onUpdateSeatStatus,
  onBatchUpdateRow,
  onBatchUpdateSection,
  onResetPresentation,
  onSimulateFullHouse,
  onConfirmPayment,
  onClose,
}) => {
  const { user, hasRole, users, addUser, updateUser, deleteUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmReset, setConfirmReset] = useState<PresentationId | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [reservationFilter, setReservationFilter] = useState<'todas' | 'pendiente' | 'confirmada' | 'expirada' | 'cancelada'>('todas');
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const stats = useMemo(() => {
    let disponible = 0;
    let seleccionado = 0;
    let reservado = 0;
    let ocupado = 0;
    let bloqueado = 0;

    seats.forEach((seat) => {
      const st = inventory[seat.id]?.status || (seat.defaultBlocked ? 'bloqueado' : 'disponible');
      if (st === 'disponible') disponible++;
      else if (st === 'seleccionado') seleccionado++;
      else if (st === 'reservado') reservado++;
      else if (st === 'ocupado') ocupado++;
      else if (st === 'bloqueado') bloqueado++;
    });

    const activeReservations = reservations.filter(
      (r) => r.status === 'pendiente' && r.presentationId === currentPresentation.id
    );
    const confirmedReservations = reservations.filter(
      (r) => r.status === 'confirmada' && r.presentationId === currentPresentation.id
    );
    const totalRevenue = confirmedReservations.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      disponible,
      seleccionado,
      reservado,
      ocupado,
      bloqueado,
      total: seats.length,
      occupancyRate: seats.length > 0 ? Math.round((ocupado / seats.length) * 100) : 0,
      activeReservations: activeReservations.length,
      confirmedReservations: confirmedReservations.length,
      totalRevenue,
    };
  }, [seats, inventory, reservations, currentPresentation]);

  const filteredReservations = useMemo(() => {
    let filtered = reservations;
    if (reservationFilter !== 'todas') {
      filtered = reservations.filter((r) => {
        if (reservationFilter === 'expirada') {
          return r.status === 'expirada' || (r.status === 'pendiente' && r.expiresAtMs < Date.now());
        }
        return r.status === reservationFilter;
      });
    }
    return filtered.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [reservations, reservationFilter]);

  const reportData = useMemo(() => {
    const confirmed = reservations.filter((r) => r.status === 'confirmada');
    const pending = reservations.filter((r) => r.status === 'pendiente' && r.expiresAtMs > Date.now());
    const expired = reservations.filter((r) => r.status === 'expirada' || (r.status === 'pendiente' && r.expiresAtMs <= Date.now()));
    const cancelled = reservations.filter((r) => r.status === 'cancelada');

    const totalRevenue = confirmed.reduce((s, r) => s + r.totalAmount, 0);
    const pendingRevenue = pending.reduce((s, r) => s + r.totalAmount, 0);
    const lostRevenue = expired.reduce((s, r) => s + r.totalAmount, 0);
    const cancelledRevenue = cancelled.reduce((s, r) => s + r.totalAmount, 0);

    const totalSold = confirmed.reduce((s, r) => s + r.seats.length, 0);
    const avgTicket = totalSold > 0 ? Math.round(totalRevenue / totalSold) : 0;
    const conversionRate = reservations.length > 0
      ? Math.round((confirmed.length / reservations.length) * 100)
      : 0;

    return {
      totalRevenue,
      pendingRevenue,
      lostRevenue,
      cancelledRevenue,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      expiredCount: expired.length,
      cancelledCount: cancelled.length,
      avgTicket,
      conversionRate,
    };
  }, [reservations]);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'reservations', label: 'Reservas', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'reports', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
    { id: 'seats', label: 'Asientos', icon: <Ticket className="w-4 h-4" /> },
    ...(hasRole('admin') ? [
      { id: 'users' as AdminTab, label: 'Usuarios', icon: <Users className="w-4 h-4" /> },
      { id: 'settings' as AdminTab, label: 'Config', icon: <Settings className="w-4 h-4" /> },
    ] : []),
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Panel de Administración</h2>
              <p className="text-xs text-slate-400">
                {user?.fullName} •{' '}
                <span className="text-amber-400 font-semibold capitalize">{user?.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-emerald-700">Disponibles</span>
                </div>
                <div className="text-2xl font-black text-emerald-900">{stats.disponible}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-700">Reservados</span>
                </div>
                <div className="text-2xl font-black text-amber-900">{stats.reservado}</div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Ticket className="w-4 h-4 text-rose-600" />
                  <span className="text-[11px] font-semibold text-rose-700">Ocupados</span>
                </div>
                <div className="text-2xl font-black text-rose-900">{stats.ocupado}</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-semibold text-indigo-700">Ingresos</span>
                </div>
                <div className="text-lg font-black text-indigo-900">{formatCOP(stats.totalRevenue)}</div>
              </div>
            </div>

            {/* Occupancy Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-slate-800">Ocupación General</span>
                <span className="text-sm font-black text-indigo-700">{stats.occupancyRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                <span>{stats.ocupado} de {stats.total} asientos ocupados</span>
                <span>{stats.disponible} disponibles</span>
              </div>
            </div>

            {/* Stats Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-500" />
                  Reservas Activas
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pendientes de pago:</span>
                    <span className="font-bold text-amber-700">{stats.activeReservations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Confirmadas:</span>
                    <span className="font-bold text-emerald-700">{stats.confirmedReservations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ingresos confirmados:</span>
                    <span className="font-bold text-indigo-700">{formatCOP(stats.totalRevenue)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Resumen
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bloqueados (protocolo):</span>
                    <span className="font-bold text-stone-700">{stats.bloqueado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Seleccionados (carrito):</span>
                    <span className="font-bold text-amber-700">{stats.seleccionado}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Precio por boleta:</span>
                    <span className="font-bold text-slate-900">{formatCOP(ticketPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== SEATS TAB ========== */}
        {activeTab === 'seats' && (
          <div className="space-y-4">
            {/* Reset buttons */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Acciones Rápidas
              </h3>
              <div className="flex flex-wrap gap-2">
                {confirmReset ? (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-xs text-rose-700 font-semibold">
                      ¿Resetear {presentations.find((p) => p.id === confirmReset)?.name}?
                    </span>
                    <button
                      onClick={() => {
                        onResetPresentation(confirmReset);
                        setConfirmReset(null);
                      }}
                      className="text-xs bg-rose-600 text-white px-3 py-1 rounded-lg font-bold cursor-pointer hover:bg-rose-700"
                    >
                      Sí, resetear
                    </button>
                    <button
                      onClick={() => setConfirmReset(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onResetPresentation(currentPresentation.id)}
                      className="text-xs bg-white border border-amber-300 text-amber-800 px-3 py-2 rounded-lg font-semibold hover:bg-amber-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Resetear {currentPresentation.name}
                    </button>
                    <button
                      onClick={() => onSimulateFullHouse(currentPresentation.id)}
                      className="text-xs bg-white border border-indigo-300 text-indigo-800 px-3 py-2 rounded-lg font-semibold hover:bg-indigo-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Simular Sala Llena
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Seat sections */}
            {['Platea Central', '1° Balcón', '2° Balcón', '3° Balcón'].map((section) => {
              const sectionSeats = seats.filter((s) => s.sectionName === section);
              const sectionId = sectionSeats[0]?.sectionId || 'platea';
              const expanded = expandedSection === section;
              const sectionStats = {
                total: sectionSeats.length,
                ocupado: sectionSeats.filter((s) => inventory[s.id]?.status === 'ocupado').length,
                reservado: sectionSeats.filter((s) => inventory[s.id]?.status === 'reservado').length,
                disponible: sectionSeats.filter((s) => {
                  const st = inventory[s.id]?.status;
                  return !st || st === 'disponible';
                }).length,
              };

              return (
                <div key={section} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedSection(expanded ? null : section)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm font-bold text-slate-800">{section}</span>
                      <span className="text-[11px] text-slate-500">({sectionStats.total} asientos)</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-emerald-600 font-bold">{sectionStats.disponible} disp.</span>
                      <span className="text-rose-600 font-bold">{sectionStats.ocupado} ocup.</span>
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                      <div className="flex flex-wrap gap-1.5">
                        {sectionSeats.slice(0, 40).map((seat) => {
                          const st: SeatStatus = inventory[seat.id]?.status || (seat.defaultBlocked ? 'bloqueado' : 'disponible');
                          const colors: Record<SeatStatus, string> = {
                            disponible: 'bg-emerald-500 text-white',
                            seleccionado: 'bg-amber-400 text-slate-900',
                            reservado: 'bg-purple-500 text-white',
                            ocupado: 'bg-rose-500 text-white',
                            bloqueado: 'bg-slate-400 text-white',
                          };
                          return (
                            <div
                              key={seat.id}
                              className={`w-7 h-7 rounded text-[9px] font-bold flex items-center justify-center ${colors[st]}`}
                              title={`${seat.label} - ${st}`}
                            >
                              {seat.number}
                            </div>
                          );
                        })}
                        {sectionSeats.length > 40 && (
                          <div className="w-7 h-7 rounded bg-slate-200 text-slate-500 text-[9px] flex items-center justify-center font-bold">
                            +{sectionSeats.length - 40}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========== RESERVATIONS TAB ========== */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            {/* Reservation stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-700">Pendientes</span>
                </div>
                <div className="text-2xl font-black text-amber-900">
                  {reservations.filter((r) => r.status === 'pendiente').length}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-semibold text-emerald-700">Confirmadas</span>
                </div>
                <div className="text-2xl font-black text-emerald-900">
                  {reservations.filter((r) => r.status === 'confirmada').length}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span className="text-[11px] font-semibold text-rose-700">Expiradas</span>
                </div>
                <div className="text-2xl font-black text-rose-900">
                  {reservations.filter((r) => r.status === 'expirada').length}
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CircleDollarSign className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-semibold text-indigo-700">Ingresos</span>
                </div>
                <div className="text-lg font-black text-indigo-900">
                  {formatCOP(reservations.filter((r) => r.status === 'confirmada').reduce((s, r) => s + r.totalAmount, 0))}
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              {(['todas', 'pendiente', 'confirmada', 'expirada', 'cancelada'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setReservationFilter(f)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer capitalize ${
                    reservationFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'todas' ? 'Todas' : f}
                </button>
              ))}
            </div>

            {/* Reservations table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Referencia</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Cliente</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Presentación</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Asientos</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Monto</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Estado</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Vence</th>
                      <th className="text-left px-3 py-2.5 font-bold text-slate-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                          No hay reservas {reservationFilter !== 'todas' ? `con estado "${reservationFilter}"` : ''}.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((r) => {
                        const isExpired = r.expiresAtMs < Date.now();
                        const remaining = r.expiresAtMs - Date.now();
                        const hoursLeft = Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
                        const minsLeft = Math.max(0, Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)));

                        return (
                          <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                              {r.paymentReference}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-slate-900">{r.customer.fullName}</div>
                              <div className="text-[10px] text-slate-500">{r.customer.email}</div>
                            </td>
                            <td className="px-3 py-2.5 text-slate-700">
                              <span className="font-semibold">{r.presentationTitle}</span>
                              <div className="text-[10px] text-slate-500">{r.presentationDate} • {r.presentationTime}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {r.seats.slice(0, 3).map((s) => (
                                  <span key={s.id} className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                    {s.row}-{s.number}
                                  </span>
                                ))}
                                {r.seats.length > 3 && (
                                  <span className="text-[10px] text-slate-500">+{r.seats.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-900">
                              {formatCOP(r.totalAmount)}
                            </td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={r.status} isExpired={isExpired} />
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {r.status === 'pendiente' && !isExpired ? (
                                <span className="font-mono text-[11px]">
                                  {hoursLeft}h {minsLeft}m
                                </span>
                              ) : isExpired ? (
                                <span className="text-rose-500 font-semibold">Venció</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => {
                                  setSelectedReservation(r);
                                  setShowReservationDetail(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Ver detalle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reservation Detail Modal */}
            {showReservationDetail && selectedReservation && (
              <ReservationDetailModal
                reservation={selectedReservation}
                onClose={() => { setShowReservationDetail(false); setSelectedReservation(null); }}
                onConfirm={onConfirmPayment}
              />
            )}
          </div>
        )}

        {/* ========== REPORTS TAB ========== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Revenue summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDollarSign className="w-5 h-5 opacity-80" />
                  <span className="text-xs font-semibold opacity-80">Ingresos Confirmados</span>
                </div>
                <div className="text-2xl font-black">{formatCOP(reportData.totalRevenue)}</div>
                <div className="text-[11px] opacity-70 mt-1">{reportData.confirmedCount} reservas pagadas</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Hourglass className="w-5 h-5 opacity-80" />
                  <span className="text-xs font-semibold opacity-80">Pendientes por Cobrar</span>
                </div>
                <div className="text-2xl font-black">{formatCOP(reportData.pendingRevenue)}</div>
                <div className="text-[11px] opacity-70 mt-1">{reportData.pendingCount} reservas pendientes</div>
              </div>
              <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 opacity-80" />
                  <span className="text-xs font-semibold opacity-80">Ingresos Perdidos</span>
                </div>
                <div className="text-2xl font-black">{formatCOP(reportData.lostRevenue)}</div>
                <div className="text-[11px] opacity-70 mt-1">{reportData.expiredCount} reservas expiradas</div>
              </div>
            </div>

            {/* Revenue by presentation */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Ingresos por Presentación
              </h3>
              <div className="space-y-3">
                {presentations.map((pres) => {
                  const presReservations = reservations.filter(
                    (r) => r.presentationId === pres.id && r.status === 'confirmada'
                  );
                  const presRevenue = presReservations.reduce((s, r) => s + r.totalAmount, 0);
                  const maxRevenue = Math.max(
                    ...presentations.map((p) =>
                      reservations
                        .filter((r) => r.presentationId === p.id && r.status === 'confirmada')
                        .reduce((s, r) => s + r.totalAmount, 0)
                    ),
                    1
                  );
                  const barWidth = (presRevenue / maxRevenue) * 100;

                  return (
                    <div key={pres.id} className="flex items-center gap-3">
                      <div className="w-28 sm:w-36 shrink-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{pres.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{pres.title}</div>
                      </div>
                      <div className="flex-1 bg-slate-200 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${pres.accentColor} transition-all duration-500`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="w-24 text-right shrink-0">
                        <div className="text-xs font-bold text-slate-900">{formatCOP(presRevenue)}</div>
                        <div className="text-[10px] text-slate-500">{presReservations.length} ventas</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sales by status breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-500" />
                  Resumen de Ventas
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Pendientes
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-amber-700">{reportData.pendingCount}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="font-semibold text-slate-700">{formatCOP(reportData.pendingRevenue)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Confirmadas
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700">{reportData.confirmedCount}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="font-semibold text-slate-700">{formatCOP(reportData.totalRevenue)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Expiradas
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-rose-700">{reportData.expiredCount}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="font-semibold text-slate-700">{formatCOP(reportData.lostRevenue)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Canceladas
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-slate-700">{reportData.cancelledCount}</span>
                      <span className="text-slate-400 mx-1">•</span>
                      <span className="font-semibold text-slate-700">{formatCOP(reportData.cancelledRevenue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  Métricas Clave
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Total de reservas:</span>
                    <span className="font-bold text-slate-900">{reservations.length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tasa de conversión:</span>
                    <span className="font-bold text-emerald-700">{reportData.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Promedio por venta:</span>
                    <span className="font-bold text-slate-900">{formatCOP(reportData.avgTicket)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Asientos totales:</span>
                    <span className="font-bold text-slate-900">{seats.length}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Ocupación efectiva:</span>
                    <span className="font-bold text-indigo-700">{stats.occupancyRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== USERS TAB ========== */}
        {activeTab === 'users' && hasRole('admin') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Usuarios del Sistema ({users.length})
              </h3>
              <button
                onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Agregar Usuario
              </button>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`border rounded-xl p-3 flex items-center justify-between gap-3 transition-all ${
                    u.active
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                        u.role === 'admin'
                          ? 'bg-amber-500'
                          : u.role === 'taquillero'
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                      }`}
                    >
                      {u.role === 'admin' ? <Shield className="w-4 h-4" /> : u.role === 'taquillero' ? <Ticket className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'taquillero'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.role}
                    </span>
                    {!u.active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        Inactivo
                      </span>
                    )}
                    <button
                      onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar usuario ${u.fullName}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== SETTINGS TAB ========== */}
        {activeTab === 'settings' && hasRole('admin') && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" />
              Configuración General
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  Precio por Boleta
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={ticketPrice}
                    id="price-input"
                    className="w-40 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('price-input') as HTMLInputElement;
                      const val = parseInt(input.value, 10);
                      if (!isNaN(val) && val > 0) onUpdateTicketPrice(val);
                    }}
                    className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500 mb-2">
                  <strong>Info del sistema:</strong> localStorage, sin backend.
                  Los datos se persisten en el navegador.
                </p>
                <p className="text-xs text-slate-500">
                  <strong>Reservas expiran:</strong> 48 horas (modo producción) / 45 segundos (modo demo).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onSave={(data) => {
            if (editingUser) {
              updateUser(editingUser.id, data);
            } else {
              addUser({
                ...data,
                active: true,
              });
            }
            setShowUserModal(false);
          }}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </div>
  );
};

// User Create/Edit Modal
interface UserModalProps {
  user: User | null;
  onSave: (data: Partial<User>) => void;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onSave, onClose }) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState(user?.password || '');
  const [role, setRole] = useState<'admin' | 'taquillero' | 'espectador'>(user?.role || 'espectador');
  const [active, setActive] = useState(user?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, email, password, role, active });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Contraseña</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'taquillero' | 'espectador')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="admin">Administrador</option>
              <option value="taquillero">Taquillero</option>
              <option value="espectador">Espectador</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded"
            />
            <label className="text-xs font-bold text-slate-700">Activo</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 cursor-pointer"
            >
              {user ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Status Badge for reservations
const StatusBadge: React.FC<{ status: string; isExpired?: boolean }> = ({ status, isExpired }) => {
  if (isExpired && status === 'pendiente') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Expirada
      </span>
    );
  }

  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pendiente: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pendiente' },
    confirmada: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmada' },
    expirada: { bg: 'bg-rose-100 text-rose-700 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Expirada' },
    cancelada: { bg: 'bg-slate-100 text-slate-600 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Cancelada' },
  };

  const c = config[status] || config.pendiente;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// Reservation Detail Modal
interface ReservationDetailModalProps {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  reservation,
  onClose,
  onConfirm,
}) => {
  const r = reservation;
  const isExpired = r.expiresAtMs < Date.now();
  const remaining = Math.max(0, r.expiresAtMs - Date.now());
  const hoursLeft = Math.floor(remaining / (1000 * 60 * 60));
  const minsLeft = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-900">Detalle de Reserva</h3>
            <p className="text-xs text-slate-500 font-mono">{r.paymentReference}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <StatusBadge status={r.status} isExpired={isExpired} />
            {r.status === 'pendiente' && !isExpired && (
              <span className="text-xs font-mono text-slate-600">
                Expira en {hoursLeft}h {minsLeft}m
              </span>
            )}
          </div>

          {/* Customer info */}
          <div className="bg-slate-50 rounded-xl p-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Datos del Cliente</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Nombre:</span> <span className="font-semibold">{r.customer.fullName}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-semibold">{r.customer.email}</span></div>
              <div><span className="text-slate-500">Teléfono:</span> <span className="font-semibold">{r.customer.phone}</span></div>
              <div><span className="text-slate-500">Documento:</span> <span className="font-semibold">{r.customer.documentType} {r.customer.documentNumber}</span></div>
              <div><span className="text-slate-500">Estudiante:</span> <span className="font-semibold">{r.customer.studentName}</span></div>
              <div><span className="text-slate-500">Grado:</span> <span className="font-semibold">{r.customer.studentGrade}</span></div>
            </div>
          </div>

          {/* Presentation */}
          <div className="bg-indigo-50 rounded-xl p-3">
            <h4 className="text-xs font-bold text-indigo-700 mb-2">Presentación</h4>
            <div className="text-xs space-y-1">
              <div className="font-bold text-indigo-900">{r.presentationTitle}</div>
              <div className="text-indigo-700">{r.presentationDate} • {r.presentationTime}</div>
            </div>
          </div>

          {/* Seats */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">Asientos ({r.seats.length})</h4>
            <div className="flex flex-wrap gap-1.5">
              {r.seats.map((s) => (
                <span key={s.id} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg text-[11px] font-bold">
                  {s.sectionName} • Fila {s.row} • #{s.number}
                </span>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-emerald-50 rounded-xl p-3">
            <h4 className="text-xs font-bold text-emerald-700 mb-2">Pago</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-700">Total a consignar:</span>
              <span className="text-lg font-black text-emerald-900">{formatCOP(r.totalAmount)}</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-1">
              Referencia: <span className="font-mono font-bold">{r.paymentReference}</span>
            </div>
          </div>

          {/* Actions */}
          {r.status === 'pendiente' && !isExpired && (
            <button
              onClick={() => { onConfirm(r.id); onClose(); }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Pago Recibido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
