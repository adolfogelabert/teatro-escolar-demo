import {
  Presentation,
  PresentationId,
  Reservation,
  ReservationCustomer,
  ReservationStatus,
  Seat,
  SeatInventoryEntry,
  SeatInventory,
  BankInstructions,
} from '../types';

/**
 * Ventana de tiempo que el cliente tiene para confirmar su pago por consignación.
 * Pasado este plazo la reserva expira y los asientos vuelven a estar disponibles.
 */
export const RESERVATION_DURATION_MS = 48 * 60 * 60 * 1000; // 48 horas

/**
 * Instrucciones bancarias simuladas que se muestran al cliente al confirmar
 * su reserva. En producción estos datos vendrían del colegio.
 */
export const BANK_INSTRUCTIONS: BankInstructions = {
  bankName: 'Banco de los Andes',
  accountHolder: 'Colegio Mayor — Temporada de Teatro 2026',
  accountType: 'Ahorros',
  accountNumber: '123-456789-00',
  referencePrefix: 'TEATRO-2026',
  instructions:
    'Consignar el valor exacto en la cuenta indicada usando el código de referencia como concepto. ' +
    'Una vez realizada la consignación, enviar el comprobante al correo teatro@colegiomayor.edu.co ' +
    'para confirmar la reserva antes de las 48 horas.',
};

/**
 * Llave de localStorage para la lista de reservas activas.
 */
export const STORAGE_RESERVATIONS_KEY = 'teatro_escolar_reservas_v1';

/**
 * Carga todas las reservas persistidas y limpia las que ya expiraron.
 */
export function loadReservations(): Reservation[] {
  try {
    const raw = localStorage.getItem(STORAGE_RESERVATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Reservation[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && typeof r === 'object' && typeof r.id === 'string');
  } catch {
    return [];
  }
}

/**
 * Persiste la lista completa de reservas.
 */
export function saveReservations(reservations: Reservation[]): void {
  try {
    localStorage.setItem(STORAGE_RESERVATIONS_KEY, JSON.stringify(reservations));
  } catch (e) {
    console.error('Error guardando reservas:', e);
  }
}

/**
 * Genera un código único para la reserva (RES-XXXXXX) y su referencia de pago.
 */
function generateReservationCode(presentationId: PresentationId): {
  id: string;
  reference: string;
} {
  const random = Math.floor(100000 + Math.random() * 900000);
  const id = `RES-${random}`;
  const prefix = presentationId === 'preescolar'
    ? 'PRE'
    : presentationId === 'primaria'
    ? 'PRI'
    : 'BAC';
  return { id, reference: `${BANK_INSTRUCTIONS.referencePrefix}-${prefix}-${random}` };
}

/**
 * Crea una nueva reserva, la agrega a la lista persistida y devuelve el objeto.
 */
export function createReservation(params: {
  seats: Seat[];
  unitPrice: number;
  customer: ReservationCustomer;
  presentation: Presentation;
}): Reservation {
  const now = Date.now();
  const { id, reference } = generateReservationCode(params.presentation.id);

  const reservation: Reservation = {
    id,
    createdAt: new Date(now).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    createdAtMs: now,
    expiresAtMs: now + RESERVATION_DURATION_MS,
    presentationId: params.presentation.id,
    presentationTitle: params.presentation.title,
    presentationDate: params.presentation.date,
    presentationTime: params.presentation.time,
    seats: params.seats,
    unitPrice: params.unitPrice,
    totalAmount: params.seats.length * params.unitPrice,
    customer: params.customer,
    status: 'pendiente',
    paymentReference: reference,
    qrPayload: JSON.stringify({
      type: 'RESERVA_TEATRO_2026',
      id,
      reference,
      presentation: params.presentation.id,
      seats: params.seats.map((s) => `${s.row}-${s.number}`),
      expiresAtMs: now + RESERVATION_DURATION_MS,
      total: params.seats.length * params.unitPrice,
    }),
  };

  const existing = loadReservations();
  existing.push(reservation);
  saveReservations(existing);
  return reservation;
}

/**
 * Marca una reserva como confirmada por el colegio (cuando se recibe la consignación).
 */
export function confirmReservation(reservationId: string): void {
  const reservations = loadReservations();
  const updated = reservations.map((r) =>
    r.id === reservationId ? { ...r, status: 'confirmada' as ReservationStatus } : r
  );
  saveReservations(updated);
}

/**
 * Marca una reserva específica como cancelada y libera sus asientos.
 * Devuelve los IDs de asientos que deben pasar a 'disponible'.
 */
export function cancelReservation(reservationId: string): string[] {
  const reservations = loadReservations();
  const cancelled = reservations.find((r) => r.id === reservationId);
  if (!cancelled) return [];
  const updated = reservations.map((r) =>
    r.id === reservationId ? { ...r, status: 'cancelada' as ReservationStatus } : r
  );
  saveReservations(updated);
  return cancelled.seats.map((s) => s.id);
}

/**
 * Marca como 'expirada' todas las reservas cuya fecha límite ya pasó
 * y devuelve los IDs de asientos a liberar.
 */
export function cleanupExpiredReservations(
  reservations: Reservation[],
  now: number = Date.now()
): { expiredIds: string[]; seatsToRelease: string[]; updatedReservations: Reservation[] } {
  const expiredIds: string[] = [];
  const seatsToRelease: string[] = [];

  const updatedReservations = reservations.map((r) => {
    if (r.status === 'pendiente' && r.expiresAtMs <= now) {
      expiredIds.push(r.id);
      seatsToRelease.push(...r.seats.map((s) => s.id));
      return { ...r, status: 'expirada' as ReservationStatus };
    }
    return r;
  });

  if (expiredIds.length > 0) {
    saveReservations(updatedReservations);
  }

  return { expiredIds, seatsToRelease, updatedReservations };
}

/**
 *Dado un inventario (objeto por presentación), actualiza el estado de cada
 * asiento según la lista de reservas, asegurando que sólo las reservas
 * 'pendiente' o 'confirmada' mantienen el asiento en 'reservado'/'ocupado'.
 */
export function syncInventoryWithReservations(
  inventory: SeatInventory,
  reservations: Reservation[],
  now: number = Date.now()
): SeatInventory {
  // Empezamos eliminando cualquier entrada 'reservado'/'ocupado' que NO
  // esté respaldada por una reserva activa. Conservamos los 'bloqueado' y 'ocupado'.
  const next: SeatInventory = {};
  for (const [seatId, entry] of Object.entries(inventory)) {
    if (entry.status === 'bloqueado') {
      next[seatId] = { status: 'bloqueado' };
      continue;
    }
    if (entry.status === 'ocupado') {
      next[seatId] = { status: 'ocupado' };
      continue;
    }
    // disponible y seleccionado se mantienen por defecto
    next[seatId] = { status: entry.status };
  }

  // Aplicar reservas activas: cada reserva válida marca sus asientos como
  // 'reservado' (con expiración) o 'ocupado' (confirmada).
  for (const r of reservations) {
    const active =
      r.status === 'confirmada' ||
      (r.status === 'pendiente' && r.expiresAtMs > now);

    if (!active) continue;

    for (const seat of r.seats) {
      if (r.status === 'confirmada') {
        next[seat.id] = { status: 'ocupado' };
      } else {
        next[seat.id] = {
          status: 'reservado',
          reservationExpiresAt: r.expiresAtMs,
          reservationId: r.id,
        };
      }
    }
  }

  return next;
}

/**
 * Devuelve el tiempo restante en milisegundos para una reserva.
 */
export function getRemainingMs(expiresAtMs: number, now: number = Date.now()): number {
  return Math.max(0, expiresAtMs - now);
}

/**
 * Formatea milisegundos restantes en texto legible ("47h 32m" o "0h 0m").
 */
export function formatRemaining(expiresAtMs: number, now: number = Date.now()): string {
  const ms = getRemainingMs(expiresAtMs, now);
  const totalMinutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0 && minutes <= 0) return 'Expirada';
  return `${hours}h ${minutes}m`;
}

/**
 * Construye una entrada de inventario para el estado 'seleccionado'.
 */
export function selectedEntry(): SeatInventoryEntry {
  return { status: 'seleccionado' };
}

/**
 * Construye una entrada de inventario para el estado 'disponible'.
 */
export function availableEntry(): SeatInventoryEntry {
  return { status: 'disponible' };
}
