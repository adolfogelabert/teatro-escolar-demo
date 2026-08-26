import { Seat } from '../types';

/**
 * Variable global de precio por boleta
 * Modificable dinámicamente desde el Panel de Administración o configuración
 */
export const DEFAULT_TICKET_PRICE = 80000; // $80.000 COP

/**
 * Helper para generar rangos descendentes (ej. 122 down to 101)
 */
function createRange(start: number, end: number): number[] {
  const result: number[] = [];
  if (start >= end) {
    for (let i = start; i >= end; i--) {
      result.push(i);
    }
  } else {
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Generador de todos los asientos del Teatro según el plano arquitectónico oficial
 */
export function generateTheaterSeats(unitPrice: number = DEFAULT_TICKET_PRICE): Seat[] {
  const seats: Seat[] = [];

  // ==========================================
  // 1. PALCOS DE PLATEA (BLOQUEADOS POR REGLA)
  // ==========================================
  // Palcos Izquierda Platea (Columnas 1, 2, 3 ABL)
  const palcoIzqCols = [
    { col: '1', count: 5 },
    { col: '2', count: 5 },
    { col: '3', count: 7, label: 'ABL' },
  ];
  palcoIzqCols.forEach((colInfo) => {
    for (let i = 1; i <= colInfo.count; i++) {
      seats.push({
        id: `palco-izq-${colInfo.col}-${i}`,
        sectionId: 'palcos',
        sectionName: 'Palcos Platea',
        subSection: 'Palco Lateral Izquierdo',
        row: `P-Izq ${colInfo.col}`,
        number: i,
        label: `Palco Izq Col ${colInfo.col} - Asiento ${i}`,
        defaultBlocked: true, // Los palcos deben estar bloqueados
        price: unitPrice,
      });
    }
  });

  // Palcos Derecha Platea (Columnas 1, 2, 3)
  const palcoDerCols = [
    { col: '1', count: 7 },
    { col: '2', count: 5 },
    { col: '3', count: 6 },
  ];
  palcoDerCols.forEach((colInfo) => {
    for (let i = 1; i <= colInfo.count; i++) {
      seats.push({
        id: `palco-der-${colInfo.col}-${i}`,
        sectionId: 'palcos',
        sectionName: 'Palcos Platea',
        subSection: 'Palco Lateral Derecho',
        row: `P-Der ${colInfo.col}`,
        number: i,
        label: `Palco Der Col ${colInfo.col} - Asiento ${i}`,
        defaultBlocked: true, // Bloqueado
        price: unitPrice,
      });
    }
  });

  // ==========================================
  // 2. PLATEA CENTRAL - FILAS DELANTERAS (A - L)
  // ==========================================
  const plateaFrontRows: { row: string; maxSeat: number }[] = [
    { row: 'A', maxSeat: 122 }, // Fila 1 -> Bloqueada por regla
    { row: 'B', maxSeat: 126 }, // Fila 2 -> Bloqueada por regla
    { row: 'C', maxSeat: 126 },
    { row: 'D', maxSeat: 128 },
    { row: 'E', maxSeat: 127 },
    { row: 'F', maxSeat: 129 },
    { row: 'G', maxSeat: 130 },
    { row: 'H', maxSeat: 129 },
    { row: 'J', maxSeat: 130 },
    { row: 'K', maxSeat: 131 },
    { row: 'L', maxSeat: 130 },
  ];

  plateaFrontRows.forEach(({ row, maxSeat }) => {
    const isFirstTwoRows = row === 'A' || row === 'B'; // Regla: 2 primeras filas bloqueadas
    const seatNumbers = createRange(maxSeat, 101);
    seatNumbers.forEach((num) => {
      seats.push({
        id: `platea-${row}-${num}`,
        sectionId: 'platea',
        sectionName: 'Platea Central',
        subSection: 'Zona Delantera',
        row,
        number: num,
        label: `Platea - Fila ${row} - Asiento ${num}`,
        defaultBlocked: isFirstTwoRows,
        price: unitPrice,
      });
    });
  });

  // ==========================================
  // 3. PLATEA CENTRAL - FILAS TRASERAS (M - T)
  // ==========================================
  const plateaRearConfig = [
    {
      row: 'M',
      left: [15, 13, 11, 9, 7, 5, 3, 1],
      centerMax: 115,
      right: [2, 4, 6, 8, 10, 12, 14, 16],
    },
    {
      row: 'N',
      left: [15, 13, 11, 9, 7, 5, 3, 1],
      centerMax: 115,
      right: [2, 4, 6, 8, 10, 12, 14, 16],
    },
    {
      row: 'P',
      left: [13, 11, 9, 7, 5, 3, 1],
      centerMax: 115,
      right: [2, 4, 6, 8, 10, 12, 14],
    },
    {
      row: 'Q',
      left: [13, 11, 9, 7, 5, 3, 1],
      centerMax: 115,
      right: [2, 4, 6, 8, 10, 12, 14],
    },
    {
      row: 'R',
      left: [13, 11, 9, 7, 5, 3, 1],
      centerMax: 115,
      right: [2, 4, 6, 8, 10, 12, 14],
    },
    {
      row: 'S',
      left: [9, 7, 5, 3, 1],
      centerMax: 116,
      right: [2, 4, 6, 8, 10],
    },
    {
      row: 'T',
      left: [5, 3, 1],
      centerMax: 116,
      right: [2, 4, 6],
    },
  ];

  plateaRearConfig.forEach(({ row, left, centerMax, right }) => {
    // Left (Impares)
    left.forEach((num) => {
      seats.push({
        id: `platea-${row}-${num}`,
        sectionId: 'platea',
        sectionName: 'Platea Central',
        subSection: 'Lateral Izquierdo',
        row,
        number: num,
        label: `Platea - Fila ${row} - Asiento ${num} (Izq)`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });

    // Center (115..101 o 116..101)
    const centerSeats = createRange(centerMax, 101);
    centerSeats.forEach((num) => {
      seats.push({
        id: `platea-${row}-${num}`,
        sectionId: 'platea',
        sectionName: 'Platea Central',
        subSection: 'Centro',
        row,
        number: num,
        label: `Platea - Fila ${row} - Asiento ${num}`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });

    // Right (Pares)
    right.forEach((num) => {
      seats.push({
        id: `platea-${row}-${num}`,
        sectionId: 'platea',
        sectionName: 'Platea Central',
        subSection: 'Lateral Derecho',
        row,
        number: num,
        label: `Platea - Fila ${row} - Asiento ${num} (Der)`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });
  });

  // ==========================================
  // 4. 1° BALCÓN - Distribución arquitectónica con laterales + filas centrales AA-EE
  // ==========================================
  // Layout típico de balcón:
  //   • Ala lateral izquierda (Filas 1 a 5 Izq)      → impares descendentes
  //   • Centro (Filas AA a EE)                        → asientos 101..N contiguos
  //   • Ala lateral derecha (Filas 1 a 5 Der)        → pares ascendentes
  const balcon1Left = [
    { row: '1', seats: [25, 23, 21, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1] },
    { row: '2', seats: [23, 21, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1] },
    { row: '3', seats: [19, 17, 15, 13, 11, 9, 7, 5, 3, 1] },
    { row: '4', seats: [15, 13, 11, 9, 7, 5, 3, 1] },
    { row: '5', seats: [13, 11, 9, 7, 5, 3, 1] },
  ];

  balcon1Left.forEach(({ row, seats: seatNums }) => {
    seatNums.forEach((num) => {
      seats.push({
        id: `balcon1-izq-${row}-${num}`,
        sectionId: 'balcon1',
        sectionName: '1° Balcón',
        subSection: 'Lateral Izquierdo',
        row: `Fila ${row} Izq`,
        number: num,
        label: `1° Balcón - Fila ${row} Izq - Asiento ${num}`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });
  });

  const balcon1Center = [
    { row: 'AA', maxSeat: 119 },
    { row: 'BB', maxSeat: 120 },
    { row: 'CC', maxSeat: 120 },
    { row: 'DD', maxSeat: 120 },
    { row: 'EE', maxSeat: 122 },
  ];

  balcon1Center.forEach(({ row, maxSeat }) => {
    const seatNums = createRange(maxSeat, 101);
    seatNums.forEach((num) => {
      seats.push({
        id: `balcon1-${row}-${num}`,
        sectionId: 'balcon1',
        sectionName: '1° Balcón',
        subSection: 'Centro',
        row,
        number: num,
        label: `1° Balcón - Fila ${row} - Asiento ${num}`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });
  });

  const balcon1Right = [
    { row: '1', seats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26] },
    { row: '2', seats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24] },
    { row: '3', seats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
    { row: '4', seats: [2, 4, 6, 8, 10, 12, 14, 16] },
    { row: '5', seats: [2, 4, 6, 8, 10, 12, 14] },
  ];

  balcon1Right.forEach(({ row, seats: seatNums }) => {
    seatNums.forEach((num) => {
      seats.push({
        id: `balcon1-der-${row}-${num}`,
        sectionId: 'balcon1',
        sectionName: '1° Balcón',
        subSection: 'Lateral Derecho',
        row: `Fila ${row} Der`,
        number: num,
        label: `1° Balcón - Fila ${row} Der - Asiento ${num}`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });
  });

  // ==========================================
  // 5. 2° BALCÓN
  // ==========================================
  // Palcos 2° Balcón (Bloqueados)
  for (let i = 1; i <= 7; i++) {
    seats.push({
      id: `palco-b2-izq-${i}`,
      sectionId: 'palcos',
      sectionName: 'Palcos 2° Balcón',
      subSection: 'Palco 2° Balcón Izq',
      row: 'Palco B2-Izq',
      number: i,
      label: `Palco 2° Balcón Izq - Asiento ${i}`,
      defaultBlocked: true,
      price: unitPrice,
    });
    seats.push({
      id: `palco-b2-der-${i}`,
      sectionId: 'palcos',
      sectionName: 'Palcos 2° Balcón',
      subSection: 'Palco 2° Balcón Der',
      row: 'Palco B2-Der',
      number: i,
      label: `Palco 2° Balcón Der - Asiento ${i}`,
      defaultBlocked: true,
      price: unitPrice,
    });
  }

  const balcon2Rows = [
    { row: 'A', maxSeat: 146 },
    { row: 'B', maxSeat: 143 },
    { row: 'C', maxSeat: 142 },
    { row: 'D', maxSeat: 141 },
    { row: 'E', maxSeat: 143 },
  ];

  balcon2Rows.forEach(({ row, maxSeat }) => {
    const seatNums = createRange(maxSeat, 101);
    seatNums.forEach((num) => {
      seats.push({
        id: `balcon2-${row}-${num}`,
        sectionId: 'balcon2',
        sectionName: '2° Balcón',
        subSection: 'Centro',
        row,
        number: num,
        label: `2° Balcón - Fila ${row} - Asiento ${num}`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });
  });

  // ==========================================
  // 6. 3° BALCÓN
  // ==========================================
  const balcon3Rows = [
    { row: 'A', maxSeat: 148 },
    { row: 'B', maxSeat: 145 },
    { row: 'C', maxSeat: 142 },
    { row: 'D', maxSeat: 143 },
    { row: 'E', maxSeat: 140 },
    { row: 'F', maxSeat: 141 },
    { row: 'G', maxSeat: 140 },
    { row: 'H', maxSeat: 124 },
  ];

  balcon3Rows.forEach(({ row, maxSeat }) => {
    const seatNums = createRange(maxSeat, 101);
    seatNums.forEach((num) => {
      seats.push({
        id: `balcon3-${row}-${num}`,
        sectionId: 'balcon3',
        sectionName: '3° Balcón',
        subSection: 'Centro',
        row,
        number: num,
        label: `3° Balcón - Fila ${row} - Asiento ${num}`,
        defaultBlocked: false,
        price: unitPrice,
      });
    });
  });

  return seats;
}

/**
 * Formateador de moneda en Pesos Colombianos (COP)
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
