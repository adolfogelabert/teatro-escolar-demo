import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Seat, SeatStatus, SectionType, SeatInventory } from '../types';
import { formatCOP } from '../data/theaterData';
import { Tooltip } from './Tooltip';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Hourglass,
  Move,
} from 'lucide-react';

interface TheaterMapProps {
  seats: Seat[];
  seatStatusMap: SeatInventory;
  onSeatClick: (seat: Seat) => void;
  selectedSeats: Seat[];
  ticketPrice: number;
}

export const TheaterMap: React.FC<TheaterMapProps> = ({
  seats,
  seatStatusMap,
  onSeatClick,
  selectedSeats,
  ticketPrice,
}) => {
  const [activeSectionFilter, setActiveSectionFilter] = useState<'all' | SectionType>('all');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [zoomLevel, setZoomLevel] = useState<number>(isMobile ? 1.3 : 1);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Contadores de asientos en tiempo real para la leyenda
  const counts = useMemo(() => {
    let disponible = 0;
    let seleccionado = 0;
    let reservado = 0;
    let ocupado = 0;
    let bloqueado = 0;

    seats.forEach((seat) => {
      const st = seatStatusMap[seat.id]?.status ||
        (seat.defaultBlocked ? 'bloqueado' : 'disponible');
      if (st === 'disponible') disponible++;
      else if (st === 'seleccionado') seleccionado++;
      else if (st === 'reservado') reservado++;
      else if (st === 'ocupado') ocupado++;
      else if (st === 'bloqueado') bloqueado++;
    });

    return { disponible, seleccionado, reservado, ocupado, bloqueado, total: seats.length };
  }, [seats, seatStatusMap]);

  // Agrupación organizada de asientos para el renderizado fiel
  const sectionsData = useMemo(() => {
    // Platea Palcos Izq y Der
    const palcoIzq = seats.filter((s) => s.id.startsWith('palco-izq-'));
    const palcoDer = seats.filter((s) => s.id.startsWith('palco-der-'));
    const palcoB2Izq = seats.filter((s) => s.id.startsWith('palco-b2-izq-'));
    const palcoB2Der = seats.filter((s) => s.id.startsWith('palco-b2-der-'));

    // Platea Delantera (Filas A a L)
    const plateaFrontRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L'];
    const plateaFrontMap: Record<string, Seat[]> = {};
    plateaFrontRows.forEach((row) => {
      plateaFrontMap[row] = seats
        .filter((s) => s.sectionId === 'platea' && s.row === row && s.subSection === 'Zona Delantera')
        .sort((a, b) => b.number - a.number); // Descendente 122..101
    });

    // Platea Trasera (Filas M a T)
    const plateaRearRows = ['M', 'N', 'P', 'Q', 'R', 'S', 'T'];
    const plateaRearMap: Record<string, { left: Seat[]; center: Seat[]; right: Seat[] }> = {};
    plateaRearRows.forEach((row) => {
      plateaRearMap[row] = {
        left: seats
          .filter((s) => s.sectionId === 'platea' && s.row === row && s.subSection === 'Lateral Izquierdo')
          .sort((a, b) => b.number - a.number),
        center: seats
          .filter((s) => s.sectionId === 'platea' && s.row === row && s.subSection === 'Centro')
          .sort((a, b) => b.number - a.number),
        right: seats
          .filter((s) => s.sectionId === 'platea' && s.row === row && s.subSection === 'Lateral Derecho')
          .sort((a, b) => a.number - b.number),
      };
    });

    // 1° Balcón
    const balcon1Wings = {
      leftRows: ['1', '2', '3', '4', '5'].map((r) =>
        seats
          .filter((s) => s.sectionId === 'balcon1' && s.row === `Fila ${r} Izq`)
          .sort((a, b) => b.number - a.number)
      ),
      centerRows: ['AA', 'BB', 'CC', 'DD', 'EE'].map((r) => ({
        row: r,
        seats: seats
          .filter((s) => s.sectionId === 'balcon1' && s.row === r)
          .sort((a, b) => b.number - a.number),
      })),
      rightRows: ['1', '2', '3', '4', '5'].map((r) =>
        seats
          .filter((s) => s.sectionId === 'balcon1' && s.row === `Fila ${r} Der`)
          .sort((a, b) => a.number - b.number)
      ),
    };

    // 2° Balcón
    const balcon2Rows = ['A', 'B', 'C', 'D', 'E'].map((r) => ({
      row: r,
      seats: seats
        .filter((s) => s.sectionId === 'balcon2' && s.row === r)
        .sort((a, b) => b.number - a.number),
    }));

    // 3° Balcón
    const balcon3Rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((r) => ({
      row: r,
      seats: seats
        .filter((s) => s.sectionId === 'balcon3' && s.row === r)
        .sort((a, b) => b.number - a.number),
    }));

    return {
      palcoIzq,
      palcoDer,
      palcoB2Izq,
      palcoB2Der,
      plateaFrontRows,
      plateaFrontMap,
      plateaRearRows,
      plateaRearMap,
      balcon1Wings,
      balcon2Rows,
      balcon3Rows,
    };
  }, [seats]);

  // Manejo de eventos de ratón para tooltips
  const handleMouseEnter = (seat: Seat, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    setHoveredSeat(seat);
    setTooltipPos({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredSeat(null);
    setTooltipPos(null);
  };

  // Renderizador individual de un botón de asiento con paleta vibrante
  const renderSeatButton = (seat: Seat, size: 'sm' | 'md' = 'md') => {
    const status: SeatStatus = seatStatusMap[seat.id]?.status ||
      (seat.defaultBlocked ? 'bloqueado' : 'disponible');
    const isSelected = status === 'seleccionado';
    const isReserved = status === 'reservado';
    const isOccupied = status === 'ocupado';
    const isBlocked = status === 'bloqueado';

    let bgColor = '#4CAF50';
    let textColor = '#ffffff';
    let borderColor = '#388E3C';
    let cursorStyle = 'cursor-pointer hover:scale-125 hover:z-20';
    let customBoxShadow = '0 1px 2px rgba(0,0,0,0.08)';

    if (isSelected) {
      bgColor = '#FFEB3B';
      textColor = '#0f172a';
      borderColor = '#EAB308';
      customBoxShadow = '0 0 8px #FFEB3B, 0 0 2px #EAB308';
      cursorStyle = 'cursor-pointer scale-110 ring-2 ring-indigo-950 z-10';
    } else if (isReserved) {
      bgColor = '#7C3AED';
      textColor = '#ffffff';
      borderColor = '#5B21B6';
      cursorStyle = 'cursor-not-allowed opacity-95';
      customBoxShadow = '0 0 4px rgba(124, 58, 237, 0.5)';
    } else if (isOccupied) {
      bgColor = '#F44336';
      textColor = '#ffffff';
      borderColor = '#D32F2F';
      cursorStyle = 'cursor-not-allowed opacity-90';
    } else if (isBlocked) {
      bgColor = '#757575';
      textColor = '#f1f5f9';
      borderColor = '#555555';
      cursorStyle = 'cursor-not-allowed opacity-80';
    }

    return (
      <button
        key={seat.id}
        id={`seat-${seat.id}`}
        type="button"
        disabled={isOccupied || isBlocked || isReserved}
        onClick={() => onSeatClick(seat)}
        onMouseEnter={(e) => handleMouseEnter(seat, e)}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor,
          boxShadow: customBoxShadow,
        }}
        aria-label={`${seat.label} - ${status}`}
        className={`font-mono text-[9px] sm:text-[10px] font-bold rounded-[3px] border transition-all duration-150 flex items-center justify-center select-none ${
          size === 'sm' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-4.5 h-4.5 sm:w-6 sm:h-5.5'
        } ${cursorStyle}`}
      >
        {seat.number}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
      {/* Top Map Control Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Section Navigation Tabs with Pill Styling */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 mr-1 hidden md:inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Zona:
          </span>
          <Tooltip content="Filtra los asientos por zona del teatro. Selecciona una zona para ver solo esa sección del mapa." position="bottom">
            <span className="mr-1" />
          </Tooltip>
          <button
            id="filter-all"
            onClick={() => setActiveSectionFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ver Todo
          </button>
          <button
            id="filter-platea"
            onClick={() => setActiveSectionFilter('platea')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'platea'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Platea Central
          </button>
          <button
            id="filter-balcon1"
            onClick={() => setActiveSectionFilter('balcon1')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'balcon1'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            1° Balcón
          </button>
          <button
            id="filter-balcon2"
            onClick={() => setActiveSectionFilter('balcon2')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'balcon2'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            2° Balcón
          </button>
          <button
            id="filter-balcon3"
            onClick={() => setActiveSectionFilter('balcon3')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'balcon3'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            3° Balcón
          </button>
          <button
            id="filter-palcos"
            onClick={() => setActiveSectionFilter('palcos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === 'palcos'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Palcos (Bloqueados)
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full p-1 shadow-2xs sm:p-1">
          <Tooltip content="Usa estos botones o el panel flotante (móvil) para acercar y alejar el mapa de asientos." position="bottom">
            <span className="mr-1" />
          </Tooltip>
          <button
            id="btn-zoom-out"
            onClick={() => setZoomLevel((prev) => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
            className="p-2 sm:p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer active:scale-90"
            title="Reducir zoom"
          >
            <ZoomOut className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <span className="text-xs sm:text-xs font-mono font-bold px-1.5 text-indigo-900 min-w-[48px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={() => setZoomLevel((prev) => Math.min(2, Number((prev + 0.15).toFixed(2))))}
            className="p-2 sm:p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer active:scale-90"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
          <button
            id="btn-zoom-reset"
            onClick={() => setZoomLevel(isMobile ? 1.3 : 1)}
            className="p-2 sm:p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-l border-slate-200 ml-0.5 active:scale-90"
            title="Restablecer tamaño"
          >
            <RotateCcw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Color Legend Bar with Vibrant Palette Tokens */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
          {/* Disponible */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center font-bold text-[8px] text-white shadow-2xs"
              style={{ backgroundColor: '#4CAF50', borderColor: '#388E3C' }}
            >
              ✓
            </span>
            <span className="text-slate-700">
              Disponible (<strong className="text-emerald-700 font-bold">{counts.disponible}</strong>)
            </span>
            <Tooltip content="Asiento libre. Toca para seleccionarlo y agregarlo a tu reserva." position="top" />
          </div>

          {/* Seleccionado */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] border ring-1 ring-slate-900 flex items-center justify-center font-bold text-[8px] text-slate-950"
              style={{ backgroundColor: '#FFEB3B', borderColor: '#EAB308', boxShadow: '0 0 6px #FFEB3B' }}
            >
              ★
            </span>
            <span className="text-slate-900 font-bold">
              Seleccionado (<strong className="text-amber-700 font-extrabold">{counts.seleccionado}</strong>)
            </span>
            <Tooltip content="Asiento que seleccionaste. Aparece en tu carrito de reserva. Tócalo de nuevo para quitarlo." position="top" />
          </div>

          {/* Reservado (consignación pendiente) */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center font-bold text-[8px] text-white shadow-2xs"
              style={{ backgroundColor: '#7C3AED', borderColor: '#5B21B6' }}
            >
              <Hourglass className="w-2.5 h-2.5" />
            </span>
            <span className="text-slate-700">
              Reservado (<strong className="text-purple-700 font-bold">{counts.reservado}</strong>)
            </span>
            <Tooltip content="Alguien lo reservó y tiene 48h para consignar el pago. Si no paga, vuelve a estar disponible." position="top" />
          </div>

          {/* Ocupado / Pagado */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center font-bold text-[8px] text-white shadow-2xs"
              style={{ backgroundColor: '#F44336', borderColor: '#D32F2F' }}
            >
              ✕
            </span>
            <span className="text-slate-700">
              Ocupado (<strong className="text-rose-700 font-bold">{counts.ocupado}</strong>)
            </span>
            <Tooltip content="Asiento ya pagado y confirmado. No está disponible para reserva." position="top" />
          </div>

          {/* Bloqueado */}
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center font-bold text-[8px] text-slate-100 shadow-2xs"
              style={{ backgroundColor: '#757575', borderColor: '#555555' }}
            >
              <Lock className="w-2.5 h-2.5" />
            </span>
            <span className="text-slate-700">
              Bloqueado (<strong className="text-stone-700 font-bold">{counts.bloqueado}</strong>)
            </span>
            <Tooltip content="Asiento bloqueado por protocolo escolar (palcos, filas A y B). No se puede vender." position="top" />
          </div>
        </div>

        {/* Regla recordatorio */}
        <div className="text-[11px] text-slate-500 font-medium hidden lg:flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>Palcos y filas A y B de Platea bloqueados por protocolo escolar.</span>
        </div>
      </div>

      {/* Interactive Theater Canvas Stage Container */}
      <div
        ref={containerRef}
        className="p-4 sm:p-6 overflow-auto min-h-[560px] max-h-[720px] bg-slate-50/60 flex flex-col items-center relative"
      >
        {/* Floating Mobile Zoom Controls */}
        <div className="sm:hidden fixed bottom-4 right-4 z-40 flex flex-col items-center gap-2">
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 shadow-xl flex flex-col items-center gap-1">
            <button
              onClick={() => setZoomLevel((prev) => Math.min(2, Number((prev + 0.2).toFixed(2))))}
              className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-indigo-900">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.7, Number((prev - 0.2).toFixed(2))))}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-md active:scale-90 transition-transform cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoomLevel(1.3)}
              className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-sm active:scale-90 transition-transform cursor-pointer mt-0.5"
              title="Restablecer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <Move className="w-3 h-3" />
            <span>Scroll para ver más</span>
          </div>
        </div>
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
          }}
          className="w-full max-w-[960px] flex flex-col items-center space-y-6 pb-12"
        >
          {/* ========================================================= */}
          {/* ESCENARIO PRINCIPAL (STAGE) - VIBRANT PALETTE THEME */}
          {/* ========================================================= */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'platea') && (
            <div className="w-full max-w-2xl mx-auto text-center mb-2">
              <div className="w-full bg-slate-100 rounded-t-3xl py-2.5 px-6 border border-b-2 border-slate-200 text-center text-xs font-bold text-slate-500 uppercase tracking-widest shadow-2xs flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>ESCENARIO / PANTALLA</span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                Frente de Actuación & Ensamble Musical
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. SECCIÓN: PLATEA CENTRAL Y PALCOS LATERALES */}
          {/* ========================================================= */}
          {(activeSectionFilter === 'all' ||
            activeSectionFilter === 'platea' ||
            activeSectionFilter === 'palcos') && (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  PLATEA CENTRAL
                </h2>
                <span className="text-xs text-slate-500 font-semibold">
                  Filas A a T • Acceso Planta Baja
                </span>
              </div>

              {/* Contenedor con Palcos Izq, Zona Central y Palcos Der */}
              <div className="flex items-start justify-center gap-3 sm:gap-4">
                {/* PALCOS IZQUIERDA */}
                {(activeSectionFilter === 'all' || activeSectionFilter === 'palcos') && (
                  <div className="flex flex-col items-center bg-stone-50 border border-stone-200 rounded-xl p-2">
                    <span className="text-[9px] font-bold text-stone-600 uppercase mb-1">
                      Palcos Izq
                    </span>
                    <div className="flex gap-1.5">
                      {/* Col 1 */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-center text-stone-400">1</span>
                        {sectionsData.palcoIzq
                          .filter((s) => s.row === 'P-Izq 1')
                          .map((s) => renderSeatButton(s, 'sm'))}
                      </div>
                      {/* Col 2 */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-center text-stone-400">2</span>
                        {sectionsData.palcoIzq
                          .filter((s) => s.row === 'P-Izq 2')
                          .map((s) => renderSeatButton(s, 'sm'))}
                      </div>
                      {/* Col 3 (ABL) */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-center text-stone-400">ABL</span>
                        {sectionsData.palcoIzq
                          .filter((s) => s.row === 'P-Izq 3')
                          .map((s) => renderSeatButton(s, 'sm'))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PLATEA DELANTERA & TRASERA */}
                {(activeSectionFilter === 'all' || activeSectionFilter === 'platea') && (
                  <div className="flex-1 flex flex-col items-center space-y-4 max-w-2xl">
                    {/* Filas Delanteras A - L */}
                    <div className="flex flex-col items-center space-y-1.5 w-full">
                      {sectionsData.plateaFrontRows.map((rowLetter) => {
                        const rowSeats = sectionsData.plateaFrontMap[rowLetter] || [];
                        const isBlockedRow = rowLetter === 'A' || rowLetter === 'B';
                        return (
                          <div key={rowLetter} className="flex items-center gap-1.5 justify-center">
                            <span
                              className={`w-4 text-center font-bold text-xs font-mono ${
                                isBlockedRow ? 'text-stone-500' : 'text-slate-700'
                              }`}
                            >
                              {rowLetter}
                            </span>
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                              {rowSeats.map((seat) => renderSeatButton(seat))}
                            </div>
                            <span
                              className={`w-4 text-center font-bold text-xs font-mono ${
                                isBlockedRow ? 'text-stone-500' : 'text-slate-700'
                              }`}
                            >
                              {rowLetter}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Divisor / Pasillo de Platea */}
                    <div className="w-full py-1 text-center">
                      <div className="border-t-2 border-dashed border-slate-200 relative">
                        <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Pasillo Central
                        </span>
                      </div>
                    </div>

                    {/* Filas Traseras M - T (Left odd, Center 115..101, Right even) */}
                    <div className="flex flex-col items-center space-y-1.5 w-full">
                      {sectionsData.plateaRearRows.map((rowLetter) => {
                        const { left, center, right } = sectionsData.plateaRearMap[rowLetter];
                        return (
                          <div key={rowLetter} className="flex items-center gap-2 justify-center w-full">
                            {/* Bloque Izquierdo (Impares) */}
                            <div className="flex items-center gap-1 justify-end min-w-[70px]">
                              {left.map((seat) => renderSeatButton(seat))}
                            </div>

                            {/* Fila Letra */}
                            <span className="w-4 text-center font-bold text-xs font-mono text-slate-700">
                              {rowLetter}
                            </span>

                            {/* Bloque Central (115..101) */}
                            <div className="flex items-center gap-1 justify-center">
                              {center.map((seat) => renderSeatButton(seat))}
                            </div>

                            {/* Fila Letra */}
                            <span className="w-4 text-center font-bold text-xs font-mono text-slate-700">
                              {rowLetter}
                            </span>

                            {/* Bloque Derecho (Pares) */}
                            <div className="flex items-center gap-1 justify-start min-w-[70px]">
                              {right.map((seat) => renderSeatButton(seat))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PALCOS DERECHA */}
                {(activeSectionFilter === 'all' || activeSectionFilter === 'palcos') && (
                  <div className="flex flex-col items-center bg-stone-50 border border-stone-200 rounded-xl p-2">
                    <span className="text-[9px] font-bold text-stone-600 uppercase mb-1">
                      Palcos Der
                    </span>
                    <div className="flex gap-1.5">
                      {/* Col 1 */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-center text-stone-400">1</span>
                        {sectionsData.palcoDer
                          .filter((s) => s.row === 'P-Der 1')
                          .map((s) => renderSeatButton(s, 'sm'))}
                      </div>
                      {/* Col 2 */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-center text-stone-400">2</span>
                        {sectionsData.palcoDer
                          .filter((s) => s.row === 'P-Der 2')
                          .map((s) => renderSeatButton(s, 'sm'))}
                      </div>
                      {/* Col 3 */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-center text-stone-400">3</span>
                        {sectionsData.palcoDer
                          .filter((s) => s.row === 'P-Der 3')
                          .map((s) => renderSeatButton(s, 'sm'))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SECCIÓN: 1° BALCÓN */}
          {/* ========================================================= */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'balcon1') && (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  1° BALCÓN
                </h2>
                <span className="text-xs text-slate-500 font-semibold">
                  Filas AA a EE • 19 a 22 asientos por fila
                </span>
              </div>

              <div className="flex items-start justify-center gap-2 sm:gap-3 overflow-x-auto">
                {/* Lateral Izquierdo 1° Balcón (Impares) */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  {sectionsData.balcon1Wings.leftRows.map((rowSeats, idx) => (
                    <div key={`b1-l-${idx}`} className="flex items-center gap-0.5">
                      {rowSeats.map((seat) => renderSeatButton(seat, 'sm'))}
                    </div>
                  ))}
                </div>

                {/* Centro 1° Balcón (AA - EE) — grid de columnas fijas por fila */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  {sectionsData.balcon1Wings.centerRows.map(({ row, seats: rowSeats }) => {
                    // Número exacto de columnas = cantidad de asientos en la fila
                    const colCount = rowSeats.length;
                    return (
                      <div
                        key={row}
                        className="flex items-center gap-1.5 justify-center"
                      >
                        <span className="w-6 text-center font-bold text-xs font-mono text-slate-700 shrink-0">
                          {row}
                        </span>
                        <div
                          className="grid gap-0.5"
                          style={{
                            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                            minWidth: `${colCount * 22}px`,
                          }}
                        >
                          {rowSeats.map((seat) => renderSeatButton(seat, 'sm'))}
                        </div>
                        <span className="w-6 text-center font-bold text-xs font-mono text-slate-700 shrink-0">
                          {row}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Lateral Derecho 1° Balcón (Pares) */}
                <div className="flex flex-col items-start gap-0.5 shrink-0">
                  {sectionsData.balcon1Wings.rightRows.map((rowSeats, idx) => (
                    <div key={`b1-r-${idx}`} className="flex items-center gap-0.5">
                      {rowSeats.map((seat) => renderSeatButton(seat, 'sm'))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. SECCIÓN: 2° BALCÓN */}
          {/* ========================================================= */}
          {(activeSectionFilter === 'all' ||
            activeSectionFilter === 'balcon2' ||
            activeSectionFilter === 'palcos') && (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  2° BALCÓN
                </h2>
                <span className="text-xs text-slate-500 font-semibold">Filas A a E</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                {/* Palco Izq 2° Balcón */}
                {(activeSectionFilter === 'all' || activeSectionFilter === 'palcos') && (
                  <div className="flex flex-col items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                    <span className="text-[8px] font-bold text-stone-500 mb-1">Palco</span>
                    <div className="flex flex-col gap-1">
                      {sectionsData.palcoB2Izq.map((s) => renderSeatButton(s, 'sm'))}
                    </div>
                  </div>
                )}

                {/* Centro 2° Balcón (A - E) */}
                <div className="flex flex-col items-center space-y-1.5 flex-1 max-w-3xl overflow-x-auto py-1">
                  {sectionsData.balcon2Rows.map(({ row, seats: rowSeats }) => (
                    <div key={row} className="flex items-center gap-1.5 justify-center">
                      <span className="w-4 text-center font-bold text-xs font-mono text-slate-700">
                        {row}
                      </span>
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {rowSeats.map((seat) => renderSeatButton(seat))}
                      </div>
                      <span className="w-4 text-center font-bold text-xs font-mono text-slate-700">
                        {row}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Palco Der 2° Balcón */}
                {(activeSectionFilter === 'all' || activeSectionFilter === 'palcos') && (
                  <div className="flex flex-col items-center bg-stone-50 border border-stone-200 rounded-xl p-1.5">
                    <span className="text-[8px] font-bold text-stone-500 mb-1">Palco</span>
                    <div className="flex flex-col gap-1">
                      {sectionsData.palcoB2Der.map((s) => renderSeatButton(s, 'sm'))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. SECCIÓN: 3° BALCÓN */}
          {/* ========================================================= */}
          {(activeSectionFilter === 'all' || activeSectionFilter === 'balcon3') && (
            <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  3° BALCÓN
                </h2>
                <span className="text-xs text-slate-500 font-semibold">Filas A a H • Vista Panorámica</span>
              </div>

              <div className="flex flex-col items-center space-y-1.5 overflow-x-auto py-1">
                {sectionsData.balcon3Rows.map(({ row, seats: rowSeats }) => (
                  <div key={row} className="flex items-center gap-1.5 justify-center">
                    <span className="w-4 text-center font-bold text-xs font-mono text-slate-700">
                      {row}
                    </span>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {rowSeats.map((seat) => renderSeatButton(seat))}
                    </div>
                    <span className="w-4 text-center font-bold text-xs font-mono text-slate-700">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Tooltip para inspección del asiento */}
        {hoveredSeat && tooltipPos && (
          <div
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 12}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="absolute z-50 pointer-events-none bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl border border-slate-700 min-w-[160px] transition-all duration-75"
          >
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>{hoveredSeat.sectionName}</span>
              <span className="text-[10px] text-slate-400 font-mono">#{hoveredSeat.number}</span>
            </div>
            <div className="text-slate-200 text-[11px] font-medium mt-0.5">
              Fila <span className="font-bold">{hoveredSeat.row}</span> • Asiento{' '}
              <span className="font-bold">{hoveredSeat.number}</span>
            </div>
            {hoveredSeat.subSection && (
              <div className="text-slate-400 text-[10px]">{hoveredSeat.subSection}</div>
            )}
            <div className="mt-1 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Precio:</span>
              <span className="font-bold text-emerald-400">{formatCOP(ticketPrice)}</span>
            </div>
            {(() => {
              const entryStatus: SeatStatus =
                seatStatusMap[hoveredSeat.id]?.status ||
                (hoveredSeat.defaultBlocked ? 'bloqueado' : 'disponible');
              const colorClass =
                entryStatus === 'disponible'
                  ? 'text-emerald-400'
                  : entryStatus === 'seleccionado'
                  ? 'text-amber-400'
                  : entryStatus === 'reservado'
                  ? 'text-purple-400'
                  : entryStatus === 'ocupado'
                  ? 'text-rose-400'
                  : 'text-stone-400';
              return (
                <div className="text-[10px] font-bold mt-0.5">
                  Estado:{' '}
                  <span className={colorClass}>{entryStatus.toUpperCase()}</span>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
