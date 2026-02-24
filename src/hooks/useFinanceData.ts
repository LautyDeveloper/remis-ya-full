
import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { sheetsApi } from '@/services/sheetsApi';
import { Viaje } from '@/types';
import {
  calculateTotalRevenue,
  calculateDailyComissions,
  groupByChofer,
  groupByDay
} from '@/utils/financeCalculations';
import { isWithinInterval, parseISO, startOfDay, endOfDay, subDays, format } from 'date-fns';

const DRIVER_CONFIG = {
  SANTIAGO_ID: 1,      // Owner - no commission
  GONZALO_ID: 2,       // Flat $7,500/day
  MAXIMILIANO_ID: 3,   // Partner - no commission
};

export function useFinanceData() {
  const { choferes } = useData();
  const [allViajes, setAllViajes] = useState<Viaje[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [includeSantiagoInProfit, setIncludeSantiagoInProfit] = useState(false);

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

  const commissions = useMemo(() => {
    const commissionsByDriver: Record<number, {
      choferNombre: string;
      totalEarnings: number;
      commission: number;
      trips: number;
      showInTable: boolean;
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
            showInTable: true,
          };
        }

        commissionsByDriver[viaje.choferId].totalEarnings += viaje.monto;
        commissionsByDriver[viaje.choferId].trips += 1;
      });

    // Calculate commissions based on driver rules using the utility function
    Object.keys(commissionsByDriver).forEach(choferIdStr => {
      const choferId = Number(choferIdStr);
      const driverData = commissionsByDriver[choferId];

      // Use the centralized utility for commission calculation
      driverData.commission = calculateDailyComissions(filteredViajes, choferId);

      // Set visibility in table
      if (choferId === DRIVER_CONFIG.SANTIAGO_ID || choferId === DRIVER_CONFIG.MAXIMILIANO_ID) {
        driverData.showInTable = false;
      }
    });

    return commissionsByDriver;
  }, [filteredViajes]);

  const metrics = useMemo(() => {
    const completed = filteredViajes.filter(v => v.estado === 'completado');
    const totalFacturado = calculateTotalRevenue(filteredViajes);

    // Calculate total agency profit from commissions
    let gananciaAgencia = Object.values(commissions).reduce((sum, c) => sum + c.commission, 0);

    // Santiago's earnings logic
    const santiagoData = commissions[DRIVER_CONFIG.SANTIAGO_ID];
    const santiagoEarnings = santiagoData?.totalEarnings || 0;

    if (includeSantiagoInProfit) {
      gananciaAgencia += santiagoEarnings;
    }

    const totalViajes = completed.length;
    const comisionPromedio = totalViajes > 0 ? gananciaAgencia / totalViajes : 0;

    return {
      totalFacturado,
      gananciaAgencia,
      totalViajes,
      comisionPromedio,
      santiagoEarnings
    };
  }, [filteredViajes, commissions, includeSantiagoInProfit]);

  const choferPerformance = useMemo(() => {
    return groupByChofer(filteredViajes, choferes);
  }, [filteredViajes, choferes]);

  const evolutionData = useMemo(() => {
    return groupByDay(filteredViajes);
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
    includeSantiagoInProfit,
    setIncludeSantiagoInProfit,
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
