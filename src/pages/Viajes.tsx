import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, MapPin, Search, Car, User, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { MetodoPago, EstadoViaje } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const metodoPagoOptions: MetodoPago[] = ['Efectivo', 'Transferencia', 'Tarjeta'];

export default function Viajes() {
  const { 
    viajes, choferes, pasajeros, activeTelefonista, isLoading,
    addViaje, completarViaje, cancelarViaje, getNextChoferInQueue,
    loadMoreViajes, hasMoreViajes
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoViaje | 'todos'>('todos');
  const [filterChofer, setFilterChofer] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'completar' | 'cancelar'; viajeId: number | null }>({
    open: false,
    action: 'completar',
    viajeId: null,
  });
  
  const suggestedChofer = getNextChoferInQueue();
  
  const [formData, setFormData] = useState({
    origen: '',
    destino: '',
    pasajeroId: null as number | null,
    pasajeroNombre: '',
    choferId: suggestedChofer?.id || 0,
    monto: '',
    metodoPago: 'Efectivo' as MetodoPago,
    notas: '',
  });

  const filteredViajes = useMemo(() => {
    return viajes
      .filter(v => {
        const matchSearch = 
          v?.pasajeroNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v?.choferNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v?.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v?.destino?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchEstado = filterEstado === 'todos' || v?.estado === filterEstado;
        const matchChofer = filterChofer === 'todos' || v.choferId.toString() === filterChofer;
        
        return matchSearch && matchEstado && matchChofer;
      })
      .sort((a, b) => parseISO(b.fechaHora).getTime() - parseISO(a.fechaHora).getTime());
  }, [viajes, searchTerm, filterEstado, filterChofer]);

  const viajesEnCurso = viajes.filter(v => v.estado === 'en_curso');
  const viajesCompletados = viajes.filter(v => v.estado === 'completado');

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

    addViaje({
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

    setFormData({
      origen: '',
      destino: '',
      pasajeroId: null,
      pasajeroNombre: '',
      choferId: getNextChoferInQueue()?.id || 0,
      monto: '',
      metodoPago: 'Efectivo',
      notas: '',
    });
    setIsDialogOpen(false);
  };

  const handleConfirmAction = () => {
    if (confirmDialog.viajeId) {
      if (confirmDialog.action === 'completar') {
        completarViaje(confirmDialog.viajeId);
        toast({ title: "Viaje completado" });
      } else {
        cancelarViaje(confirmDialog.viajeId);
        toast({ title: "Viaje cancelado" });
      }
    }
    setConfirmDialog({ open: false, action: 'completar', viajeId: null });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const choferesDisponibles = choferes.filter(c => c.estado === 'disponible');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Viajes</h1>
          <p className="text-muted-foreground">Gestión de viajes activos e histórico</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo Viaje</DialogTitle>
              <DialogDescription>
                Registra un nuevo viaje en el sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Suggested Driver Alert */}
              {suggestedChofer && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Próximo en cola: {suggestedChofer.nombre} ({suggestedChofer.auto} - {suggestedChofer.patente})
                  </p>
                </div>
              )}

              {/* Pasajero Selection */}
              <div className="space-y-2">
                <Label>Pasajero</Label>
                <Select onValueChange={handlePasajeroSelect}>
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
                <Label>Chofer *</Label>
                <Select
                  value={formData.choferId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, choferId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar chofer" />
                  </SelectTrigger>
                  <SelectContent>
                    {choferesDisponibles.map((c, index) => (
                      <SelectItem key={c.id || index} value={c.id.toString()}>
                        #{c.posicionCola} - {c.nombre} ({c.auto})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto *</Label>
                  <Input
                    id="monto"
                    type="number"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
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
                Crear Viaje
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Viajes en curso */}
      {viajesEnCurso.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-status-busy" />
            En Curso ({viajesEnCurso.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viajesEnCurso.map((viaje, index) => (
              <div key={viaje.id || index} className="bg-card rounded-xl border border-status-busy/30 p-4">
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
                  <MapPin className="w-4 h-4 text-primary" />
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
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar viajes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoViaje | 'todos')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="en_curso">En Curso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterChofer} onValueChange={setFilterChofer}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Chofer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {choferes.map((c, index) => (
              <SelectItem key={c.id || index} value={c.id.toString()}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Viajes List */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Pasajero</th>
                <th className="text-left p-4 font-medium">Ruta</th>
                <th className="text-left p-4 font-medium">Chofer</th>
                <th className="text-left p-4 font-medium">Monto</th>
                <th className="text-left p-4 font-medium">Fecha</th>
                <th className="text-left p-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredViajes.map((viaje, index) => (
                <tr key={viaje.id || index} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{viaje.pasajeroNombre}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate max-w-[100px]">{viaje.origen}</span>
                      <span>→</span>
                      <span className="truncate max-w-[100px]">{viaje.destino}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      {viaje.choferNombre}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {formatCurrency(viaje.monto)}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(parseISO(viaje.fechaHora), 'dd/MM HH:mm', { locale: es })}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={viaje.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredViajes.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay viajes</h3>
            <p className="text-muted-foreground">No se encontraron viajes con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center gap-4 mt-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {viajes.length} viajes {hasMoreViajes && '(hay más disponibles)'}
        </p>

        {hasMoreViajes && (
          <Button
            onClick={loadMoreViajes}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Cargando...' : 'Cargar más viajes'}
          </Button>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'completar' ? '¿Completar viaje?' : '¿Cancelar viaje?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'completar' 
                ? 'El chofer volverá a estar disponible y pasará al final de la cola.'
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog.action === 'cancelar' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'completar' ? 'Completar' : 'Cancelar Viaje'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
