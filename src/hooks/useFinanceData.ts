
import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { sheetsApi } from '@/services/sheetsApi';
import { Viaje } from '@/types';
import {
  calculateTotalRevenue,
  calculateAgencyProfit,
  groupByChofer,
  groupByDay
} from '@/utils/financeCalculations';
import { isWithinInterval, parseISO, startOfDay, endOfDay, subDays, format } from 'date-fns';

export function useFinanceData() {
  const { choferes } = useData();
  const [allViajes, setAllViajes] = useState<Viaje[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedChoferId, setSelectedChoferId] = useState<string>('all');

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const data = await sheetsApi.getAll('Viajes') as Partial<Viaje>[];

      // Basic processing similar to DataContext
      const processed = data.map((v) => ({
        ...v,
        id: Number(v.id),
        monto: Number(v.monto || 0),
        choferId: Number(v.choferId)
      })).filter((v) => (v.id ?? 0) > 0) as Viaje[];

      setAllViajes(processed);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredViajes = useMemo(() => {
    return allViajes.filter(v => {
      const date = parseISO(v.fechaHora);
      const inRange = isWithinInterval(date, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });

      const matchesChofer = selectedChoferId === 'all' || v.choferId === Number(selectedChoferId);

      return inRange && matchesChofer;
    });
  }, [allViajes, dateRange, selectedChoferId]);

  const metrics = useMemo(() => {
    const completed = filteredViajes.filter(v => v.estado === 'completado');
    const totalFacturado = calculateTotalRevenue(filteredViajes);
    const gananciaAgencia = calculateAgencyProfit(filteredViajes, choferes);
    const totalViajes = completed.length;
    const comisionPromedio = totalViajes > 0 ? gananciaAgencia / totalViajes : 0;

    return {
      totalFacturado,
      gananciaAgencia,
      totalViajes,
      comisionPromedio
    };
  }, [filteredViajes, choferes]);

  const choferPerformance = useMemo(() => {
    return groupByChofer(filteredViajes, choferes);
  }, [filteredViajes, choferes]);

  const evolutionData = useMemo(() => {
    return groupByDay(filteredViajes);
  }, [filteredViajes]);

  const commissions = useMemo(() => {
    const commissionsByDriver: Record<number, {
      choferNombre: string;
      totalEarnings: number;
      commission: number;
      trips: number;
    }> = {};

    // Group trips by driver
    filteredViajes
      .filter(v => v.estado === 'completado')
      .forEach(viaje => {
        if (!commissionsByDriver[viaje.choferId]) {
          commissionsByDriver[viaje.choferId] = {
            choferNombre: viaje.choferNombre,
            totalEarnings: 0,
            commission: 0,
            trips: 0,
          };
        }

        commissionsByDriver[viaje.choferId].totalEarnings += viaje.monto;
        commissionsByDriver[viaje.choferId].trips += 1;
      });

    // Calculate commissions based on driver
    Object.keys(commissionsByDriver).forEach(choferId => {
      const driverId = Number(choferId);
      const driverData = commissionsByDriver[driverId];

      if (driverId === 2) {
        // Gonzalo: Flat $7,500 per day
        // Only charge for days he actually worked (had trips)
        const workedDays = new Set(
          filteredViajes
            .filter(v => v.choferId === 2 && v.estado === 'completado')
            .map(v => format(parseISO(v.fechaHora), 'yyyy-MM-dd'))
        ).size;

        driverData.commission = workedDays * 7500;
      } else {
        // All other drivers: 20% commission
        driverData.commission = driverData.totalEarnings * 0.20;
      }
    });

    return commissionsByDriver;
  }, [filteredViajes]);

  const topChoferes = useMemo(() => {
    return [...choferPerformance]
      .sort((a, b) => b.totalFacturado - a.totalFacturado)
      .slice(0, 5);
  }, [choferPerformance]);

  const comisionesDistribution = useMemo(() => {
    const sorted = [...choferPerformance].sort((a, b) => b.comisionTotal - a.comisionTotal);
    const top = sorted.slice(0, 7);
    const others = sorted.slice(7).reduce((sum, c) => sum + c.comisionTotal, 0);

    const data = top.map(c => ({ name: c.nombre, value: c.comisionTotal }));
    if (others > 0) {
      data.push({ name: 'Otros', value: others });
    }
    return data;
  }, [choferPerformance]);

  const resetFilters = () => {
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date()
    });
    setSelectedChoferId('all');
  };

  return {
    isLoading,
    error,
    metrics,
    choferPerformance,
    commissions,
    evolutionData,
    topChoferes,
    comisionesDistribution,
    filters: {
      dateRange,
      setDateRange,
      selectedChoferId,
      setSelectedChoferId,
      resetFilters
    },
    refresh: fetchAllData
  };
}
