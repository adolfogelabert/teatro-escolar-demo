import React, { useState, useEffect, useMemo } from 'react';
import {
  PresentationId,
  Seat,
  SeatStatus,
  PurchaseReceipt,
  TheaterInventoryByPresentation,
  SeatInventory,
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
import { Header } from './components/Header';
import { TheaterMap } from './components/TheaterMap';
import { CartSidebar } from './components/CartSidebar';
import { DaviviendaModal } from './components/DaviviendaModal';
import { TicketReceiptModal } from './components/TicketReceiptModal';
import { AdminPanel } from './components/AdminPanel';
import { InfoModal } from './components/InfoModal';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  HelpCircle,
  Settings,
  Flame,
} from 'lucide-react';

export default function App() {
  // 1. Variable global de precio por boleta (modificable)
  const [ticketPrice, setTicketPrice] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRICE_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_TICKET_PRICE;
    } catch {
      return DEFAULT_TICKET_PRICE;
    }
  });

  // 2. Presentación seleccionada (Preescolar, Primaria, Bachillerato)
  const [currentPresentationId, setCurrentPresentationId] =
    useState<PresentationId>('primaria');

  // 3. Inventario independiente por cada presentación
  const [inventories, setInventories] =
    useState<TheaterInventoryByPresentation>(() => loadInventories(ticketPrice));

  // 4. Asientos seleccionados actualmente para compra
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  // 5. Modales y estados de UI
  const [isDaviviendaOpen, setIsDaviviendaOpen] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<PurchaseReceipt | null>(
    null
  );
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  // Generación de la estructura del teatro completa
  const allSeats = useMemo(
    () => generateTheaterSeats(ticketPrice),
    [ticketPrice]
  );

  // Presentación activa
  const currentPresentation = useMemo(
    () =>
      PRESENTATIONS.find((p) => p.id === currentPresentationId) ||
      PRESENTATIONS[0],
    [currentPresentationId]
  );

  // Inventario de la presentación activa
  const currentInventory = useMemo(
    () => inventories[currentPresentationId] || {},
    [inventories, currentPresentationId]
  );

  // Lista de objetos Seat seleccionados
  const selectedSeats = useMemo(() => {
    return allSeats.filter((seat) => selectedSeatIds.includes(seat.id));
  }, [allSeats, selectedSeatIds]);

  // Guardar cambios de precio en localStorage
  const handleUpdateTicketPrice = (newPrice: number) => {
    setTicketPrice(newPrice);
    try {
      localStorage.setItem(STORAGE_PRICE_KEY, newPrice.toString());
    } catch (e) {
      console.error(e);
    }
  };

  // Cambio de presentación (limpia selección pendiente para evitar confusiones entre funciones)
  const handleSelectPresentation = (id: PresentationId) => {
    setCurrentPresentationId(id);
    setSelectedSeatIds([]);
  };

  // Manejador del clic en un asiento del teatro:
  // - Si está disponible -> pasa a seleccionado
  // - Si está seleccionado -> se deselecciona (vuelve a disponible)
  // - Si está ocupado o bloqueado -> no responde
  const handleSeatClick = (seat: Seat) => {
    const status: SeatStatus =
      currentInventory[seat.id] ||
      (seat.defaultBlocked ? 'bloqueado' : 'disponible');

    if (status === 'ocupado' || status === 'bloqueado') {
      return; // No responde al clic
    }

    if (selectedSeatIds.includes(seat.id)) {
      // Deseleccionar
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
      const updatedInv = { ...currentInventory, [seat.id]: 'disponible' as SeatStatus };
      setInventories((prev) => ({
        ...prev,
        [currentPresentationId]: updatedInv,
      }));
      saveInventory(currentPresentationId, updatedInv);
    } else {
      // Seleccionar
      setSelectedSeatIds((prev) => [...prev, seat.id]);
      const updatedInv = { ...currentInventory, [seat.id]: 'seleccionado' as SeatStatus };
      setInventories((prev) => ({
        ...prev,
        [currentPresentationId]: updatedInv,
      }));
      saveInventory(currentPresentationId, updatedInv);
    }
  };

  // Remover asiento desde el carrito
  const handleRemoveSelectedSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
    const updatedInv = { ...currentInventory, [seatId]: 'disponible' as SeatStatus };
    setInventories((prev) => ({
      ...prev,
      [currentPresentationId]: updatedInv,
    }));
    saveInventory(currentPresentationId, updatedInv);
  };

  // Limpiar todos los seleccionados
  const handleClearSelection = () => {
    const updatedInv = { ...currentInventory };
    selectedSeatIds.forEach((id) => {
      updatedInv[id] = 'disponible';
    });
    setSelectedSeatIds([]);
    setInventories((prev) => ({
      ...prev,
      [currentPresentationId]: updatedInv,
    }));
    saveInventory(currentPresentationId, updatedInv);
  };

  // Confirmación exitosa de pago Davivienda:
  // Cambia todos los asientos seleccionados a "ocupado/pagado" permanentemente
  const handlePaymentSuccess = (receipt: PurchaseReceipt) => {
    const updatedInv = { ...currentInventory };
    receipt.seats.forEach((seat) => {
      updatedInv[seat.id] = 'ocupado';
    });

    setInventories((prev) => ({
      ...prev,
      [currentPresentationId]: updatedInv,
    }));
    saveInventory(currentPresentationId, updatedInv);

    setSelectedSeatIds([]);
    setIsDaviviendaOpen(false);
    setActiveReceipt(receipt);
  };

  // ========================================================
  // ACCIONES ADMINISTRATIVAS (PANEL ADMIN)
  // ========================================================
  const handleUpdateSeatStatus = (seatId: string, newStatus: SeatStatus) => {
    const updatedInv = { ...currentInventory, [seatId]: newStatus };
    setInventories((prev) => ({
      ...prev,
      [currentPresentationId]: updatedInv,
    }));
    saveInventory(currentPresentationId, updatedInv);
  };

  const handleBatchUpdateRow = (rowLetter: string, newStatus: SeatStatus) => {
    const updatedInv = { ...currentInventory };
    allSeats
      .filter((s) => s.row === rowLetter)
      .forEach((s) => {
        updatedInv[s.id] = newStatus;
      });

    setInventories((prev) => ({
      ...prev,
      [currentPresentationId]: updatedInv,
    }));
    saveInventory(currentPresentationId, updatedInv);
  };

  const handleBatchUpdateSection = (sectionId: string, newStatus: SeatStatus) => {
    const updatedInv = { ...currentInventory };
    allSeats
      .filter((s) => s.sectionId === sectionId)
      .forEach((s) => {
        updatedInv[s.id] = newStatus;
      });

    setInventories((prev) => ({
      ...prev,
      [currentPresentationId]: updatedInv,
    }));
    saveInventory(currentPresentationId, updatedInv);
  };

  const handleResetPresentation = (presentationId: PresentationId) => {
    const initial = createInitialInventory(presentationId, ticketPrice);
    setInventories((prev) => ({
      ...prev,
      [presentationId]: initial,
    }));
    saveInventory(presentationId, initial);
    setSelectedSeatIds([]);
  };

  const handleSimulateFullHouse = (presentationId: PresentationId) => {
    const updatedInv = { ...currentInventory };
    allSeats.forEach((seat, idx) => {
      if (seat.defaultBlocked) {
        updatedInv[seat.id] = 'bloqueado';
      } else {
        // ~65% ocupados
        updatedInv[seat.id] = idx % 3 !== 0 ? 'ocupado' : 'disponible';
      }
    });

    setInventories((prev) => ({
      ...prev,
      [presentationId]: updatedInv,
    }));
    saveInventory(presentationId, updatedInv);
    setSelectedSeatIds([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 1. Header institucional y selector de función */}
      <Header
        presentations={PRESENTATIONS}
        currentPresentation={currentPresentation}
        onSelectPresentation={handleSelectPresentation}
        ticketPrice={ticketPrice}
        selectedCount={selectedSeats.length}
        isAdminOpen={isAdminOpen}
        onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)}
        onOpenInfo={() => setIsInfoOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {/* Panel Administrativo (Desplegable) */}
        {isAdminOpen && (
          <AdminPanel
            presentations={PRESENTATIONS}
            currentPresentation={currentPresentation}
            onSelectPresentation={handleSelectPresentation}
            seats={allSeats}
            inventory={currentInventory}
            ticketPrice={ticketPrice}
            onUpdateTicketPrice={handleUpdateTicketPrice}
            onUpdateSeatStatus={handleUpdateSeatStatus}
            onBatchUpdateRow={handleBatchUpdateRow}
            onBatchUpdateSection={handleBatchUpdateSection}
            onResetPresentation={handleResetPresentation}
            onSimulateFullHouse={handleSimulateFullHouse}
            onClose={() => setIsAdminOpen(false)}
          />
        )}

        {/* Presentation Context Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black shrink-0">
              🎭
            </div>
            <div>
              <div className="flex items-center gap-2">
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
                Boleta Oficial
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

        {/* Layout Grid: Plano del Teatro (Principal) + Carrito de Compra (Lateral) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda / Centro: Plano Real del Teatro */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <TheaterMap
              seats={allSeats}
              seatStatusMap={currentInventory}
              onSeatClick={handleSeatClick}
              selectedSeats={selectedSeats}
              ticketPrice={ticketPrice}
            />
          </div>

          {/* Columna Derecha: Resumen de Selección y Pasarela Davivienda */}
          <div className="lg:col-span-4 xl:col-span-3 sticky top-24">
            <CartSidebar
              selectedSeats={selectedSeats}
              presentation={currentPresentation}
              ticketPrice={ticketPrice}
              onRemoveSeat={handleRemoveSelectedSeat}
              onClearSelection={handleClearSelection}
              onProceedToPayment={() => setIsDaviviendaOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* 3. Footer Institucional */}
      <footer className="bg-slate-950 text-slate-300 mt-12 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="font-bold text-white">
                Colegio Mayor • Sistema de Boletería y Asignación de Teatro Escolar
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Integración oficial con pasarela transaccional Davivienda • Todos los derechos reservados 2026
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
                onClick={() => setIsAdminOpen(!isAdminOpen)}
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
              <p className="mt-0.5">
                Demo desplegada automáticamente vía GitHub Pages & GitHub Actions
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. Modal de Pasarela de Pagos Davivienda */}
      <DaviviendaModal
        isOpen={isDaviviendaOpen}
        onClose={() => setIsDaviviendaOpen(false)}
        selectedSeats={selectedSeats}
        presentation={currentPresentation}
        ticketPrice={ticketPrice}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* 5. Modal de Notificación de Compra y Boletas Electrónicas con QR */}
      <TicketReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* 6. Modal de Información y Ayuda */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        ticketPrice={ticketPrice}
      />
    </div>
  );
}
