import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, MapPin, Search, Car, Calendar, Play, Trash2, Pencil } from 'lucide-react';
import { MetodoPago, EstadoReserva, Reserva } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/shared/SEO';

const metodoPagoOptions: MetodoPago[] = ['Efectivo', 'Transferencia', 'Tarjeta'];

export default function Reservas() {
  const { 
    reservas, choferes, pasajeros, activeTelefonista,
    addReserva, updateReserva, deleteReserva, convertirReservaAViaje
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoReserva | 'todos'>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'convertir' | 'eliminar'; reservaId: number | null }>({
    open: false,
    action: 'convertir',
    reservaId: null,
  });
  
  const [formData, setFormData] = useState({
    fechaHora: '',
    origen: '',
    destino: '',
    pasajeroId: null as number | null,
    pasajeroNombre: '',
    choferId: null as number | null,
    montoEstimado: '',
    metodoPago: 'Efectivo' as MetodoPago,
    notas: '',
  });

  const filteredReservas = useMemo(() => {
    return reservas
      .filter(r => {
        const matchSearch = 
          r?.pasajeroNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r?.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r?.destino?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchEstado = filterEstado === 'todos' || r?.estado === filterEstado;
        
        return matchSearch && matchEstado;
      })
      .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime());
  }, [reservas, searchTerm, filterEstado]);

  const reservasProgramadas = filteredReservas.filter(r => r.estado === 'programada');
  const reservasHoy = reservasProgramadas.filter(r => isToday(parseISO(r.fechaHora)));
  const reservasManana = reservasProgramadas.filter(r => isTomorrow(parseISO(r.fechaHora)));

  const handleOpenDialog = (reserva?: Reserva) => {
    if (reserva) {
      setEditingReserva(reserva);
      setFormData({
        fechaHora: reserva.fechaHora.slice(0, 16),
        origen: reserva.origen,
        destino: reserva.destino,
        pasajeroId: reserva.pasajeroId,
        pasajeroNombre: reserva.pasajeroNombre,
        choferId: reserva.choferId,
        montoEstimado: reserva.montoEstimado.toString(),
        metodoPago: reserva.metodoPago,
        notas: reserva.notas,
      });
    } else {
      setEditingReserva(null);
      setFormData({
        fechaHora: '',
        origen: '',
        destino: '',
        pasajeroId: null,
        pasajeroNombre: '',
        choferId: null,
        montoEstimado: '',
        metodoPago: 'Efectivo',
        notas: '',
      });
    }
    setIsDialogOpen(true);
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

  const handleSubmit = () => {
    if (!formData.fechaHora || !formData.origen || !formData.destino) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const chofer = formData.choferId ? choferes.find(c => c.id === formData.choferId) : null;

    const reservaData = {
      fechaHora: new Date(formData.fechaHora).toISOString(),
      origen: formData.origen,
      destino: formData.destino,
      pasajeroId: formData.pasajeroId,
      pasajeroNombre: formData.pasajeroNombre || 'Pasajero Ocasional',
      choferId: formData.choferId,
      choferNombre: chofer?.nombre || 'Por asignar',
      montoEstimado: parseFloat(formData.montoEstimado) || 0,
      metodoPago: formData.metodoPago,
      estado: 'programada' as EstadoReserva,
      notas: formData.notas,
    };

    if (editingReserva) {
      updateReserva(editingReserva.id, reservaData);
      toast({ title: "Reserva actualizada" });
    } else {
      addReserva(reservaData);
      toast({ title: "Reserva creada" });
    }

    setIsDialogOpen(false);
  };

  const handleConfirmAction = () => {
    if (confirmDialog.reservaId) {
      if (confirmDialog.action === 'convertir') {
        if (!activeTelefonista) {
          toast({
            title: "Error",
            description: "Debes seleccionar un telefonista activo",
            variant: "destructive",
          });
          return;
        }
        convertirReservaAViaje(confirmDialog.reservaId, activeTelefonista.id);
        toast({ title: "Reserva convertida a viaje activo" });
      } else {
        deleteReserva(confirmDialog.reservaId);
        toast({ title: "Reserva eliminada" });
      }
    }
    setConfirmDialog({ open: false, action: 'convertir', reservaId: null });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getDateLabel = (fechaHora: string) => {
    const date = parseISO(fechaHora);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'dd/MM', { locale: es });
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Reservas"
        description="Gestión de viajes programados"
        noindex={true}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">Gestión de viajes programados</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
              <DialogDescription>
                {editingReserva ? 'Modifica los datos de la reserva' : 'Programa un nuevo viaje'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fechaHora">Fecha y Hora *</Label>
                <Input
                  id="fechaHora"
                  type="datetime-local"
                  value={formData.fechaHora}
                  onChange={(e) => setFormData({ ...formData, fechaHora: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Pasajero</Label>
                <Select 
                  value={formData.pasajeroId?.toString() || 'nuevo'}
                  onValueChange={handlePasajeroSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar pasajero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">+ Pasajero Nuevo</SelectItem>
                    {pasajeros.map((p, index) => (
                      <SelectItem key={p.id || index} value={p.id.toString()}>
                        {p.nombre} - {p.direccionPrincipal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.pasajeroId === null && (
                <div className="space-y-2">
                  <Label htmlFor="pasajeroNombre">Nombre del Pasajero</Label>
                  <Input
                    id="pasajeroNombre"
                    value={formData.pasajeroNombre}
                    onChange={(e) => setFormData({ ...formData, pasajeroNombre: e.target.value })}
                    placeholder="Nombre del pasajero"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origen">Origen *</Label>
                  <Input
                    id="origen"
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    placeholder="Dirección de origen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destino">Destino *</Label>
                  <Input
                    id="destino"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    placeholder="Dirección de destino"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chofer Preferido (opcional)</Label>
                <Select
                  value={formData.choferId?.toString() || 'auto'}
                  onValueChange={(value) => setFormData({ ...formData, choferId: value === 'auto' ? null : parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Por orden de cola" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Por orden de cola</SelectItem>
                    {choferes.map((c, index) => (
                      <SelectItem key={c.id || index} value={c.id.toString()}>
                        {c.nombre} ({c.auto})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montoEstimado">Monto Estimado</Label>
                  <Input
                    id="montoEstimado"
                    type="number"
                    value={formData.montoEstimado}
                    onChange={(e) => setFormData({ ...formData, montoEstimado: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select
                    value={formData.metodoPago}
                    onValueChange={(value: MetodoPago) => setFormData({ ...formData, metodoPago: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metodoPagoOptions.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingReserva ? 'Guardar Cambios' : 'Crear Reserva'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl border p-4 card-hover shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reservasHoy.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Reservas hoy</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl border p-4 card-hover shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-pending/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-status-pending" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reservasManana.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Reservas mañana</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl border p-4 card-hover shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reservasProgramadas.length}</p>
              <p className="text-sm text-muted-foreground font-medium">Total programadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar reservas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoReserva | 'todos')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="programada">Programada</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reservas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReservas.map((reserva, index) => {
          const isPastReserva = isPast(parseISO(reserva.fechaHora)) && reserva?.estado === 'programada';
          return (
            <div 
              key={reserva.id || index}
              className={cn(
                "glass-card glass-card-hover rounded-xl border p-4 card-hover shadow-sm",
                isPastReserva ? "border-destructive/50 ring-1 ring-destructive/20" : ""
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold">{reserva.pasajeroNombre}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <Badge variant={isToday(parseISO(reserva.fechaHora)) ? 'default' : 'secondary'}>
                      {getDateLabel(reserva.fechaHora)}
                    </Badge>
                    <span>{format(parseISO(reserva.fechaHora), 'HH:mm', { locale: es })}</span>
                  </div>
                </div>
                <StatusBadge status={reserva.estado} />
              </div>

              <div className="flex items-center gap-2 text-sm mb-3">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="truncate">{reserva.origen}</span>
                <span>→</span>
                <span className="truncate">{reserva.destino}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Car className="w-4 h-4" />
                <span>{reserva.choferNombre}</span>
                {reserva.montoEstimado > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatCurrency(reserva.montoEstimado)}</span>
                  </>
                )}
              </div>

              {reserva.notas && (
                <p className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded mb-3 truncate">
                  {reserva.notas}
                </p>
              )}

              {reserva.estado === 'programada' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setConfirmDialog({ open: true, action: 'convertir', reservaId: reserva.id })}
                  >
                    <Play className="w-4 h-4" />
                    Iniciar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(reserva)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDialog({ open: true, action: 'eliminar', reservaId: reserva.id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredReservas.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium">No hay reservas</h2>
          <p className="text-muted-foreground">No se encontraron reservas con los filtros seleccionados</p>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'convertir' ? '¿Iniciar viaje?' : '¿Eliminar reserva?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'convertir' 
                ? 'La reserva se convertirá en un viaje activo y se asignará al chofer correspondiente.'
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog.action === 'eliminar' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'convertir' ? 'Iniciar Viaje' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
