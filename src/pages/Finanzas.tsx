import { useState, useMemo } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { MetricCard } from '@/components/shared/MetricCard';
import { ChoferTable } from '@/components/finanzas/ChoferTable';
import { FinanceFilters } from '@/components/finanzas/FinanceFilters';
import { RevenueChart } from '@/components/finanzas/RevenueChart';
import { TopChoferesChart } from '@/components/finanzas/TopChoferesChart';
import { ComisionesChart } from '@/components/finanzas/ComisionesChart';
import { ViajesPorChoferChart } from '@/components/finanzas/ViajesPorChoferChart';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Info,
  Receipt,
  Wallet,
  AlertTriangle,
  Car,
  Users,
  BarChart3
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';
import { useData } from '@/context/DataContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { parseISO, format, isToday } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Finanzas() {
  const { gastos, viajes } = useData();
  const {
    isLoading,
    metrics,
    choferPerformance,
    commissions,
    evolutionData,
    topChoferes,
    comisionesDistribution,
    filters
  } = useFinanceData();

  const [includeSantiagoInProfit, setIncludeSantiagoInProfit] = useState(false);

  // Calculate local stats for dashboard consistency
  const viajesHoy = useMemo(() => {
    return viajes.filter(v => v.estado === 'completado' && isToday(parseISO(v.fechaHora))).length;
  }, [viajes]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner className="w-8 h-8" />
        <p className="text-muted-foreground animate-pulse">Cargando datos financieros...</p>
      </div>
    );
  }

  const totalGastos = gastos
    .filter(g => {
      const gastoDate = parseISO(g.fecha);
      return gastoDate >= filters.dateRange.from && gastoDate <= filters.dateRange.to;
    })
    .reduce((sum, g) => sum + g.monto, 0);

  // Logic for Santiago toggle if we wanted it to be functional
  // Santiago is ID 1. If includeSantiagoInProfit is true, we add his total facturado to agencyProfit
  const santiagoEarnings = choferPerformance.find(c => c.id === 1)?.totalFacturado || 0;
  const agencyProfit = includeSantiagoInProfit
    ? metrics.gananciaAgencia + santiagoEarnings
    : metrics.gananciaAgencia;

  const netProfit = agencyProfit - totalGastos;
  const ticketPromedio = metrics.totalViajes > 0 ? metrics.totalFacturado / metrics.totalViajes : 0;

  // Adapt evolution data for RevenueChart
  const chartData = evolutionData.map(d => ({
    date: format(parseISO(d.fecha), 'dd/MM'),
    revenue: d.monto
  }));

  return (
    <div className="space-y-6 pb-10 page-transition">
      <SEO
        title="Finanzas"
        description="Análisis financiero y reportes"
        noindex={true}
      />

      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted-foreground">Análisis financiero y reportes</p>
        </div>

        <div className="bg-card p-2 rounded-xl border flex items-center gap-3">
          <FinanceFilters
            dateRange={filters.dateRange}
            setDateRange={filters.setDateRange}
            selectedChoferId={filters.selectedChoferId}
            setSelectedChoferId={filters.setSelectedChoferId}
            onReset={filters.resetFilters}
          />
        </div>
      </div>

      {/* Toggle for Santiago earnings */}
      <Card className="p-4 glass-card">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="santiago-toggle" className="text-base font-semibold">Incluir viajes del dueño en ganancia</Label>
            <p className="text-sm text-muted-foreground">
              Suma el 100% de la recaudación de Santiago (ID 1) a la ganancia de la agencia
            </p>
          </div>
          <Switch
            id="santiago-toggle"
            checked={includeSantiagoInProfit}
            onCheckedChange={setIncludeSantiagoInProfit}
          />
        </div>
      </Card>

      {/* Main Metrics - Better Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Facturado"
          value={formatCurrency(metrics.totalFacturado)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: 12, label: 'vs mes anterior' }}
        />

        <MetricCard
          title="Comisiones Totales"
          value={formatCurrency(metrics.gananciaAgencia)}
          icon={<Percent className="w-6 h-6" />}
          subtitle="De todos los choferes"
        />

        <MetricCard
          title="Ganancia Agencia"
          value={formatCurrency(agencyProfit)}
          icon={<TrendingUp className="w-6 h-6" />}
          subtitle={includeSantiagoInProfit ? 'Incluye viajes del dueño' : 'Solo comisiones'}
        />

        <MetricCard
          title="Balance Real"
          value={formatCurrency(netProfit)}
          icon={netProfit >= 0 ? <Wallet className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          subtitle="Ingresos - Gastos"
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Gastos Totales"
          value={formatCurrency(totalGastos)}
          icon={<Receipt className="w-6 h-6" />}
          className="md:col-span-1"
        />

        <MetricCard
          title="Viajes Realizados"
          value={metrics.totalViajes.toString()}
          icon={<Car className="w-6 h-6" />}
          subtitle={`${viajesHoy} viajes hoy`}
          className="md:col-span-1"
        />

        <MetricCard
          title="Ticket Promedio"
          value={formatCurrency(ticketPromedio)}
          icon={<TrendingUp className="w-6 h-6" />}
          className="md:col-span-1"
        />
      </div>

      {/* Charts Section - Side by Side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Commissions Breakdown */}
        <Card className="p-6 glass-card glass-card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Comisiones por Chofer
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gonzalo: $7,500 fijos por día</p>
                  <p>Otros choferes: 20% de recaudación</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-4">
            {Object.entries(commissions).map(([choferId, data]) => {
              const id = Number(choferId);
              if (id === 1 || id === 3) return null; // Santiago and Maximiliano are special

              const isGonzalo = id === 2;
              const commissionRate = isGonzalo ? 'Fijo: $7,500/día' : '20%';

              return (
                <div key={choferId} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                  <div>
                    <p className="font-medium">{data.choferNombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.trips} viajes • {commissionRate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(data.totalEarnings)}</p>
                    <p className="text-sm text-primary">{formatCurrency(data.commission)}</p>
                  </div>
                </div>
              );
            })}
            {Object.keys(commissions).length === 0 && (
              <p className="text-center text-muted-foreground py-4">No hay datos en este período</p>
            )}
          </div>
        </Card>

        {/* Expenses Breakdown */}
        <Card className="p-6 glass-card glass-card-hover">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Gastos por Categoría
          </h3>
          <div className="space-y-4">
            {Object.entries(
              gastos
                .filter(g => {
                  const gastoDate = parseISO(g.fecha);
                  return gastoDate >= filters.dateRange.from && gastoDate <= filters.dateRange.to;
                })
                .reduce((acc, g) => {
                  acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
                  return acc;
                }, {} as Record<string, number>)
            ).map(([categoria, monto]) => (
              <div key={categoria} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                <p>{categoria}</p>
                <p className="font-semibold text-destructive">{formatCurrency(monto)}</p>
              </div>
            ))}
            {gastos.filter(g => {
              const gastoDate = parseISO(g.fecha);
              return gastoDate >= filters.dateRange.from && gastoDate <= filters.dateRange.to;
            }).length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay gastos en este período</p>
              )}
          </div>
        </Card>
      </div>

      {/* Full Width Charts */}
      <Card className="p-6 glass-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Evolución Diaria
        </h3>
        <RevenueChart data={chartData} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopChoferesChart data={topChoferes} />
        <ComisionesChart data={comisionesDistribution} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ViajesPorChoferChart data={choferPerformance} />
      </div>

      <Card className="p-6 glass-card">
        <h2 className="text-xl font-bold mb-6">Rendimiento Detallado por Chofer</h2>
        <ChoferTable data={choferPerformance} />
      </Card>
    </div>
  );
}
