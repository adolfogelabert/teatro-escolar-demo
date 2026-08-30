import React, { useEffect, useRef, useState } from 'react';
import { Reservation } from '../types';
import { formatCOP } from '../data/theaterData';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Download,
  Printer,
  Mail,
  MessageSquare,
  Sparkles,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  X,
  Hourglass,
  Building2,
  AlertTriangle,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BANK_INSTRUCTIONS, formatRemaining } from '../data/reservations';

interface TicketReceiptModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  onConfirmPayment?: (reservationId: string) => void;
}

export const TicketReceiptModal: React.FC<TicketReceiptModalProps> = ({
  reservation,
  onClose,
  onConfirmPayment,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [now, setNow] = useState<number>(Date.now());
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reservation) return;
    QRCode.toDataURL(reservation.qrPayload, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [reservation]);

  // Tick de tiempo: actualiza el contador cada segundo si la reserva sigue activa
  useEffect(() => {
    if (!reservation) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [reservation]);

  useEffect(() => {
    if (!reservation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reservation, onClose]);

  if (!reservation) return null;

  const remaining = formatRemaining(reservation.expiresAtMs, now);
  const expired = reservation.expiresAtMs <= now;
  const confirmed = reservation.status === 'confirmada';

  const handlePrint = () => {
    window.print();
  };

  const handleSimulatedEmail = () => {
    alert(
      `📧 Simulación de envío: el correo con las instrucciones de consignación sería enviado a\n\n` +
      `   ${reservation.customer.email}\n\n` +
      `(En producción este paso se conectaría con el servicio SMTP del colegio.)`
    );
  };

  const handleSimulatedConfirmPayment = () => {
    if (onConfirmPayment) {
      onConfirmPayment(reservation.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto print:p-0 print:bg-white"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-3xl max-h-screen sm:max-h-[calc(100vh-2rem)] overflow-hidden my-0 sm:my-6 print:border-none print:shadow-none print:max-w-full print:max-h-full animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
      >
        {/* Top Banner según estado */}
        <div
          className={`p-5 relative shrink-0 print:hidden ${
            confirmed
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
              : expired
              ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar comprobante"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs text-white flex items-center justify-center font-bold shadow-xs">
              {confirmed ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-200" />
              ) : expired ? (
                <AlertTriangle className="w-7 h-7 text-rose-200" />
              ) : (
                <Hourglass className="w-7 h-7 text-amber-200" />
              )}
            </div>
            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  confirmed
                    ? 'text-emerald-200 bg-emerald-900/40'
                    : expired
                    ? 'text-rose-200 bg-rose-900/40'
                    : 'text-amber-200 bg-amber-900/30'
                }`}
              >
                {confirmed
                  ? 'Pago confirmado • Reserva activa'
                  : expired
                  ? 'Reserva expirada • Asientos liberados'
                  : 'Reserva pendiente de pago por consignación'}
              </span>
              <h2 id="receipt-modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
                Comprobante de Reserva
              </h2>
              <p className="text-xs opacity-90">
                Reserva: <strong className="font-mono text-white">{reservation.id}</strong> •{' '}
                Referencia: <strong className="font-mono text-white">{reservation.paymentReference}</strong>
              </p>
            </div>
          </div>

          {!confirmed && !expired && (
            <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1">
                <Hourglass className="w-3.5 h-3.5" />
                Tiempo para consignar:
              </span>
              <span className="font-mono font-bold bg-black/20 px-2 py-0.5 rounded">
                {remaining}
              </span>
            </div>
          )}
        </div>

        {/* Notification simulation alert */}
        <div
          className={`p-3 px-5 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden ${
            confirmed
              ? 'bg-emerald-50 border-b border-emerald-100'
              : expired
              ? 'bg-rose-50 border-b border-rose-100'
              : 'bg-indigo-50 border-b border-indigo-100'
          }`}
        >
          <div
            className={`flex items-center gap-4 flex-wrap ${
              confirmed ? 'text-emerald-800' : expired ? 'text-rose-800' : 'text-indigo-800'
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className={`w-3.5 h-3.5 ${
                confirmed ? 'text-emerald-600' : expired ? 'text-rose-600' : 'text-indigo-600'
              }`} />
              Correo de confirmación enviado a: <strong>{reservation.customer.email}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <MessageSquare className={`w-3.5 h-3.5 ${
                confirmed ? 'text-emerald-600' : expired ? 'text-rose-600' : 'text-indigo-600'
              }`} />
              WhatsApp: <strong>{reservation.customer.phone}</strong>
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              confirmed
                ? 'bg-emerald-200 text-emerald-900'
                : expired
                ? 'bg-rose-200 text-rose-900'
                : 'bg-indigo-200 text-indigo-900'
            }`}
          >
            {confirmed ? 'Notificado' : 'Notificación simulada'}
          </span>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 overscroll-contain print:p-0 print:space-y-4">
          {/* Institution Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <div className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Colegio Mayor • Temporada de Teatro Escolar 2026
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {reservation.presentationTitle}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 mt-1.5 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {reservation.presentationDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {reservation.presentationTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Auditorio Principal & Teatro Mayor
              </span>
            </div>
          </div>

          {/* Datos para consignar */}
          <section className="bg-amber-200 border-2 border-amber-400 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Datos para consignar el pago
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[10px] uppercase text-amber-700 font-medium">Banco</dt>
                <dd className="font-bold text-amber-950">{BANK_INSTRUCTIONS.bankName}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-amber-700 font-medium">Titular</dt>
                <dd className="font-bold text-amber-950">{BANK_INSTRUCTIONS.accountHolder}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-amber-700 font-medium">Tipo de cuenta</dt>
                <dd className="font-bold text-amber-950">{BANK_INSTRUCTIONS.accountType}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-amber-700 font-medium">Número de cuenta</dt>
                <dd className="font-mono font-black text-amber-950">{BANK_INSTRUCTIONS.accountNumber}</dd>
              </div>
            </dl>
            <div className="border-t border-amber-300 pt-3">
              <dt className="text-[10px] uppercase text-amber-700 font-medium">
                Referencia única de pago (concepto de la consignación)
              </dt>
              <dd className="mt-1 flex items-center justify-between gap-3 bg-white border-2 border-dashed border-amber-400 rounded-lg px-3 py-2">
                <span className="font-mono font-black text-base sm:text-lg text-amber-950 break-all">
                  {reservation.paymentReference}
                </span>
                <span className="text-[10px] font-bold text-amber-700 whitespace-nowrap">
                  {BANK_INSTRUCTIONS.referencePrefix}
                </span>
              </dd>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong className="font-bold">Instrucciones:</strong>{' '}
              {BANK_INSTRUCTIONS.instructions}
            </p>
          </section>

          {/* Asientos reservados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Asientos Reservados ({reservation.seats.length})</span>
              <span>Valor Unitario: {formatCOP(reservation.unitPrice)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reservation.seats.map((seat, idx) => (
                <div
                  key={seat.id}
                  className="bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between shadow-xs"
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-200" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-200" />

                  <div className="flex items-start justify-between gap-2 border-b border-indigo-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider">
                        Asiento #{idx + 1}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {seat.sectionName}
                      </h4>
                      <p className="text-xs font-bold text-indigo-700">
                        Fila {seat.row} • Asiento {seat.number}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white font-mono font-black text-sm flex items-center justify-center shadow-xs">
                      {seat.number}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Titular / Estudiante:</div>
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {reservation.customer.studentName || reservation.customer.fullName}
                      </div>
                    </div>

                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="Código QR de la reserva"
                        className="w-20 h-20 rounded-lg border border-slate-200 shadow-2xs print:w-28 print:h-28"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center font-mono text-[8px] print:w-28 print:h-28">
                        QR
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen comprador */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-slate-900 mb-1 border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Resumen del Cliente</span>
              <span
                className={`font-mono ${
                  confirmed
                    ? 'text-emerald-700'
                    : expired
                    ? 'text-rose-700'
                    : 'text-amber-700'
                }`}
              >
                ESTADO: {reservation.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Comprador:</span>
                <span className="font-semibold text-slate-800">{reservation.customer.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Documento:</span>
                <span className="font-semibold text-slate-800">
                  {reservation.customer.documentType} {reservation.customer.documentNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Estudiante:</span>
                <span className="font-semibold text-slate-800">
                  {reservation.customer.studentName || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Reservado el:</span>
                <span className="font-semibold text-slate-800">{reservation.createdAt}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-sm">
              <span className="text-slate-800">Total a consignar:</span>
              <span className="text-base font-extrabold text-indigo-700">
                {formatCOP(reservation.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-100 border-t border-slate-200 p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Volver a la cartelera
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleSimulatedEmail}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>Simular envío de correo</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir</span>
            </button>

            {!confirmed && !expired && onConfirmPayment && (
              <button
                onClick={handleSimulatedConfirmPayment}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Marcar consignación recibida (demo)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
