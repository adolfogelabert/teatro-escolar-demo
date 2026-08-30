import React, { useState } from 'react';
import { Reservation } from '../types';
import { formatCOP } from '../data/theaterData';
import { loadReservations } from '../data/reservations';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Ticket,
  Calendar,
  User,
  CreditCard,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface QRVerifierProps {
  onBack: () => void;
}

type VerifyResult = {
  found: true;
  reservation: Reservation;
  isExpired: boolean;
} | {
  found: false;
};

function getStatusConfig(status: string, isExpired: boolean) {
  if (isExpired && status === 'pendiente') {
    return {
      icon: <Clock className="w-8 h-8" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-300',
      label: 'Expirada',
      description: 'La reserva ha expirado. Los asientos fueron liberados.',
    };
  }
  switch (status) {
    case 'confirmada':
      return {
        icon: <CheckCircle2 className="w-8 h-8" />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-300',
        label: 'Pagada y Confirmada',
        description: 'El pago fue recibido. Esta reserva es válida.',
      };
    case 'pendiente':
      return {
        icon: <Clock className="w-8 h-8" />,
        color: 'text-amber-600',
        bg: 'bg-amber-50 border-amber-300',
        label: 'Pendiente de Pago',
        description: 'Esperando consignación bancaria.',
      };
    case 'expirada':
      return {
        icon: <XCircle className="w-8 h-8" />,
        color: 'text-rose-600',
        bg: 'bg-rose-50 border-rose-300',
        label: 'Expirada',
        description: 'La reserva expiró. Los asientos fueron liberados.',
      };
    case 'cancelada':
      return {
        icon: <XCircle className="w-8 h-8" />,
        color: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-300',
        label: 'Cancelada',
        description: 'Esta reserva fue cancelada.',
      };
    default:
      return {
        icon: <AlertTriangle className="w-8 h-8" />,
        color: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-300',
        label: 'Desconocido',
        description: 'Estado no reconocido.',
      };
  }
}

export const QRVerifier: React.FC<QRVerifierProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    const reservations = loadReservations();

    // Search by reservation ID, payment reference, or QR payload content
    const match = reservations.find((r) => {
      if (r.id.toUpperCase() === query) return true;
      if (r.paymentReference.toUpperCase() === query) return true;
      if (r.qrPayload.toUpperCase().includes(query)) return true;
      // Also search by customer name (partial match)
      if (r.customer.fullName.toUpperCase().includes(query)) return true;
      return false;
    });

    if (match) {
      setResult({
        found: true,
        reservation: match,
        isExpired: match.expiresAtMs < Date.now(),
      });
    } else {
      setResult({ found: false });
    }
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Verificador de Reservas</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center">
            <QrCode className="w-9 h-9 text-indigo-300" />
          </div>
          <h1 className="text-xl font-extrabold">Verificar Reserva</h1>
          <p className="text-sm text-white/60">
            Ingresa el código de la reserva o referencia de pago para verificar su estado.
          </p>
        </div>

        {/* Search Input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Código de Reserva o Referencia
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej. RES-123456 o TEATRO-2026-PRI-..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/30 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        {/* Result */}
        {searched && result && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {result.found ? (
              <VerificationSuccess reservation={result.reservation} isExpired={result.isExpired} />
            ) : (
              <VerificationNotFound query={searchQuery} />
            )}
          </div>
        )}

        {/* Demo hint */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/40 text-center">
          <strong className="text-white/60">Demo:</strong> Ingresa un ID de reserva (ej. RES-XXXXXX)
          o nombre del cliente para buscar.
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────

const VerificationSuccess: React.FC<{
  reservation: Reservation;
  isExpired: boolean;
}> = ({ reservation, isExpired }) => {
  const status = getStatusConfig(reservation.status, isExpired);

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={`${status.bg} border-2 rounded-2xl p-5 text-center space-y-2`}>
        <div className={`${status.color} flex justify-center`}>{status.icon}</div>
        <h2 className={`text-lg font-extrabold ${status.color}`}>{status.label}</h2>
        <p className="text-xs text-slate-600">{status.description}</p>
      </div>

      {/* Reservation Details */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <Ticket className="w-3.5 h-3.5" />
          Datos de la Reserva
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-white/40 block">ID Reserva:</span>
            <span className="font-mono font-bold text-white">{reservation.id}</span>
          </div>
          <div>
            <span className="text-white/40 block">Referencia:</span>
            <span className="font-mono font-bold text-white">{reservation.paymentReference}</span>
          </div>
          <div>
            <span className="text-white/40 block">Presentación:</span>
            <span className="font-bold text-white">{reservation.presentationTitle}</span>
          </div>
          <div>
            <span className="text-white/40 block">Fecha:</span>
            <span className="font-bold text-white">{reservation.presentationDate}</span>
          </div>
          <div>
            <span className="text-white/40 block">Hora:</span>
            <span className="font-bold text-white">{reservation.presentationTime}</span>
          </div>
          <div>
            <span className="text-white/40 block">Valor:</span>
            <span className="font-black text-emerald-400">{formatCOP(reservation.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <User className="w-3.5 h-3.5" />
          Cliente
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-white/40 block">Nombre:</span>
            <span className="font-bold text-white">{reservation.customer.fullName}</span>
          </div>
          <div>
            <span className="text-white/40 block">Documento:</span>
            <span className="font-bold text-white">
              {reservation.customer.documentType} {reservation.customer.documentNumber}
            </span>
          </div>
          <div>
            <span className="text-white/40 block">Estudiante:</span>
            <span className="font-bold text-white">{reservation.customer.studentName || '—'}</span>
          </div>
          <div>
            <span className="text-white/40 block">Grado:</span>
            <span className="font-bold text-white">{reservation.customer.studentGrade}</span>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <Ticket className="w-3.5 h-3.5" />
          Asientos ({reservation.seats.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {reservation.seats.map((s) => (
            <span
              key={s.id}
              className="bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              {s.sectionName} • Fila {s.row} • #{s.number}
            </span>
          ))}
        </div>
      </div>

      {/* QR Payload (for verification) */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
          <QrCode className="w-3.5 h-3.5" />
          Datos del QR
        </h3>
        <pre className="bg-black/30 rounded-lg p-3 text-[10px] text-white/60 font-mono overflow-x-auto break-all">
          {reservation.qrPayload}
        </pre>
      </div>
    </div>
  );
};

const VerificationNotFound: React.FC<{ query: string }> = ({ query }) => (
  <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-center space-y-3">
    <div className="text-rose-500 flex justify-center">
      <XCircle className="w-10 h-10" />
    </div>
    <h2 className="text-lg font-extrabold text-rose-700">Reserva No Encontrada</h2>
    <p className="text-sm text-rose-600">
      No se encontró ninguna reserva con el código:
    </p>
    <p className="font-mono font-bold text-rose-800 bg-rose-100 px-3 py-2 rounded-lg text-sm break-all">
      {query}
    </p>
    <p className="text-xs text-rose-500">
      Verifica el código e intenta nuevamente. Asegúrate de incluir guiones si los tiene.
    </p>
  </div>
);
