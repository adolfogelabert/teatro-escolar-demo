/**
 * Tipos y definiciones de datos para el Sistema de Asignación de Asientos
 * Teatro Escolar
 */

export type SeatStatus = 'disponible' | 'seleccionado' | 'reservado' | 'ocupado' | 'bloqueado';

export type SectionType = 'platea' | 'balcon1' | 'balcon2' | 'balcon3' | 'palcos';

export interface Seat {
  id: string;
  sectionId: SectionType;
  sectionName: string;
  subSection?: string;
  row: string;
  number: number;
  label: string;
  defaultBlocked: boolean;
  price: number;
}

export type PresentationId = 'preescolar' | 'primaria' | 'bachillerato';

export interface Presentation {
  id: PresentationId;
  name: string;
  title: string;
  obra: string;
  date: string;
  time: string;
  grades: string;
  badgeColor: string;
  accentColor: string;
  description: string;
}

export interface SeatInventoryEntry {
  status: SeatStatus;
  reservationExpiresAt?: number; // epoch ms - solo para 'reservado'
  reservationId?: string;
}

export type SeatInventory = Record<string, SeatInventoryEntry>;

export type TheaterInventoryByPresentation = Record<PresentationId, SeatInventory>;

export interface ReservationCustomer {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  studentName: string;
  studentGrade: string;
}

export interface BankInstructions {
  bankName: string;
  accountHolder: string;
  accountType: 'Ahorros' | 'Corriente';
  accountNumber: string;
  referencePrefix: string;
  instructions: string;
}

export type ReservationStatus = 'pendiente' | 'confirmada' | 'expirada' | 'cancelada';

export interface Reservation {
  id: string;                 // RES-XXXXXX
  createdAt: string;          // fecha visible
  createdAtMs: number;        // epoch ms
  expiresAtMs: number;        // epoch ms (createdAtMs + 48h)
  presentationId: PresentationId;
  presentationTitle: string;
  presentationDate: string;
  presentationTime: string;
  seats: Seat[];
  unitPrice: number;
  totalAmount: number;
  customer: ReservationCustomer;
  status: ReservationStatus;
  paymentReference: string;   // ej. RES-123456-PRI
  qrPayload: string;
}

export interface AdminStats {
  totalSeats: number;
  availableSeats: number;
  selectedSeats: number;
  reservedSeats: number;
  occupiedSeats: number;
  blockedSeats: number;
  totalRevenue: number;
  potentialRevenue: number;
  activeReservations: number;
  expiringReservations: number;
}
