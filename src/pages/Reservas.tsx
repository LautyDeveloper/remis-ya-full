import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Plus,
  Search,
  Calendar as CalendarIcon,
  LayoutList,
  Clock,
  Filter,
  X,
  AlertCircle,
  CalendarDays,
  ChevronDown
} from 'lucide-react';
import { MetodoPago, EstadoReserva, Reserva } from '@/types';
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  addDays,
  isWithinInterval,
  startOfDay,
  endOfDay,
  differenceInMinutes
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { SEO } from '@/components/shared/SEO';
import { ReservaCard } from '@/components/reservas/ReservaCard';
import { ReservaCalendarView } from '@/components/reservas/ReservaCalendarView';
import { ReservaTimelineView } from '@/components/reservas/ReservaTimelineView';
import { cn } from '@/lib/utils';

const metodoPagoOptions: MetodoPago[] = ['Efectivo', 'Transferencia', 'Tarjeta'];

type ViewMode = 'lista' | 'calendario' | 'timeline';
type DateFilter = 'hoy' | 'manana' | 'semana' | 'mes' | 'todas';

export default function Reservas() {
  const { 
    reservas, choferes, pasajeros, activeTelefonista,
    addReserva, updateReserva, deleteReserva, convertirReservaAViaje
  } = useData();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');
  const [dateFilter, setDateFilter] = useState<DateFilter>('hoy');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showArchived, setShowArchived] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters State
  const [filterEstado, setFilterEstado] = useState<EstadoReserva | 'todos'>('todos');
  const [filterChofer, setFilterChofer] = useState<string>('todos');
  const [filterPasajero, setFilterPasajero] = useState<string>('todos');
  const [filterFranja, setFilterFranja] = useState<string>('todos');
  const [filterConfirmacion, setFilterConfirmacion] = useState<string>('todos');

  // Dialogs State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReprogramOpen, setIsReprogramOpen] = useState(false);
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

  const [reprogramData, setReprogramData] = useState({
    fechaHora: '',
    choferId: null as number | null,
  });

  // Memoized Data
  const filteredReservas = useMemo(() => {
    return reservas.filter(r => {
      // Search
      const matchSearch =
        r.pasajeroNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.choferNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notas?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Archived
      if (!showArchived && (r.estado === 'completada' || r.estado === 'cancelada')) return false;

      // Status Filter
      if (filterEstado !== 'todos' && r.estado !== filterEstado) return false;

      // Driver Filter
      if (filterChofer !== 'todos') {
        if (filterChofer === 'sin_asignar' && r.choferId !== null) return false;
        if (filterChofer !== 'sin_asignar' && r.choferId?.toString() !== filterChofer) return false;
      }

      // Passenger Filter
      if (filterPasajero !== 'todos' && r.pasajeroId?.toString() !== filterPasajero) return false;

      // Confirmation Filter
      if (filterConfirmacion !== 'todos') {
        const isConfirmed = r.clienteConfirmado && r.choferAvisado;
        if (filterConfirmacion === 'confirmadas' && !isConfirmed) return false;
        if (filterConfirmacion === 'falta' && isConfirmed) return false;
      }

      // Time Range Filter
      if (filterFranja !== 'todos') {
        const hour = parseISO(r.fechaHora).getHours();
        if (filterFranja === 'madrugada' && (hour < 0 || hour >= 6)) return false;
        if (filterFranja === 'manana' && (hour < 6 || hour >= 12)) return false;
        if (filterFranja === 'tarde' && (hour < 12 || hour >= 18)) return false;
        if (filterFranja === 'noche' && (hour < 18 || hour >= 24)) return false;
      }

      // Date Range Tabs
      const rDate = parseISO(r.fechaHora);
      if (dateFilter === 'hoy' && !isToday(rDate)) return false;
      if (dateFilter === 'manana' && !isTomorrow(rDate)) return false;
      if (dateFilter === 'semana') {
        const start = startOfDay(new Date());
        const end = endOfDay(addDays(new Date(), 7));
        if (!isWithinInterval(rDate, { start, end })) return false;
      }
      if (dateFilter === 'mes') {
        const start = startOfDay(new Date());
        const end = endOfDay(addDays(new Date(), 30));
        if (!isWithinInterval(rDate, { start, end })) return false;
      }

      return true;
    }).sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime());
  }, [reservas, searchTerm, filterEstado, filterChofer, filterPasajero, filterConfirmacion, filterFranja, dateFilter, showArchived]);

  // Priority Alerts Logic
  const alerts = useMemo(() => {
    const now = new Date();
    const urgent: Reserva[] = [];
    const unconfirmed: Reserva[] = [];
    const driverConflict: Reserva[] = [];

    reservas.forEach(r => {
      if (r.estado === 'completada' || r.estado === 'cancelada' || r.estado === 'en_curso') return;

      const rTime = parseISO(r.fechaHora);
      const diff = differenceInMinutes(rTime, now);

      // Within 30 min
      if (diff > -30 && diff <= 30) {
        urgent.push(r);
      }

      // Within 2 hours and pending
      if (diff > 0 && diff <= 120 && r.estado === 'pendiente') {
        unconfirmed.push(r);
      }

      // Driver busy conflict
      if (r.choferId && diff > -15 && diff <= 60) {
        const chofer = choferes.find(c => c.id === r.choferId);
        if (chofer?.estado === 'en_viaje') {
          driverConflict.push(r);
        }
      }
    });

    return { urgent, unconfirmed, driverConflict };
  }, [reservas, choferes]);

  // Handlers
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

  const handleOpenReprogram = (reserva: Reserva) => {
    setEditingReserva(reserva);
    setReprogramData({
      fechaHora: reserva.fechaHora.slice(0, 16),
      choferId: reserva.choferId,
    });
    setIsReprogramOpen(true);
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

  const handleSubmit = async () => {
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
      estado: editingReserva ? editingReserva.estado : 'pendiente' as EstadoReserva,
      notas: formData.notas,
      clienteConfirmado: editingReserva ? editingReserva.clienteConfirmado : false,
      choferAvisado: editingReserva ? editingReserva.choferAvisado : false,
    };

    if (editingReserva) {
      await updateReserva(editingReserva.id, reservaData);
      toast({ title: "Reserva actualizada" });
    } else {
      await addReserva(reservaData);
      toast({ title: "Reserva creada" });
    }

    setIsDialogOpen(false);
  };

  const handleReprogramSubmit = async () => {
    if (!reprogramData.fechaHora || !editingReserva) return;

    const chofer = reprogramData.choferId ? choferes.find(c => c.id === reprogramData.choferId) : null;

    await updateReserva(editingReserva.id, {
      fechaHora: new Date(reprogramData.fechaHora).toISOString(),
      choferId: reprogramData.choferId,
      choferNombre: chofer?.nombre || 'Por asignar',
    });

    toast({ title: "Reserva reprogramada" });
    setIsReprogramOpen(false);
  };

  const handleConfirmAction = async () => {
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
        await convertirReservaAViaje(confirmDialog.reservaId, activeTelefonista.id);
        toast({ title: "Reserva convertida a viaje activo" });
      } else {
        await deleteReserva(confirmDialog.reservaId);
        toast({ title: "Reserva eliminada" });
      }
    }
    setConfirmDialog({ open: false, action: 'convertir', reservaId: null });
  };

  const clearFilters = () => {
    setFilterEstado('todos');
    setFilterChofer('todos');
    setFilterPasajero('todos');
    setFilterFranja('todos');
    setFilterConfirmacion('todos');
    setSearchTerm('');
  };

  const activeFiltersCount = [
    filterEstado !== 'todos',
    filterChofer !== 'todos',
    filterPasajero !== 'todos',
    filterFranja !== 'todos',
    filterConfirmacion !== 'todos',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-20">
      <SEO
        title="Reservas"
        description="Gestión avanzada de viajes programados"
        noindex={true}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="text-muted-foreground">Monitoreo y gestión de viajes programados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(alerts.urgent.length > 0 || alerts.unconfirmed.length > 0 || alerts.driverConflict.length > 0) && (
        <div className="space-y-3">
          {alerts.urgent.map(r => (
            <div key={`urgent-${r.id}`} className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-destructive">🚨 URGENTE: Reserva en {differenceInMinutes(parseISO(r.fechaHora), new Date())} min</p>
                  <p className="text-xs text-destructive/80">{r.pasajeroNombre} - {r.origen} → {r.destino} {!r.clienteConfirmado && '(Falta confirmar cliente)'}</p>
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => setConfirmDialog({ open: true, action: 'convertir', reservaId: r.id })}>Iniciar Ya</Button>
            </div>
          ))}
          {alerts.unconfirmed.map(r => (
            <div key={`unconf-${r.id}`} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-700">⚠️ Falta confirmar: Reserva en {format(parseISO(r.fechaHora), 'HH:mm')}</p>
                  <p className="text-xs text-amber-600/80">{r.pasajeroNombre} - {r.origen}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10" onClick={() => setEditingReserva(r)}>Ver Detalles</Button>
            </div>
          ))}
          {alerts.driverConflict.map(r => (
            <div key={`conflict-${r.id}`} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-700">⚠️ Chofer Ocupado: {r.choferNombre}</p>
                <p className="text-xs text-amber-600/80">Tiene reserva a las {format(parseISO(r.fechaHora), 'HH:mm')} pero está en un viaje ahora.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="outline"
          className={cn("h-auto p-4 flex flex-col items-start gap-1 transition-all hover:border-primary/50", filterEstado === 'pendiente' && "border-primary bg-primary/5")}
          onClick={() => setFilterEstado(filterEstado === 'pendiente' ? 'todos' : 'pendiente')}
        >
          <span className="text-2xl font-bold text-amber-600">{reservas.filter(r => r.estado === 'pendiente').length}</span>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Pendientes</span>
        </Button>
        <Button
          variant="outline"
          className={cn("h-auto p-4 flex flex-col items-start gap-1 transition-all hover:border-primary/50", filterEstado === 'confirmada' && "border-primary bg-primary/5")}
          onClick={() => setFilterEstado(filterEstado === 'confirmada' ? 'todos' : 'confirmada')}
        >
          <span className="text-2xl font-bold text-blue-600">{reservas.filter(r => r.estado === 'confirmada').length}</span>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Confirmadas</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-1"
          disabled
        >
          <span className="text-2xl font-bold text-primary">{alerts.urgent.length + alerts.unconfirmed.length}</span>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Próximas (2h)</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-1"
          disabled
        >
          <span className="text-2xl font-bold">{reservas.filter(r => isToday(parseISO(r.fechaHora))).length}</span>
          <span className="text-xs text-muted-foreground uppercase font-semibold">Total Hoy</span>
        </Button>
      </div>

      {/* Date Range Tabs */}
      <Tabs value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="hoy" className="flex gap-2">Hoy <Badge variant="secondary" className="hidden sm:inline-flex">{reservas.filter(r => isToday(parseISO(r.fechaHora))).length}</Badge></TabsTrigger>
          <TabsTrigger value="manana" className="flex gap-2">Mañana <Badge variant="secondary" className="hidden sm:inline-flex">{reservas.filter(r => isTomorrow(parseISO(r.fechaHora))).length}</Badge></TabsTrigger>
          <TabsTrigger value="semana" className="flex gap-2">Semana <Badge variant="secondary" className="hidden sm:inline-flex">{reservas.filter(r => {
            const date = parseISO(r.fechaHora);
            return isWithinInterval(date, { start: startOfDay(new Date()), end: endOfDay(addDays(new Date(), 7)) });
          }).length}</Badge></TabsTrigger>
          <TabsTrigger value="mes" className="flex gap-2">Próximos 30 <Badge variant="secondary" className="hidden sm:inline-flex">{reservas.filter(r => {
            const date = parseISO(r.fechaHora);
            return isWithinInterval(date, { start: startOfDay(new Date()), end: endOfDay(addDays(new Date(), 30)) });
          }).length}</Badge></TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* View Mode Selector */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'lista' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('lista')}
          >
            <LayoutList className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
          <Button
            variant={viewMode === 'calendario' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('calendario')}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Calendario</span>
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('timeline')}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Línea de Tiempo</span>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Archivadas</span>
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", activeFiltersCount > 0 && "border-primary text-primary")}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="w-4 h-4" />
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            <ChevronDown className={cn("w-4 h-4 transition-transform", isFiltersOpen && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isFiltersOpen && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={filterEstado} onValueChange={(v) => setFilterEstado(v as EstadoReserva | 'todos')}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Chofer</Label>
              <Select value={filterChofer} onValueChange={setFilterChofer}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                  {choferes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pasajero Frecuente</Label>
              <Select value={filterPasajero} onValueChange={setFilterPasajero}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {pasajeros.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Franja Horaria</Label>
              <Select value={filterFranja} onValueChange={setFilterFranja}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="madrugada">Madrugada (00-06)</SelectItem>
                  <SelectItem value="manana">Mañana (06-12)</SelectItem>
                  <SelectItem value="tarde">Tarde (12-18)</SelectItem>
                  <SelectItem value="noche">Noche (18-24)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirmación</Label>
              <Select value={filterConfirmacion} onValueChange={setFilterConfirmacion}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="confirmadas">Ya confirmadas</SelectItem>
                  <SelectItem value="falta">Falta confirmar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-dashed">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, origen, notas..."
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          </div>
        </Card>
      )}

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {viewMode === 'lista' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReservas.map(reserva => (
              <ReservaCard
                key={reserva.id}
                reserva={reserva}
                onEdit={handleOpenDialog}
                onDelete={(id) => setConfirmDialog({ open: true, action: 'eliminar', reservaId: id })}
                onReprogramar={handleOpenReprogram}
                onIniciarViaje={(id) => setConfirmDialog({ open: true, action: 'convertir', reservaId: id })}
              />
            ))}
            {filteredReservas.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-xl border border-dashed">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <div>
                  <h3 className="text-lg font-medium">No se encontraron reservas</h3>
                  <p className="text-sm text-muted-foreground">Prueba ajustando los filtros o el buscador</p>
                </div>
                <Button variant="outline" onClick={clearFilters}>Restablecer filtros</Button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'calendario' && (
          <ReservaCalendarView
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}

        {viewMode === 'timeline' && (
          <ReservaTimelineView
            selectedDate={selectedDate}
          />
        )}
      </div>

      {/* Dialogs */}
      {/* Full Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  {pasajeros.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
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
                  {choferes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
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

      {/* Reprogram Quick Dialog */}
      <Dialog open={isReprogramOpen} onOpenChange={setIsReprogramOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reprogramar Viaje</DialogTitle>
            <DialogDescription>
              Ajusta la fecha, hora o el chofer asignado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nueva Fecha y Hora</Label>
              <Input
                type="datetime-local"
                value={reprogramData.fechaHora}
                onChange={(e) => setReprogramData({ ...reprogramData, fechaHora: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Chofer Asignado</Label>
              <Select
                value={reprogramData.choferId?.toString() || 'auto'}
                onValueChange={(value) => setReprogramData({ ...reprogramData, choferId: value === 'auto' ? null : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Por orden de cola</SelectItem>
                  {choferes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre} ({c.auto})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReprogramOpen(false)}>Cancelar</Button>
            <Button onClick={handleReprogramSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'convertir' ? '¿Iniciar viaje?' : '¿Eliminar reserva?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'convertir' 
                ? 'La reserva se convertirá en un viaje activo y se asignará al chofer correspondiente.'
                : 'Esta acción marcará la reserva como cancelada y la quitará de la vista principal.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmDialog.action === 'eliminar' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'convertir' ? 'Iniciar Viaje' : 'Eliminar / Cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
