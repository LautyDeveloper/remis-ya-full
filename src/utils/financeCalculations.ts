
import { Viaje, Chofer } from '@/types';
import { format, parseISO } from 'date-fns';

export function calculateTotalRevenue(viajes: Viaje[]) {
  return viajes
    .filter(v => v.estado === 'completado')
    .reduce((sum, v) => sum + (v.monto || 0), 0);
}

export function calculateDailyComissions(viajes: Viaje[], choferId: number) {
  const choferViajes = viajes.filter(v => v.choferId === choferId && v.estado === 'completado');

  // Agrupar viajes por día
  const viajesPorDia: Record<string, number> = {};

  choferViajes.forEach(v => {
    const dateKey = format(parseISO(v.fechaHora), 'yyyy-MM-dd');
    viajesPorDia[dateKey] = (viajesPorDia[dateKey] || 0) + (v.monto || 0);
  });

  if (choferId === 2) {
    // Gonzalo: Fijo $7,500 por día trabajado
    const diasTrabajados = Object.keys(viajesPorDia).length;
    return diasTrabajados * 7500;
  }

  // Otros: 20% por día y sumar
  let totalComision = 0;
  Object.values(viajesPorDia).forEach(montoDia => {
    totalComision += montoDia * 0.2;
  });

  return totalComision;
}

export function calculateAgencyProfit(viajes: Viaje[], choferes: Chofer[]) {
  let totalProfit = 0;
  choferes.forEach(chofer => {
    totalProfit += calculateDailyComissions(viajes, chofer.id);
  });
  return totalProfit;
}

export function groupByChofer(viajes: Viaje[], choferes: Chofer[]) {
  const completedViajes = viajes.filter(v => v.estado === 'completado');

  return choferes.map(chofer => {
    const susViajes = completedViajes.filter(v => v.choferId === chofer.id);
    const totalFacturado = susViajes.reduce((sum, v) => sum + (v.monto || 0), 0);
    const comisionTotal = calculateDailyComissions(viajes, chofer.id);
    const viajesCompletados = susViajes.length;

    return {
      id: chofer.id,
      nombre: chofer.nombre,
      viajesCompletados,
      totalFacturado,
      comisionTotal,
      promedioPorViaje: viajesCompletados > 0 ? totalFacturado / viajesCompletados : 0
    };
  });
}

export function groupByDay(viajes: Viaje[]) {
  const completedViajes = viajes.filter(v => v.estado === 'completado');
  const data: Record<string, number> = {};

  completedViajes.forEach(v => {
    const dateKey = format(parseISO(v.fechaHora), 'yyyy-MM-dd');
    data[dateKey] = (data[dateKey] || 0) + (v.monto || 0);
  });

  return Object.entries(data)
    .map(([fecha, monto]) => ({ fecha, monto }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
