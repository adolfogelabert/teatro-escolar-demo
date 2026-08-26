import { Presentation, PresentationId, SeatInventory } from '../types';
import { generateTheaterSeats } from './theaterData';

export const PRESENTATIONS: Presentation[] = [
  {
    id: 'preescolar',
    name: 'Preescolar',
    title: 'El Reino Mágico de las Estrellas',
    obra: 'Muestra Artística y Musical Infantil',
    date: 'Viernes 28 de Agosto, 2026',
    time: '9:00 AM',
    grades: 'Pre-Jardín, Jardín y Transición',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    accentColor: 'from-amber-500 to-orange-500',
    description: 'Presentación de expresión corporal, coro y coreografía de los más pequeños de la institución.',
  },
  {
    id: 'primaria',
    name: 'Primaria',
    title: 'El Principito y el Viaje de los Mundos',
    obra: 'Adaptación Teatral y Ensamble Instrumental',
    date: 'Sábado 29 de Agosto, 2026',
    time: '2:30 PM',
    grades: '1° a 5° Grado',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    accentColor: 'from-emerald-500 to-teal-600',
    description: 'Obra teatral clásica con música en vivo interpretada por la orquesta y grupo de teatro de primaria.',
  },
  {
    id: 'bachillerato',
    name: 'Bachillerato',
    title: 'Sueño de una Noche de Verano',
    obra: 'Gran Gala de Teatro y Danza Contemporánea',
    date: 'Sábado 29 de Agosto, 2026',
    time: '6:30 PM',
    grades: '6° a 11° Grado',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    accentColor: 'from-indigo-500 to-purple-600',
    description: 'Puesta en escena estelar de teatro clásico con banda sinfónica, coro polifónico y danza moderna.',
  },
];

/**
 * Inicializa el inventario para una presentación:
 * - Palcos y dos primeras filas (A y B de Platea Central) -> 'bloqueado'
 * - Algunos asientos de demostración ocupados/pagados para realismo inicial
 * - El resto -> 'disponible'
 */
export function createInitialInventory(presentationId: PresentationId, unitPrice?: number): SeatInventory {
  const allSeats = generateTheaterSeats(unitPrice);
  const inventory: SeatInventory = {};

  // Semilla pseudo-aleatoria según el id de la presentación para variedad
  const seedMultiplier = presentationId === 'preescolar' ? 3 : presentationId === 'primaria' ? 7 : 11;

  allSeats.forEach((seat, index) => {
    // 1. Regla Mandatoria: Palcos y 2 primeras filas de Platea bloqueados
    if (seat.defaultBlocked) {
      inventory[seat.id] = 'bloqueado';
      return;
    }

    // 2. Asientos ocupados / pagados previamente para enriquecer la demo
    // Unos cuantos asientos en Platea C, D, E o Balcón 1 ocupados
    const isInitiallySold = (index * seedMultiplier + 13) % 23 === 0;

    if (isInitiallySold) {
      inventory[seat.id] = 'ocupado';
    } else {
      inventory[seat.id] = 'disponible';
    }
  });

  return inventory;
}

/**
 * Carga o inicializa los inventarios de todas las presentaciones desde localStorage
 */
export const STORAGE_KEY_PREFIX = 'teatro_escolar_asientos_v1_';
export const STORAGE_PRICE_KEY = 'teatro_escolar_precio_boleta';

export function loadInventories(unitPrice?: number): Record<PresentationId, SeatInventory> {
  const result: Record<PresentationId, SeatInventory> = {
    preescolar: {},
    primaria: {},
    bachillerato: {},
  };

  PRESENTATIONS.forEach((pres) => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pres.id}`);
      if (saved) {
        result[pres.id] = JSON.parse(saved);
      } else {
        const initial = createInitialInventory(pres.id, unitPrice);
        result[pres.id] = initial;
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${pres.id}`, JSON.stringify(initial));
      }
    } catch {
      result[pres.id] = createInitialInventory(pres.id, unitPrice);
    }
  });

  return result;
}

export function saveInventory(presentationId: PresentationId, inventory: SeatInventory): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${presentationId}`, JSON.stringify(inventory));
  } catch (e) {
    console.error('Error guardando inventario:', e);
  }
}
