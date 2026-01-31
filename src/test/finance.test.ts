
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
});
