import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  PresentationId,
  Seat,
  SeatStatus,
  Reservation,
  SeatInventory,
  SeatInventoryEntry,
  TheaterInventoryByPresentation,
} from './types';
import {
  DEFAULT_TICKET_PRICE,
  generateTheaterSeats,
  formatCOP,
} from './data/theaterData';
import {
  PRESENTATIONS,
  loadInventories,
  saveInventory,
  createInitialInventory,
  STORAGE_PRICE_KEY,
} from './data/eventsData';
import {
  loadReservations,
  createReservation,
  confirmReservation,
  cleanupExpiredReservations,
  syncInventoryWithReservations,
  formatRemaining,
} from './data/reservations';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { TheaterMap } from './components/TheaterMap';
import { CartSidebar } from './components/CartSidebar';
import { ReservationModal } from './components/ReservationModal';
import { TicketReceiptModal } from './components/TicketReceiptModal';
import { DashboardAdmin } from './components/DashboardAdmin';
import { InfoModal } from './components/InfoModal';
import {
  Sparkles,
  Calendar,
  Clock,
  HelpCircle,
  Settings,
  Hourglass,
  Building2,
  ShoppingCart,
  ArrowRight,
  LogOut,
  BarChart3,
} from 'lucide-react';

const RESERVATION_CLEANUP_INTERVAL_MS = 15 * 1000;

function AppContent() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'dashboard'>('home');

  // 1. Variable global de precio por boleta (modificable)
  const [ticketPrice, setTicketPrice] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRICE_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_TICKET_PRICE;
    } catch {
      return DEFAULT_TICKET_PRICE;
    }
  });

  // 2. Presentación seleccionada
  const [currentPresentationId, setCurrentPresentationId] =
    useState<PresentationId>('primaria');

  // 3. Reservas persistidas
  const [reservations, setReservations] = useState<Reservation[]>(() => loadReservations());

  // 4. Inventario por presentación (formato entry con status/expiresAt/reservationId)
  const [inventories, setInventories] =
    useState<TheaterInventoryByPresentation>(() => loadInventories(ticketPrice));

  // 5. Asientos seleccionados (carrito activo)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  // 6. Estado UI (modales + reloj global)
  const [isReservationOpen, setIsReservationOpen] = useState<boolean>(false);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  const allSeats = useMemo(
    () => generateTheaterSeats(ticketPrice),
    [ticketPrice]
  );

  const currentPresentation = useMemo(
    () =>
      PRESENTATIONS.find((p) => p.id === currentPresentationId) ||
      PRESENTATIONS[0],
    [currentPresentationId]
  );

  const resolveSeatStatus = useCallback(
    (seat: Seat, inventory: SeatInventory): SeatStatus => {
      const entry = inventory[seat.id];
      if (entry) return entry.status;
      return seat.defaultBlocked ? 'bloqueado' : 'disponible';
    },
    []
  );

  // Inventario efectivo: combina lo persistido con las reservas activas.
  const effectiveInventories = useMemo(() => {
    const next: TheaterInventoryByPresentation = {
      preescolar: {},
      primaria: {},
      bachillerato: {},
    };
    (Object.keys(inventories) as PresentationId[]).forEach((pid) => {
      next[pid] = syncInventoryWithReservations(inventories[pid] || {}, reservations, now);
    });
    return next;
  }, [inventories, reservations, now]);

  const currentInventory = useMemo(
    () => effectiveInventories[currentPresentationId] || {},
    [effectiveInventories, currentPresentationId]
  );

  const selectedSeats = useMemo(() => {
    return allSeats.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [allSeats, selectedSeatIds]);

  // Tick de 1s para refrescar "now"
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Limpieza inicial (sólo una vez)
  const initialCleanupDoneRef = useRef(false);
  useEffect(() => {
    if (initialCleanupDoneRef.current) return;
    initialCleanupDoneRef.current = true;
    const current = loadReservations();
    const { updatedReservations, seatsToRelease } = cleanupExpiredReservations(current);
    if (seatsToRelease.length > 0) {
      setInventories((prev) => {
        const updated = { ...prev };
        (Object.keys(updated) as PresentationId[]).forEach((pid) => {
          const inv = { ...updated[pid] };
          for (const seatId of seatsToRelease) {
            if (inv[seatId] && inv[seatId].status === 'reservado') {
              inv[seatId] = { status: 'disponible' };
            }
          }
          updated[pid] = inv;
          saveInventory(pid, updated[pid]);
        });
        return updated;
      });
    }
    if (
      updatedReservations.length !== current.length ||
      updatedReservations.some((r, i) => r.status !== current[i]?.status)
    ) {
      setReservations(updatedReservations);
    }
  }, []);

  // Auto-cleanup periódico
  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = loadReservations();
      const { expiredIds, seatsToRelease, updatedReservations } =
        cleanupExpiredReservations(current);
      if (expiredIds.length === 0) return;
      setInventories((prev) => {
        const updated = { ...prev };
        (Object.keys(updated) as PresentationId[]).forEach((pid) => {
          const inv = { ...updated[pid] };
          let touched = false;
          for (const seatId of seatsToRelease) {
            if (inv[seatId] && inv[seatId].status === 'reservado') {
              inv[seatId] = { status: 'disponible' };
              touched = true;
            }
          }
          if (touched) {
            updated[pid] = inv;
            saveInventory(pid, updated[pid]);
          }
        });
        return updated;
      });
      setReservations(updatedReservations);
    }, RESERVATION_CLEANUP_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  // Helpers inventario
  const updateInventorySeat = useCallback(
    (pid: PresentationId, seatId: string, entry: SeatInventoryEntry) => {
      setInventories((prev) => {
        const updated = { ...(prev[pid] || {}), [seatId]: entry };
        const nextState = { ...prev, [pid]: updated };
        saveInventory(pid, updated);
        return nextState;
      });
    },
    []
  );

  const updateManySeats = useCallback(
    (pid: PresentationId, entries: Record<string, SeatInventoryEntry>) => {
      setInventories((prev) => {
        const updated = { ...(prev[pid] || {}), ...entries };
        const nextState = { ...prev, [pid]: updated };
        saveInventory(pid, updated);
        return nextState;
      });
    },
    []
  );

  const handleUpdateTicketPrice = (newPrice: number) => {
    setTicketPrice(newPrice);
    try {
      localStorage.setItem(STORAGE_PRICE_KEY, newPrice.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPresentation = (id: PresentationId) => {
    setCurrentPresentationId(id);
    setSelectedSeatIds([]);
  };

  const handleSeatClick = (seat: Seat) => {
    const status = resolveSeatStatus(seat, currentInventory);

    if (status === 'ocupado' || status === 'bloqueado' || status === 'reservado') {
      return;
    }

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
      updateInventorySeat(currentPresentationId, seat.id, { status: 'disponible' });
    } else {
      setSelectedSeatIds((prev) => [...prev, seat.id]);
      updateInventorySeat(currentPresentationId, seat.id, { status: 'seleccionado' });
    }
  };

  const handleRemoveSelectedSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
    updateInventorySeat(currentPresentationId, seatId, { status: 'disponible' });
  };

  const handleClearSelection = () => {
    const entries: Record<string, SeatInventoryEntry> = {};
    selectedSeatIds.forEach((id) => {
      entries[id] = { status: 'disponible' };
    });
    setSelectedSeatIds([]);
    updateManySeats(currentPresentationId, entries);
  };

  const handleReservationCreated = useCallback(
    (reservation: Reservation) => {
      const entries: Record<string, SeatInventoryEntry> = {};
      reservation.seats.forEach((seat) => {
        entries[seat.id] = {
          status: 'reservado',
          reservationExpiresAt: reservation.expiresAtMs,
          reservationId: reservation.id,
        };
      });
      updateManySeats(currentPresentationId, entries);

      const existing = loadReservations();
      setReservations(existing);

      setSelectedSeatIds([]);
      setIsReservationOpen(false);
      setActiveReservation(reservation);
    },
    [currentPresentationId, updateManySeats]
  );

  const handleConfirmPaymentReceived = useCallback(
    (reservationId: string) => {
      confirmReservation(reservationId);
      const reservationsNow = loadReservations();
      setReservations(reservationsNow);

      const updated = reservationsNow.find((r) => r.id === reservationId);
      if (!updated) return;

      const entries: Record<string, SeatInventoryEntry> = {};
      updated.seats.forEach((seat) => {
        entries[seat.id] = { status: 'ocupado' };
      });
      updateManySeats(currentPresentationId, entries);
      setActiveReservation({ ...updated, status: 'confirmada' });
    },
    [currentPresentationId, updateManySeats]
  );

  const handleUpdateSeatStatus = (seatId: string, newStatus: SeatStatus) => {
    updateInventorySeat(currentPresentationId, seatId, {
      status: newStatus,
      reservationExpiresAt: undefined,
      reservationId: undefined,
    });
  };

  const handleBatchUpdateRow = (rowLetter: string, newStatus: SeatStatus) => {
    const entries: Record<string, SeatInventoryEntry> = {};
    allSeats
      .filter((s) => s.row === rowLetter)
      .forEach((s) => {
        entries[s.id] = {
          status: newStatus,
          reservationExpiresAt: undefined,
          reservationId: undefined,
        };
      });
    updateManySeats(currentPresentationId, entries);
  };

  const handleBatchUpdateSection = (sectionId: string, newStatus: SeatStatus) => {
    const entries: Record<string, SeatInventoryEntry> = {};
    allSeats
      .filter((s) => s.sectionId === sectionId)
      .forEach((s) => {
        entries[s.id] = {
          status: newStatus,
          reservationExpiresAt: undefined,
          reservationId: undefined,
        };
      });
    updateManySeats(currentPresentationId, entries);
  };

  const handleResetPresentation = (presentationId: PresentationId) => {
    const initial = createInitialInventory(presentationId, ticketPrice);
    setInventories((prev) => ({ ...prev, [presentationId]: initial }));
    saveInventory(presentationId, initial);
    setSelectedSeatIds([]);
  };

  const handleSimulateFullHouse = (presentationId: PresentationId) => {
    const entries: Record<string, SeatInventoryEntry> = {};
    allSeats.forEach((seat, idx) => {
      if (seat.defaultBlocked) {
        entries[seat.id] = { status: 'bloqueado' };
      } else {
        entries[seat.id] = { status: idx % 3 !== 0 ? 'ocupado' : 'disponible' };
      }
    });
    updateManySeats(presentationId, entries);
    setSelectedSeatIds([]);
  };

  const soonExpiring = useMemo(() => {
    return reservations.filter(
      (r) =>
        r.status === 'pendiente' &&
        r.presentationId === currentPresentationId &&
        r.expiresAtMs - now < 6 * 60 * 60 * 1000 &&
        r.expiresAtMs > now
    );
  }, [reservations, currentPresentationId, now]);

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <LoginPage
        onSkipLogin={() => {
          // Allow public access without login
        }}
      />
    );
  }

  // Dashboard full-page view
  if (activeView === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Dashboard nav bar */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-4 py-2 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveView('home')}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                ← Volver al Teatro
              </button>
              <span className="text-slate-600">|</span>
              <span className="text-sm font-bold text-amber-400">Panel de Administración</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                {user?.fullName}
                <span className="text-amber-400 ml-1 capitalize">({user?.role})</span>
              </span>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <DashboardAdmin
            presentations={PRESENTATIONS}
            currentPresentation={currentPresentation}
            onSelectPresentation={handleSelectPresentation}
            seats={allSeats}
            inventory={currentInventory}
            ticketPrice={ticketPrice}
            reservations={reservations}
            onUpdateTicketPrice={handleUpdateTicketPrice}
            onUpdateSeatStatus={handleUpdateSeatStatus}
            onBatchUpdateRow={handleBatchUpdateRow}
            onBatchUpdateSection={handleBatchUpdateSection}
            onResetPresentation={handleResetPresentation}
            onSimulateFullHouse={handleSimulateFullHouse}
            onClose={() => setActiveView('home')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        presentations={PRESENTATIONS}
        currentPresentation={currentPresentation}
        onSelectPresentation={handleSelectPresentation}
        ticketPrice={ticketPrice}
        selectedCount={selectedSeats.length}
        isAdminOpen={isAdminOpen}
        onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onGoToDashboard={() => setActiveView('dashboard')}
        userRole={user?.role}
      />

      {/* User bar */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-indigo-700">
            <span className="font-semibold">Sesión:</span>
            <span className="font-bold">{user?.fullName}</span>
            <span className="text-indigo-400">•</span>
            <span className="capitalize font-semibold text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full text-[10px]">
              {user?.role}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {hasRole('admin', 'taquillero') && (
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3 h-3" />
                <span>Dashboard</span>
              </button>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1 text-indigo-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black shrink-0">
              🎭
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {currentPresentation.title}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                  {currentPresentation.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentPresentation.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium uppercase">
                Precio por boleta
              </span>
              <span className="font-black text-emerald-600 text-sm sm:text-base">
                {formatCOP(ticketPrice)}
              </span>
            </div>
            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Ver guía de asientos"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {soonExpiring.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Hourglass className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-900">
                  {soonExpiring.length === 1
                    ? 'Una reserva está por expirar'
                    : `${soonExpiring.length} reservas están por expirar`}
                </p>
                <p className="text-amber-800 mt-0.5">
                  Si no se confirma el pago por consignación, los asientos
                  volverán a estar disponibles automáticamente.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-right">
              {soonExpiring.slice(0, 3).map((r) => (
                <span
                  key={r.id}
                  className="font-mono text-[11px] text-amber-900"
                >
                  {r.paymentReference}:{' '}
                  <strong className="font-bold">{formatRemaining(r.expiresAtMs, now)}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 xl:col-span-9 space-y-4 pb-48 sm:pb-0">
            <TheaterMap
              seats={allSeats}
              seatStatusMap={currentInventory}
              onSeatClick={handleSeatClick}
              selectedSeats={selectedSeats}
              ticketPrice={ticketPrice}
            />
          </div>

          <div className="hidden sm:block lg:col-span-4 xl:col-span-3 sticky top-24">
            <CartSidebar
              selectedSeats={selectedSeats}
              presentation={currentPresentation}
              ticketPrice={ticketPrice}
              onRemoveSeat={handleRemoveSelectedSeat}
              onClearSelection={handleClearSelection}
              onProceedToPayment={() => setIsReservationOpen(true)}
            />
          </div>
        </div>

        {/* Mobile sticky cart bar */}
        {selectedSeats.length > 0 && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl px-4 py-3 safe-area-pb">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {selectedSeats.length} {selectedSeats.length === 1 ? 'asiento' : 'asientos'}
                  </div>
                  <div className="text-[11px] font-black text-indigo-900">
                    {formatCOP(selectedSeats.length * ticketPrice)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsReservationOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Hourglass className="w-4 h-4" />
                <span>Reservar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-slate-300 mt-12 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-bold text-white">
                Colegio Mayor • Sistema de Boletería y Asignación de Teatro Escolar
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 justify-center sm:justify-start">
                <Building2 className="w-3 h-3 inline" />
                Reserva por consignación bancaria • Todos los derechos reservados 2026
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <button
                onClick={() => setIsInfoOpen(true)}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Guía de Uso
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveView('dashboard')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Taquilla Administrativa
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                <svg
                  width="18"
                  height="18"
                  viewBox="-11.5 -10.23174 23 20.46348"
                  className="text-cyan-400"
                  fill="currentColor"
                  aria-label="React"
                >
                  <circle cx="0" cy="0" r="2.05" />
                  <g stroke="currentColor" strokeWidth="1" fill="none">
                    <ellipse rx="11" ry="4.2" />
                    <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                    <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                  </g>
                </svg>
                <span className="font-bold text-white text-[11px] tracking-wide uppercase">
                  React 19
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 32 32"
                  fill="none"
                  className="text-purple-400"
                  aria-label="Vite"
                >
                  <path
                    d="M29 5 17 28l-2-7 14-16Zm-7 1L4 24l5-1 13-17Zm-5 16-3 5-2-3 4-6 1 4Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="font-bold text-white text-[11px] tracking-wide uppercase">
                  Vite 6
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  className="text-blue-400"
                  fill="currentColor"
                  aria-label="TypeScript"
                >
                  <rect width="24" height="24" rx="3" />
                </svg>
                <span className="font-bold text-white text-[11px] tracking-wide uppercase">
                  TypeScript
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center sm:text-right">
              <p className="font-bold text-slate-400 uppercase tracking-wider">
                Construido con React + Vite + TypeScript
              </p>
              <p className="mt-0.5">Demo • Teatro Escolar 2026</p>
            </div>
          </div>
        </div>
      </footer>

      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        selectedSeats={selectedSeats}
        presentation={currentPresentation}
        ticketPrice={ticketPrice}
        onReservationCreated={handleReservationCreated}
      />

      <TicketReceiptModal
        reservation={activeReservation}
        onClose={() => setActiveReservation(null)}
        onConfirmPayment={handleConfirmPaymentReceived}
      />

      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        ticketPrice={ticketPrice}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
