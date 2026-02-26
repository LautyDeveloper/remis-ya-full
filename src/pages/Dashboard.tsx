import { useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useData } from '@/context/DataContext';
import { QueueDisplay } from '@/components/shared/QueueDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SEO } from '@/components/shared/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Car,
  MapPin,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  School,
  CloudRain,
  Train,
  Zap,
  CheckCircle2,
  User,
  Info,
  Plus,
  TrendingUp,
  History,
  Star
} from 'lucide-react';
import { format, parseISO, isToday, addMinutes, isAfter, isBefore, differenceInHours } from 'date-fns';
import { MetricCard } from "@/components/shared/MetricCard";
import { toast } from "@/hooks/use-toast";
import { MetodoPago } from '@/types';

export default function Dashboard() {
  const {
    viajes,
    choferes,
    pasajeros,
    reservas,
    completarViaje,
    cancelarViaje,
    addViaje,
    getNextChoferInQueue,
    activeTelefonista
  } = useData();

  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', viajeId: 0 });
  const [manualAlerts, setManualAlerts] = useState<{id: number, text: string, icon: string}[]>([]);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [newAlertText, setNewAlertText] = useState('');
  const [newAlertIcon, setNewAlertIcon] = useState('CloudRain');

  const [isViajeDialogOpen, setIsViajeDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    origen: '',
    destino: '',
    pasajeroId: null as number | null,
    pasajeroNombre: '',
    choferId: 0,
    monto: '',
    metodoPago: 'Efectivo' as MetodoPago,
    notas: '',
  });

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

  const handleManualAlert = () => {
    if (!newAlertText.trim()) return;
    setManualAlerts([...manualAlerts, { id: Date.now(), text: newAlertText, icon: newAlertIcon }]);
    setNewAlertText('');
    setIsAlertDialogOpen(false);
  };

  const removeManualAlert = (id: number) => {
    setManualAlerts(manualAlerts.filter(a => a.id !== id));
  };

  const handlePasajeroSelect = (pasajeroId: string) => {
    if (pasajeroId === 'nuevo') {
      setFormData({ ...formData, pasajeroId: null, pasajeroNombre: '', origen: '' });
    } else {
      const pasajero = pasajeros.find(p => p.id === parseInt(pasajeroId));
      if (pasajero) {
        setFormData({
          ...formData,
          pasajeroId: pasajero.id,
          pasajeroNombre: pasajero.nombre,
          origen: pasajero.direccionPrincipal,
          metodoPago: pasajero.metodoPagoPreferido,
        });
      }
    }
  };

  const handleSubmitViaje = async () => {
    if (!formData.origen || !formData.destino || !formData.choferId || !formData.monto) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (!activeTelefonista) {
      toast({
        title: "Error",
        description: "Debes seleccionar un telefonista activo",
        variant: "destructive",
      });
      return;
    }

    const chofer = choferes.find(c => c.id === formData.choferId);
    if (!chofer) return;

    await addViaje({
      origen: formData.origen,
      destino: formData.destino,
      pasajeroId: formData.pasajeroId,
      pasajeroNombre: formData.pasajeroNombre || 'Pasajero Ocasional',
      choferId: formData.choferId,
      choferNombre: chofer.nombre,
      telefonistaId: activeTelefonista.id,
      telefonistaNombre: activeTelefonista.nombre,
      monto: parseFloat(formData.monto),
      metodoPago: formData.metodoPago,
      estado: 'en_curso',
      fechaHora: new Date().toISOString(),
      notas: formData.notas,
    });

    toast({
      title: "Viaje creado",
      description: `Viaje asignado a ${chofer.nombre}`,
    });

    setIsViajeDialogOpen(false);
    setFormData({
      origen: '',
      destino: '',
      pasajeroId: null,
      pasajeroNombre: '',
      choferId: 0,
      monto: '',
      metodoPago: 'Efectivo',
      notas: '',
    });
  };

  const stats = useMemo(() => {
    const now = new Date();

    // Alerts logic
    const reservationsAlerts = reservas.filter(r =>
      r.estado === 'programada' &&
      isAfter(parseISO(r.fechaHora), now) &&
      isBefore(parseISO(r.fechaHora), addMinutes(now, 15))
    );

    const longRunningTrips = viajes.filter(v =>
      v.estado === 'en_curso' &&
      differenceInHours(now, parseISO(v.fechaHora)) >= 2
    ).map(v => ({
      ...v,
      hours: differenceInHours(now, parseISO(v.fechaHora))
    }));

    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeVal = hour * 100 + minute;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

    const schoolAlerts = [];
    if (isWeekday) {
      if (timeVal >= 630 && timeVal <= 800) {
        schoolAlerts.push({ text: "Horario de entrada a clases - Mayor demanda esperada", icon: "School" });
      } else if (timeVal >= 1130 && timeVal <= 1300) {
        schoolAlerts.push({ text: "Salida de clases (mediodía) - Pico de demanda", icon: "School" });
      } else if (timeVal >= 1630 && timeVal <= 1730) {
        schoolAlerts.push({ text: "Salida de clases (tarde) - Pico de demanda", icon: "School" });
      }
    }

    // Quick Stats
    const viajesHoyCount = viajes.filter(v => isToday(parseISO(v.fechaHora))).length;
    const choferesLibresCount = choferes.filter(c => c.estado === 'disponible').length;
    const enCursoCount = viajes.filter(v => v.estado === 'en_curso').length;
    const reservasHoyCount = reservas.filter(r => isToday(parseISO(r.fechaHora))).length;

    // Reciente
    const reciente = viajes
      .filter(v => v.estado === 'completado')
      .sort((a, b) => parseISO(b.fechaHora).getTime() - parseISO(a.fechaHora).getTime())
      .slice(0, 10);

    // Pasajeros Frecuentes
    const passengerCounts: Record<number, number> = {};
    viajes.forEach(v => {
      if (v.pasajeroId) {
        passengerCounts[v.pasajeroId] = (passengerCounts[v.pasajeroId] || 0) + 1;
      }
    });
    const frequentPassengers = Object.entries(passengerCounts)
      .map(([id, count]) => ({
        pasajero: pasajeros.find(p => p.id === parseInt(id)),
        count
      }))
      .filter((p): p is { pasajero: (typeof pasajeros)[0], count: number } => !!p.pasajero)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Destinations/Origins
    const destCounts: Record<string, number> = {};
    const origCounts: Record<string, number> = {};
    const todayCompleted = viajes.filter(v => v.estado === 'completado' && isToday(parseISO(v.fechaHora)));

    todayCompleted.forEach(v => {
      destCounts[v.destino] = (destCounts[v.destino] || 0) + 1;
      origCounts[v.origen] = (origCounts[v.origen] || 0) + 1;
    });

    const topDestinations = Object.entries(destCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topOrigins = Object.entries(origCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const maxDest = topDestinations.length > 0 ? topDestinations[0].count : 1;
    const maxOrig = topOrigins.length > 0 ? topOrigins[0].count : 1;

    return {
      reservationsAlerts,
      longRunningTrips,
      schoolAlerts,
      viajesHoyCount,
      choferesLibresCount,
      enCursoCount,
      reservasHoyCount,
      reciente,
      frequentPassengers,
      topDestinations: topDestinations.map(d => ({ ...d, relative: (d.count / maxDest) * 100 })),
      topOrigins: topOrigins.map(o => ({ ...o, relative: (o.count / maxOrig) * 100 })),
    };
  }, [viajes, choferes, reservas, pasajeros]);

  const getAlertIcon = (iconName: string) => {
    switch (iconName) {
      case 'School': return <School className="h-4 w-4" />;
      case 'CloudRain': return <CloudRain className="h-4 w-4" />;
      case 'Train': return <Train className="h-4 w-4" />;
      case 'Zap': return <Zap className="h-4 w-4" />;
      case 'AlertTriangle': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Dashboard"
        description="Panel de control principal"
        noindex={true}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Operativo</h1>
          <p className="text-muted-foreground">Control de tráfico y despacho</p>
        </div>
        <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <Button variant="outline" className="gap-2" onClick={() => setIsAlertDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Agregar Aviso
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Aviso del Día</DialogTitle>
              <DialogDescription>
                Agrega un aviso contextual para todos los telefonistas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Aviso</Label>
                <Select value={newAlertIcon} onValueChange={setNewAlertIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CloudRain">🌧️ Lluvia</SelectItem>
                    <SelectItem value="Train">🚂 Paro de trenes</SelectItem>
                    <SelectItem value="Zap">📅 Evento especial</SelectItem>
                    <SelectItem value="Info">ℹ️ Información</SelectItem>
                    <SelectItem value="AlertTriangle">⚠️ Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Input
                  value={newAlertText}
                  onChange={(e) => setNewAlertText(e.target.value)}
                  placeholder="Ej: Lluvia intensa - Mayor demora esperada"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleManualAlert}>Agregar Aviso</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alertas y Notificaciones */}
      <div className="space-y-3">
        {stats.reservationsAlerts.map(r => (
          <Alert key={r.id} className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-500">
            <Clock className="h-4 w-4" />
            <AlertTitle>Reserva Próxima ({format(parseISO(r.fechaHora), 'HH:mm')})</AlertTitle>
            <AlertDescription>
              {r.pasajeroNombre}: {r.origen} → {r.destino}
            </AlertDescription>
          </Alert>
        ))}
        {stats.longRunningTrips.map(v => (
          <Alert key={v.id} className="bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Viaje de Larga Duración</AlertTitle>
            <AlertDescription>
              {v.choferNombre} lleva {v.hours} horas en viaje.
            </AlertDescription>
          </Alert>
        ))}
        {stats.schoolAlerts.map((a, i) => (
          <Alert key={`school-${i}`} className="bg-primary/10 border-primary/20 text-primary">
            <School className="h-4 w-4" />
            <AlertTitle>Aviso Escolar</AlertTitle>
            <AlertDescription>{a.text}</AlertDescription>
          </Alert>
        ))}
        {manualAlerts.map(a => (
          <Alert key={a.id} className="bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400">
            {getAlertIcon(a.icon)}
            <AlertTitle className="flex justify-between items-center">
              Aviso
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeManualAlert(a.id)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </AlertTitle>
            <AlertDescription>{a.text}</AlertDescription>
          </Alert>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Viajes Hoy" value={stats.viajesHoyCount} icon={<Car />} />
        <MetricCard title="Choferes Libres" value={stats.choferesLibresCount} icon={<CheckCircle2 />} />
        <MetricCard title="En Curso" value={stats.enCursoCount} icon={<Clock />} />
        <MetricCard title="Reservas Hoy" value={stats.reservasHoyCount} icon={<Calendar />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border p-4 h-full">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Cola de Choferes
            </h2>
            <QueueDisplay />
          </div>
        </div>

        {/* Viajes en curso */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-status-busy" />
            Viajes Activos ({viajesEnCurso.length})
          </h2>
          {viajesEnCurso.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
              <p className="text-muted-foreground">No hay viajes activos en este momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {viajesEnCurso.map((viaje, index) => (
                <div key={viaje.id || index} className="bg-card rounded-xl border border-status-busy/30 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{viaje.pasajeroNombre}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        {viaje.choferNombre}
                      </p>
                    </div>
                    <StatusBadge status={viaje.estado} />
                  </div>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{viaje.origen}</span>
                    <span>→</span>
                    <span className="truncate">{viaje.destino}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setConfirmDialog({ open: true, action: 'completar', viajeId: viaje.id })}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Completar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDialog({ open: true, action: 'cancelar', viajeId: viaje.id })}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Actividad Reciente
        </h2>
        <div className="space-y-4">
          {stats.reciente.map((viaje) => (
            <div key={viaje.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-mono text-muted-foreground w-12">
                  {format(parseISO(viaje.fechaHora), 'HH:mm')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{viaje.pasajeroNombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{viaje.destino}</p>
                </div>
              </div>
              <div className="flex items-center gap-8 flex-1 justify-end">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-medium">{viaje.choferNombre}</p>
                  <p className="text-[10px] text-muted-foreground">Telefonista: {viaje.telefonistaNombre}</p>
                </div>
                <Badge variant="outline" className="font-mono">
                  {formatCurrency(viaje.monto)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pasajeros Frecuentes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Pasajeros Frecuentes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.frequentPassengers.map(({ pasajero, count }) => (
            <button
              key={pasajero.id}
              onClick={() => {
                setFormData({
                  ...formData,
                  pasajeroId: pasajero.id,
                  pasajeroNombre: pasajero.nombre,
                  origen: pasajero.direccionPrincipal,
                  choferId: getNextChoferInQueue()?.id || 0,
                  metodoPago: pasajero.metodoPagoPreferido,
                });
                setIsViajeDialogOpen(true);
              }}
              className="flex flex-col p-4 bg-card border rounded-xl hover:border-primary hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="font-mono">{count} v.</Badge>
              </div>
              <p className="font-semibold text-sm truncate">{pasajero.nombre}</p>
              <p className="text-xs text-muted-foreground truncate">{pasajero.direccionPrincipal}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Top Destinos y Orígenes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-status-busy">
            <TrendingUp className="w-5 h-5" />
            Top Destinos Hoy
          </h2>
          <div className="space-y-4">
            {stats.topDestinations.map((dest, i) => (
              <div key={dest.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{i + 1}. {dest.name}</span>
                  <span className="text-muted-foreground">{dest.count}</span>
                </div>
                <Progress value={dest.relative} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-status-available">
            <TrendingUp className="w-5 h-5" />
            Top Orígenes Hoy
          </h2>
          <div className="space-y-4">
            {stats.topOrigins.map((orig, i) => (
              <div key={orig.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{i + 1}. {orig.name}</span>
                  <span className="text-muted-foreground">{orig.count}</span>
                </div>
                <Progress value={orig.relative} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogo Nuevo Viaje */}
      <Dialog open={isViajeDialogOpen} onOpenChange={setIsViajeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Viaje</DialogTitle>
            <DialogDescription>Asigna un nuevo viaje para el pasajero seleccionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pasajero</Label>
              <Select
                value={formData.pasajeroId?.toString() || "nuevo"}
                onValueChange={handlePasajeroSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar pasajero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">+ Pasajero Nuevo</SelectItem>
                  {pasajeros.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.pasajeroId === null && (
              <div className="space-y-2">
                <Label>Nombre del Pasajero</Label>
                <Input
                  value={formData.pasajeroNombre}
                  onChange={(e) => setFormData({ ...formData, pasajeroNombre: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen</Label>
                <Input
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Destino</Label>
                <Input
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Chofer</Label>
              <Select
                value={formData.choferId.toString()}
                onValueChange={(val) => setFormData({ ...formData, choferId: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar chofer" />
                </SelectTrigger>
                <SelectContent>
                  {choferes.filter(c => c.estado === 'disponible').map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      #{c.posicionCola} - {c.nombre} ({c.auto})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select
                  value={formData.metodoPago}
                  onValueChange={(val: MetodoPago) => setFormData({ ...formData, metodoPago: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitViaje}>Crear Viaje</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de Confirmación */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'completar' ? '¿Completar viaje?' : '¿Cancelar viaje?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'completar'
                ? 'El viaje será marcado como completado y el chofer volverá a estar disponible.'
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
