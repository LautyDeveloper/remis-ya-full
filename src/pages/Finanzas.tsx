
import { useState } from 'react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { MetricCard } from '@/components/shared/MetricCard';
import { ChoferTable } from '@/components/finanzas/ChoferTable';
import { FinanceFilters } from '@/components/finanzas/FinanceFilters';
import { IngresosChart } from '@/components/finanzas/IngresosChart';
import { TopChoferesChart } from '@/components/finanzas/TopChoferesChart';
import { ComisionesChart } from '@/components/finanzas/ComisionesChart';
import { ViajesPorChoferChart } from '@/components/finanzas/ViajesPorChoferChart';
import { DollarSign, TrendingUp, TrendingDown, MapPin, Percent, Info, Receipt } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';
import { useData } from '@/context/DataContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { parseISO } from 'date-fns';

export default function Finanzas() {
  const { gastos } = useData();
  const {
    isLoading,
    metrics,
    choferPerformance,
    commissions,
    evolutionData,
    topChoferes,
    comisionesDistribution,
    includeSantiagoInProfit,
    setIncludeSantiagoInProfit,
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

      <div className="bg-card p-4 rounded-xl border space-y-4">
        <FinanceFilters
          dateRange={filters.dateRange}
          setDateRange={filters.setDateRange}
          selectedChoferId={filters.selectedChoferId}
          setSelectedChoferId={filters.setSelectedChoferId}
          onReset={filters.resetFilters}
        />

        <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="include-santiago"
                checked={includeSantiagoInProfit}
                onCheckedChange={setIncludeSantiagoInProfit}
              />
              <Label htmlFor="include-santiago" className="cursor-pointer font-medium">
                Incluir viajes del dueño en ganancia
              </Label>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Información de comisiones">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-sm">
                    <p><strong>Santiago (Dueño):</strong> Sin comisión</p>
                    <p><strong>Maximiliano (Socio):</strong> Sin comisión</p>
                    <p><strong>Gonzalo:</strong> $7,500 fijos/día</p>
                    <p><strong>Otros choferes:</strong> 20% de comisión</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {includeSantiagoInProfit && (
            <p className="text-sm text-primary font-medium animate-in fade-in slide-in-from-left-2">
              +{formatCurrency(metrics.santiagoEarnings)} del dueño
            </p>
          )}
        </div>
      </div>

      {/* Real Balance Calculation */}
      {(() => {
        const totalGastos = gastos
          .filter(g => {
            const gastoDate = parseISO(g.fecha);
            return gastoDate >= filters.dateRange.from && gastoDate <= filters.dateRange.to;
          })
          .reduce((sum, g) => sum + g.monto, 0);

        const netProfit = metrics.gananciaAgencia - totalGastos;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard
                title="Total Facturado"
                value={formatCurrency(metrics.totalFacturado)}
                icon={<DollarSign className="w-4 h-4" />}
              />
              <MetricCard
                title="Ingresos Agencia"
                value={formatCurrency(metrics.gananciaAgencia)}
                subtitle={
                  includeSantiagoInProfit
                    ? 'Incluye viajes del dueño'
                    : 'Solo comisiones de choferes'
                }
                icon={<TrendingUp className="w-4 h-4" />}
              />
              <MetricCard
                title="Gastos Totales"
                value={formatCurrency(totalGastos)}
                icon={<Receipt className="w-4 h-4" />}
                className="text-destructive"
              />
              <MetricCard
                title="Balance Real"
                value={formatCurrency(netProfit)}
                icon={netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                className={netProfit >= 0 ? "text-primary" : "text-destructive"}
              />
              <MetricCard
                title="Viajes"
                value={`${metrics.totalViajes}`}
                icon={<MapPin className="w-4 h-4" />}
              />
              <MetricCard
                title="Promedio/Viaje"
                value={formatCurrency(metrics.comisionPromedio)}
                icon={<Percent className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Commissions Breakdown */}
              <div className="bg-card rounded-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">Comisiones de Choferes</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" aria-label="Información de estructura de comisiones">
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1 text-sm">
                            <p><strong>Gonzalo:</strong> $7,500 fijos/día</p>
                            <p><strong>Otros choferes:</strong> 20% de recaudación</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Object.values(commissions).filter(c => c.showInTable).length} choferes
                  </p>
                </div>
                <div className="space-y-4">
                  {Object.entries(commissions)
                    .filter(([_, data]) => data.showInTable)
                    .map(([choferId, data]) => {
                      const id = Number(choferId);
                      const isGonzalo = id === 2;
                      const commissionRate = isGonzalo ? 'Fijo: $7,500/día' : '20%';

                      return (
                        <div key={choferId} className="flex items-center justify-between py-2 border-b last:border-0">
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
                  {Object.values(commissions).filter(c => c.showInTable).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No hay datos en este período</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    * No se muestran choferes sin comisión (dueño y socios)
                  </p>
                </div>
              </div>

              {/* Expenses Breakdown */}
              <div className="bg-card rounded-xl border p-6">
                <h3 className="text-xl font-bold mb-6">Gastos por Categoría</h3>
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
                    <div key={categoria} className="flex items-center justify-between py-2 border-b last:border-0">
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
              </div>
            </div>
          </div>
        );
      })()}

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
