/**
 * Tipos y definiciones de datos para el Sistema de Asignación de Asientos
 * Teatro Escolar
 */

export type SeatStatus = 'disponible' | 'seleccionado' | 'ocupado' | 'bloqueado';

export type SectionType = 'platea' | 'balcon1' | 'balcon2' | 'balcon3' | 'palcos';

export interface Seat {
  id: string; // Identificador único: ej. "platea-C-112"
  sectionId: SectionType;
  sectionName: string;
  subSection?: string; // "Izquierda", "Centro", "Derecha", "Delantera", "Trasera"
  row: string;
  number: number;
  label: string;
  defaultBlocked: boolean; // Palcos y dos primeras filas de Platea
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

export type SeatInventory = Record<string, SeatStatus>;

export type TheaterInventoryByPresentation = Record<PresentationId, SeatInventory>;

export interface CustomerInfo {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  studentName: string;
  studentGrade: string;
  paymentMethod: 'pse' | 'tarjeta' | 'daviplata';
  bankName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export interface PurchaseReceipt {
  transactionId: string;
  authorizationCode: string;
  date: string;
  presentationId: PresentationId;
  presentationTitle: string;
  presentationDate: string;
  presentationTime: string;
  seats: Seat[];
  unitPrice: number;
  totalAmount: number;
  customer: CustomerInfo;
  paymentMethod: string;
  status: 'Aprobada' | 'Rechazada';
  qrCodeDataUrl?: string;
}

export interface AdminStats {
  totalSeats: number;
  availableSeats: number;
  selectedSeats: number;
  occupiedSeats: number;
  blockedSeats: number;
  totalRevenue: number;
  potentialRevenue: number;
}
