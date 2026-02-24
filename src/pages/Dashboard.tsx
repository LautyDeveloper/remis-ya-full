import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { QueueDisplay } from '@/components/shared/QueueDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SEO } from '@/components/shared/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Car,
  MapPin,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, parseISO, isToday, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { viajes, choferes, reservas, telefonistas, completarViaje, cancelarViaje } = useData();

  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', viajeId: 0 });

  // Filter trips "en curso"
  const viajesEnCurso = viajes.filter(v => v.estado === 'en_curso');

  // Handle complete/cancel actions
  const handleConfirmAction = async () => {
    if (confirmDialog.action === 'completar') {
      await completarViaje(confirmDialog.viajeId);
    } else if (confirmDialog.action === 'cancelar') {
      await cancelarViaje(confirmDialog.viajeId);
    }
    setConfirmDialog({ open: false, action: '', viajeId: 0 });
  };

  const stats = useMemo(() => {
    const completedViajes = viajes.filter(v => v.estado === 'completado');

    // Total recaudado por período (Unused for now but available if needed)

    // Viajes por chofer
    const viajesPorChofer = choferes.map(c => ({
      nombre: c.nombre,
      viajes: completedViajes.filter(v => v.choferId === c.id).length,
      monto: completedViajes.filter(v => v.choferId === c.id).reduce((acc, v) => acc + v.monto, 0),
    })).sort((a, b) => b.viajes - a.viajes);

    // Viajes por telefonista
    const viajesPorTelefonista = telefonistas.map(t => ({
      nombre: t.nombre,
      viajes: completedViajes.filter(v => v.telefonistaId === t.id).length,
    })).sort((a, b) => b.viajes - a.viajes);

    // Método de pago distribution
    const metodoPago = [
      { name: 'Efectivo', value: completedViajes.filter(v => v.metodoPago === 'Efectivo').length, color: '#ef4444' },
      { name: 'Transferencia', value: completedViajes.filter(v => v.metodoPago === 'Transferencia').length, color: '#22c55e' },
      { name: 'Tarjeta', value: completedViajes.filter(v => v.metodoPago === 'Tarjeta').length, color: '#3b82f6' },
    ].filter(m => m.value > 0);

    // Viajes por día (últimos 7 días)
    const viajesPorDia = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(startOfDay(new Date()), 6 - i);
      const dayViajes = completedViajes.filter(v =>
        format(parseISO(v.fechaHora), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        dia: format(date, 'EEE', { locale: es }),
        viajes: dayViajes.length,
        monto: dayViajes.reduce((acc, v) => acc + v.monto, 0),
      };
    });

    // Próximas reservas del día
    const reservasHoy = reservas
      .filter(r => r.estado === 'programada' && isToday(parseISO(r.fechaHora)))
      .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime());

    return {
      viajesPorChofer,
      viajesPorTelefonista,
      metodoPago,
      viajesPorDia,
      reservasHoy,
    };
  }, [viajes, choferes, reservas, telefonistas]);

  return (
    <div className="space-y-6 page-transition">
      <SEO
        title="Dashboard"
        description="Panel de control principal"
        noindex={true}
      />
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de operaciones en tiempo real</p>
      </div>

      {/* Empty State */}
      {viajesEnCurso.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border glass-card shadow-sm">
          <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium">No hay viajes activos</h3>
          <p className="text-muted-foreground">
            Los viajes en curso aparecerán aquí
          </p>
        </div>
      )}

      {/* Viajes en curso */}
      {viajesEnCurso.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-status-busy" aria-hidden="true" />
            En Curso ({viajesEnCurso.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viajesEnCurso.map((viaje, index) => (
              <div key={viaje.id || index} className="bg-card rounded-xl border border-status-busy/30 p-4 glass-card shadow-sm card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{viaje.pasajeroNombre}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Car className="w-3 h-3" aria-hidden="true" />
                      {viaje.choferNombre}
                    </p>
                  </div>
                  <StatusBadge status={viaje.estado} />
                </div>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="truncate">{viaje.origen}</span>
                  <span>→</span>
                  <span className="truncate">{viaje.destino}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">{formatCurrency(viaje.monto)}</span>
                  <Badge variant="secondary">{viaje.metodoPago}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setConfirmDialog({ open: true, action: 'completar', viajeId: viaje.id })}
                  >
                    <CheckCircle className="w-4 h-4" aria-hidden="true" />
                    Completar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDialog({ open: true, action: 'cancelar', viajeId: viaje.id })}
                    aria-label="Cancelar viaje"
                  >
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border p-4 glass-card shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" aria-hidden="true" />
              Cola de Choferes
            </h2>
            <QueueDisplay />
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Viajes por día */}
          <div className="bg-card rounded-xl border p-4 glass-card shadow-sm">
            <h2 className="font-semibold mb-4">Viajes - Últimos 7 días</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.viajesPorDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'monto' ? formatCurrency(value) : value,
                      name === 'monto' ? 'Recaudado' : 'Viajes'
                    ]}
                  />
                  <Bar dataKey="viajes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Métodos de pago */}
            <div className="bg-card rounded-xl border p-4 glass-card shadow-sm">
              <h2 className="font-semibold mb-4">Métodos de Pago</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.metodoPago}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.metodoPago.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranking choferes */}
            <div className="bg-card rounded-xl border p-4 glass-card shadow-sm">
              <h2 className="font-semibold mb-4">Ranking Choferes</h2>
              <div className="space-y-3">
                {stats.viajesPorChofer.slice(0, 5).map((chofer, index) => (
                  <div key={chofer.nombre} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                          'bg-muted text-muted-foreground'
                      }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{chofer.nombre}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(chofer.monto)}</p>
                    </div>
                    <span className="text-sm font-semibold">{chofer.viajes} viajes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Próximas reservas */}
      {stats.reservasHoy.length > 0 && (
        <div className="bg-card rounded-xl border p-4 glass-card shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
            Reservas de Hoy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.reservasHoy.map(reserva => (
              <div key={reserva.id} className="p-4 bg-accent rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{reserva.pasajeroNombre}</span>
                  <StatusBadge status={reserva.estado} />
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {format(parseISO(reserva.fechaHora), 'HH:mm', { locale: es })}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span className="truncate">{reserva.origen}</span>
                  <span>→</span>
                  <span className="truncate">{reserva.destino}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'completar' ? '¿Completar viaje?' : '¿Cancelar viaje?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'completar'
                ? 'El viaje será marcado como completado.'
                : 'El viaje será cancelado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
