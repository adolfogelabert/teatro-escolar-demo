import React, { useEffect, useRef, useState } from 'react';
import { Seat, Presentation, Reservation, ReservationCustomer } from '../types';
import { formatCOP } from '../data/theaterData';
import {
  X,
  Mail,
  User,
  Clock,
  Building2,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Ticket,
  CreditCard,
  Sparkles,
  Hourglass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BANK_INSTRUCTIONS } from '../data/reservations';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeats: Seat[];
  presentation: Presentation;
  ticketPrice: number;
  onReservationCreated: (reservation: Reservation) => void;
}

const DEMO_DURATION_HOURS = 0.01;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, '').length >= 7;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  selectedSeats,
  presentation,
  ticketPrice,
  onReservationCreated,
}) => {
  const totalAmount = selectedSeats.length * ticketPrice;

  const [fullName, setFullName] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState(presentation.grades.split(',')[0] || '1° Grado');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const isDemoMode = DEMO_DURATION_HOURS > 0;
  const reservationRef = useRef<HTMLDivElement>(null);

  const steps = [
    'Validando datos del cliente…',
    'Generando código único de reserva…',
    'Enviando correo con instrucciones de consignación…',
    'Bloqueando los asientos por 48 horas…',
  ];

  const reservationIdSample = `RES-${Math.floor(100000 + Math.random() * 900000)}`;
  const reservationReferenceSample = `${BANK_INSTRUCTIONS.referencePrefix}-PRI-${Math.floor(100000 + Math.random() * 900000)}`;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setStepIndex(0);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit =
    fullName.trim().length >= 3 &&
    documentNumber.trim().length >= 4 &&
    isValidEmail(email) &&
    isValidPhone(phone) &&
    acceptTerms;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: select & execCommand
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleConfirmReservation = () => {
    if (!canSubmit) {
      alert('Por favor completa todos los datos del comprador y acepta las condiciones.');
      return;
    }

    setIsProcessing(true);
    setStepIndex(0);

    window.setTimeout(() => setStepIndex(1), 700);
    window.setTimeout(() => setStepIndex(2), 1400);
    window.setTimeout(() => setStepIndex(3), 2100);

    window.setTimeout(() => {
      setIsProcessing(false);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.log(e);
      }

      const customer: ReservationCustomer = {
        fullName,
        documentType,
        documentNumber,
        email,
        phone,
        studentName,
        studentGrade,
      };

      // En modo demo el sistema todavía simula una reserva real pero con un
      // timestamp "real" (48h en el futuro) para que la lógica de expiración
      // siga siendo verificable en código.
      const now = Date.now();
      const expiresAtMs = isDemoMode
        ? now + 48 * 60 * 60 * 1000
        : now + 48 * 60 * 60 * 1000;

      const reservation: Reservation = {
        id: `RES-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date(now).toLocaleString('es-CO', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        createdAtMs: now,
        expiresAtMs: now + (isDemoMode
          ? 45 * 1000 // 45 segundos en modo demo rápido
          : expiresAtMs - now),
        presentationId: presentation.id,
        presentationTitle: presentation.title,
        presentationDate: presentation.date,
        presentationTime: presentation.time,
        seats: selectedSeats,
        unitPrice: ticketPrice,
        totalAmount,
        customer,
        status: 'pendiente',
        paymentReference: `${BANK_INSTRUCTIONS.referencePrefix}-${
          presentation.id === 'preescolar' ? 'PRE' :
          presentation.id === 'primaria' ? 'PRI' : 'BAC'
        }-${Math.floor(100000 + Math.random() * 900000)}`,
        qrPayload: JSON.stringify({
          type: 'RESERVA_TEATRO_2026',
          customer: customer.fullName,
          presentation: presentation.id,
          seats: selectedSeats.map((s) => `${s.row}-${s.number}`),
          total: totalAmount,
          demo: isDemoMode,
        }),
      };

      onReservationCreated(reservation);
    }, 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        className="bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-2xl max-h-screen sm:max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-modal-title"
      >
        {/* Header del modal - Identidad Colegio Mayor */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Cerrar modal de reserva"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white text-indigo-700 flex items-center justify-center font-black text-xl shadow-md">
              🎭
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span id="reservation-modal-title" className="font-extrabold tracking-wide text-lg sm:text-xl">
                  Reserva por Consignación
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Colegio Mayor 2026
                </span>
              </div>
              <p className="text-xs text-indigo-100">
                Temporada de Teatro Escolar • Asientos asegurados por 48 horas
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-white/90">
            <span className="flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5" />
              Tiempo para confirmar el pago por consignación:
            </span>
            <span className="font-bold bg-black/20 px-2 py-0.5 rounded">
              48 horas desde la reserva
            </span>
          </div>
        </div>

        {/* Cuerpo */}
        {isProcessing ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 border-2 border-indigo-200 flex items-center justify-center animate-spin">
              <Loader2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Creando tu reserva…
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium min-h-[1.5em]">
                {steps[stepIndex] || 'Casi listo…'}
              </p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(15, ((stepIndex + 1) / steps.length) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              No cierres esta ventana mientras procesamos tu reserva.
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
            {/* Resumen */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Función seleccionada:</span>
                <div className="font-bold text-slate-900 text-sm">{presentation.title}</div>
                <div className="text-slate-600">
                  {presentation.date} • {presentation.time}
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 font-medium">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'asiento' : 'asientos'} • a consignar:
                </span>
                <div className="font-extrabold text-base sm:text-lg text-indigo-700">
                  {formatCOP(totalAmount)}
                </div>
              </div>
            </div>

            {/* Cómo funciona */}
            <section className="bg-white border border-indigo-100 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ¿Cómo funciona la reserva por consignación?
              </h4>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-5 marker:font-bold">
                <li>
                  <strong className="text-slate-800">Reservas tus asientos</strong> en este formulario y los
                  bloqueamos por <strong>48 horas</strong>.
                </li>
                <li>
                  <strong className="text-slate-800">Recibes un correo</strong> con el resumen de tu reserva
                  y los datos para consignar en la cuenta del colegio.
                </li>
                <li>
                  <strong className="text-slate-800">Consignas</strong> el valor exacto en la cuenta indicada,
                  usando el código de referencia como concepto.
                </li>
                <li>
                  <strong className="text-slate-800">Envías el comprobante</strong> al correo del colegio y
                  confirmamos tu reserva cambiando el estado de los asientos a <em className="text-emerald-700">Vendido</em>.
                </li>
                <li>
                  Si en 48 horas <strong className="text-slate-800">no se confirma el pago</strong>, los
                  asientos vuelven a estar disponibles automáticamente.
                </li>
              </ol>
              {isDemoMode && (
                <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    <strong>Modo demo:</strong> para esta prueba la reserva expira en <strong>45 segundos</strong>
                    {' '}en lugar de 48 horas, con el fin de poder verificar visualmente la liberación automática de los asientos.
                  </span>
                </p>
              )}
            </section>

            {/* Formulario */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Información del Acudiente / Cliente:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label htmlFor="res-full-name" className="block text-slate-600 font-medium mb-1">
                    Nombre completo *
                  </label>
                  <input
                    id="res-full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María Pérez"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 font-medium"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-1/3">
                    <label htmlFor="res-doc-type" className="block text-slate-600 font-medium mb-1">Tipo</label>
                    <select
                      id="res-doc-type"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-slate-900 font-medium bg-white"
                    >
                      <option value="CC">C.C.</option>
                      <option value="CE">C.E.</option>
                      <option value="PAS">Pasaporte</option>
                      <option value="TI">T.I.</option>
                    </select>
                  </div>
                  <div className="w-2/3">
                    <label htmlFor="res-doc-number" className="block text-slate-600 font-medium mb-1">
                      No. Documento *
                    </label>
                    <input
                      id="res-doc-number"
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="1024…"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="res-email" className="block text-slate-600 font-medium mb-1">
                    <Mail className="inline w-3.5 h-3.5" /> Correo (recibe la reserva) *
                  </label>
                  <input
                    id="res-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                    aria-invalid={email.length > 0 && !isValidEmail(email)}
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-slate-900 font-medium ${
                      email.length > 0 && !isValidEmail(email)
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                        : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  />
                </div>

                <div>
                  <label htmlFor="res-phone" className="block text-slate-600 font-medium mb-1">
                    Celular / WhatsApp *
                  </label>
                  <input
                    id="res-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="310…"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="res-student-name" className="block text-slate-600 font-medium mb-1">
                    <User className="inline w-3.5 h-3.5" /> Nombre del estudiante
                  </label>
                  <input
                    id="res-student-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Nombre del alumno"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="res-student-grade" className="block text-slate-600 font-medium mb-1">
                    Grado del estudiante
                  </label>
                  <input
                    id="res-student-grade"
                    type="text"
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    placeholder="Ej. 3° A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none text-slate-900 font-medium"
                  />
                </div>
              </div>
            </section>

            <section className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Datos para consignar (los verás en tu correo):
              </h5>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-amber-900">
                <div>
                  <dt className="text-[10px] uppercase text-amber-700">Banco</dt>
                  <dd className="font-bold">{BANK_INSTRUCTIONS.bankName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-amber-700">Tipo de cuenta</dt>
                  <dd className="font-bold">{BANK_INSTRUCTIONS.accountType}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-amber-700">Número de cuenta</dt>
                  <dd className="font-mono font-bold">{BANK_INSTRUCTIONS.accountNumber}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-amber-700">Referencia de pago</dt>
                  <dd className="font-mono font-bold">{reservationReferenceSample}</dd>
                </div>
              </dl>
              <p className="text-[11px] text-amber-800">
                El código de referencia exacto se generará al confirmar tu reserva y se incluirá en el correo.
              </p>
            </section>

            {/* Aceptación de condiciones */}
            <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
              />
              <span>
                Acepto que la reserva tiene una validez de <strong>48 horas</strong>; si no se recibe
                confirmación de pago por consignación en ese plazo, los{' '}
                {selectedSeats.length === 1 ? 'asiento será liberado' : 'asientos serán liberados'} automáticamente.
                <strong className="text-slate-800"> Demo:</strong> el marcador expirará en segundos.
              </span>
            </label>

            </div>
        )}
        {/* Footer sticky: acciones + microcopy */}
        {!isProcessing && (
          <div className="border-t border-slate-200 bg-white p-4 shrink-0">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/3 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-reservation"
                onClick={handleConfirmReservation}
                disabled={!canSubmit}
                className={`w-full sm:w-2/3 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                  canSubmit
                    ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-indigo-500/30 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Reservar {selectedSeats.length > 0 ? formatCOP(totalAmount) : ''}</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 sm:gap-4 text-[10px] text-slate-500 pt-2">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-indigo-500" />
                Notificación por correo
              </span>
              <span className="text-slate-300">•</span>
              <span>Reserva válida por 48 horas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
