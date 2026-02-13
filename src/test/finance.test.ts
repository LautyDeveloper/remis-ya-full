
import { describe, it, expect } from 'vitest';
import { calculateDailyComissions, calculateTotalRevenue } from '../utils/financeCalculations';
import { Viaje } from '../types';

describe('Financial Calculations', () => {
  const mockViajes: Partial<Viaje>[] = [
    { id: 1, monto: 1000, fechaHora: '2023-10-01T10:00:00Z', estado: 'completado', choferId: 1 },
    { id: 2, monto: 500, fechaHora: '2023-10-01T15:00:00Z', estado: 'completado', choferId: 1 },
    { id: 3, monto: 2000, fechaHora: '2023-10-02T10:00:00Z', estado: 'completado', choferId: 1 },
    { id: 4, monto: 1000, fechaHora: '2023-10-01T10:00:00Z', estado: 'completado', choferId: 2 },
    { id: 5, monto: 500, fechaHora: '2023-10-01T10:00:00Z', estado: 'cancelado', choferId: 1 },
  ];

  it('should calculate total revenue correctly', () => {
    const total = calculateTotalRevenue(mockViajes as Viaje[]);
    expect(total).toBe(4500); // 1000 + 500 + 2000 + 1000
  });

  it('should calculate daily commissions correctly for a driver', () => {
    // Driver 1:
    // Day 1: 1000 + 500 = 1500 -> 20% = 300
    // Day 2: 2000 -> 20% = 400
    // Total: 700
    const comision = calculateDailyComissions(mockViajes as Viaje[], 1);
    expect(comision).toBe(700);
  });

  it('should calculate flat commission for Gonzalo (choferId: 2)', () => {
    // Driver 2:
    // Only has trips on 2023-10-01 (mockViajes[3])
    // Should be $7,500
    const comision = calculateDailyComissions(mockViajes as Viaje[], 2);
    expect(comision).toBe(7500);

    // If he had trips on another day
    const moreViajes: Partial<Viaje>[] = [
      ...mockViajes,
      { id: 6, monto: 1000, fechaHora: '2023-10-02T10:00:00Z', estado: 'completado', choferId: 2 }
    ];
    const comision2 = calculateDailyComissions(moreViajes as Viaje[], 2);
    expect(comision2).toBe(15000); // 2 days * 7500
  });
});
