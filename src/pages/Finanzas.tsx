
import { useFinanceData } from '@/hooks/useFinanceData';
import { MetricCard } from '@/components/shared/MetricCard';
import { ChoferTable } from '@/components/finanzas/ChoferTable';
import { FinanceFilters } from '@/components/finanzas/FinanceFilters';
import { IngresosChart } from '@/components/finanzas/IngresosChart';
import { TopChoferesChart } from '@/components/finanzas/TopChoferesChart';
import { ComisionesChart } from '@/components/finanzas/ComisionesChart';
import { ViajesPorChoferChart } from '@/components/finanzas/ViajesPorChoferChart';
import { DollarSign, TrendingUp, MapPin, Percent } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';

export default function Finanzas() {
  const {
    isLoading,
    metrics,
    choferPerformance,
    evolutionData,
    topChoferes,
    comisionesDistribution,
    filters
  } = useFinanceData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner className="w-8 h-8" />
        <p className="text-muted-foreground animate-pulse">Cargando datos financieros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <SEO
        title="Finanzas"
        description="Análisis financiero y de rendimiento"
        noindex={true}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Finanzas</h1>
        <p className="text-muted-foreground">Analizá el rendimiento económico y de los choferes.</p>
      </div>

      <div className="bg-card p-4 rounded-xl border">
        <FinanceFilters
          dateRange={filters.dateRange}
          setDateRange={filters.setDateRange}
          selectedChoferId={filters.selectedChoferId}
          setSelectedChoferId={filters.setSelectedChoferId}
          onReset={filters.resetFilters}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Facturado"
          value={formatCurrency(metrics.totalFacturado)}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <MetricCard
          title="Ganancia Agencia"
          value={formatCurrency(metrics.gananciaAgencia)}
          subtitle="20% de comisión diaria"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          title="Viajes Completados"
          value={`${metrics.totalViajes} viajes`}
          icon={<MapPin className="w-4 h-4" />}
        />
        <MetricCard
          title="Comisión Promedio"
          value={formatCurrency(metrics.comisionPromedio)}
          subtitle="Por viaje completado"
          icon={<Percent className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <IngresosChart data={evolutionData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopChoferesChart data={topChoferes} />
        <ComisionesChart data={comisionesDistribution} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ViajesPorChoferChart data={choferPerformance} />
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-xl font-bold mb-6">Rendimiento Detallado por Chofer</h2>
        <ChoferTable data={choferPerformance} />
      </div>
    </div>
  );
}
