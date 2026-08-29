import React from 'react';
import { Seat, Presentation } from '../types';
import { formatCOP } from '../data/theaterData';
import {
  ShoppingCart,
  Trash2,
  Hourglass,
  Building2,
  Ticket,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface CartSidebarProps {
  selectedSeats: Seat[];
  presentation: Presentation;
  ticketPrice: number;
  onRemoveSeat: (seatId: string) => void;
  onClearSelection: () => void;
  onProceedToPayment: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  selectedSeats,
  presentation,
  ticketPrice,
  onRemoveSeat,
  onClearSelection,
  onProceedToPayment,
}) => {
  const count = selectedSeats.length;
  const subtotal = count * ticketPrice;
  const total = subtotal;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Header Cart */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Reserva de Boletas
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {presentation.name} • {presentation.grades}
              </p>
            </div>
          </div>

          {count > 0 && (
            <button
              onClick={onClearSelection}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Quitar todos los asientos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Seats List */}
      <div className="p-4 flex-1 overflow-y-auto max-h-[340px] space-y-2.5">
        {count === 0 ? (
          <div className="py-8 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">
              No has seleccionado asientos
            </h4>
            <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
              Haz clic en cualquier asiento verde (<span className="text-emerald-700 font-bold">Disponible</span>) en el plano para agregarlo a tu orden.
            </p>
          </div>
        ) : (
          selectedSeats.map((seat) => (
            <div
              key={seat.id}
              className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3 transition-all hover:bg-amber-50 hover:border-amber-300"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-300 text-slate-900 border border-amber-400 font-mono font-black text-xs flex items-center justify-center shadow-2xs">
                  {seat.number}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{seat.sectionName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-800">Fila {seat.row}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Asiento #{seat.number} {seat.subSection ? `(${seat.subSection})` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-900">
                  {formatCOP(ticketPrice)}
                </span>
                <button
                  onClick={() => onRemoveSeat(seat.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar este asiento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pricing & Checkout Summary Box */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl space-y-3">
        <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {presentation.date}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              {presentation.time}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-medium">Precio unitario por boleta:</span>
            <span className="font-bold text-slate-900">{formatCOP(ticketPrice)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Cantidad a reservar:</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              {count} {count === 1 ? 'boleta' : 'boletas'}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Total a consignar:</span>
            <span className="font-black text-xl text-indigo-900">
              {formatCOP(total)}
            </span>
          </div>
        </div>

        {/* CTA Button - Reservar */}
        <button
          id="btn-proceed-to-payment"
          disabled={count === 0}
          onClick={onProceedToPayment}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            count > 0
              ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-500/25'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Hourglass className="w-4 h-4" />
          <span>Reservar y pagar por consignación</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Mail className="w-3.5 h-3.5 text-indigo-500" />
          <span>Recibirás un correo con tu reserva e instrucciones de pago</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex items-start gap-1.5 text-[10px] text-amber-800">
          <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Tienes <strong>48 horas</strong> para consignar después de reservar.
            Pasado ese plazo los asientos vuelven a estar disponibles.
          </span>
        </div>
      </div>
    </div>
  );
};
