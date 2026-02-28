import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Car, User, Search, CheckCircle2, Navigation, XCircle, Users, AlertTriangle, ShieldAlert, Wrench, ChevronDown, History, ChevronRight, Clock } from 'lucide-react';
import { Chofer, EstadoChofer } from '@/types';
import { SEO } from '@/components/shared/SEO';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isToday, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

const estadoOptions: { value: EstadoChofer; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'en_viaje', label: 'En Viaje' },
  { value: 'no_disponible', label: 'No Disponible' },
];

const razonesNoDisponible = [
  'Descanso',
  'Comiendo',
  'Falta',
  'Problemas mecánicos',
  'Asuntos personales',
  'Otro',
];

export default function Choferes() {
  const { choferes, viajes, addChofer, updateChofer, deleteChofer } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showOnlyTodayActive, setShowOnlyTodayActive] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<string>('posicion');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInactiveExpanded, setIsInactiveExpanded] = useState(false);
  const [editingChofer, setEditingChofer] = useState<Chofer | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    auto: '',
    patente: '',
    estado: 'disponible' as EstadoChofer,
    razonNoDisponible: '',
    anoAuto: '',
    kilometraje: 0,
    fechaProximoService: '',
    fechaVTVVencimiento: '',
    fechaSeguroVencimiento: '',
    capacidadPasajeros: 4,
  });

  const uniqueVehicles = useMemo(() => {
    const vehicles = choferes.map(c => c.auto).filter(Boolean);
    return ['todos', ...new Set(vehicles)];
  }, [choferes]);

  const stats = useMemo(() => {
    const counts = {
      disponibles: choferes.filter(c => c.estado === 'disponible').length,
      en_viaje: choferes.filter(c => c.estado === 'en_viaje').length,
      no_disponible: choferes.filter(c => c.estado === 'no_disponible').length,
      activosHoy: choferes.filter(c =>
        viajes.some(v => v.choferId === c.id && v.estado === 'completado' && isToday(parseISO(v.fechaHora)))
      ).length
    };
    return counts;
  }, [choferes, viajes]);

  const filteredChoferes = choferes.filter(c => {
    const matchesSearch =
      c?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c?.auto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c?.patente?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || c.estado === statusFilter;
    const matchesVehicle = vehicleFilter === 'todos' || c.auto === vehicleFilter;
    const matchesToday = !showOnlyTodayActive || viajes.some(v => v.choferId === c.id && v.estado === 'completado' && isToday(parseISO(v.fechaHora)));

    return matchesSearch && matchesStatus && matchesVehicle && matchesToday;
  });

  const activeTodayChoferes = useMemo(() => {
    return choferes.filter(c =>
      viajes.some(v => v.choferId === c.id && v.estado === 'completado' && isToday(parseISO(v.fechaHora)))
    ).map(c => {
      const driverViajes = viajes.filter(v => v.choferId === c.id && v.estado === 'completado' && isToday(parseISO(v.fechaHora)));
      const lastActivity = driverViajes.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())[0];
      return {
        ...c,
        tripsToday: driverViajes.length,
        lastActivityTime: lastActivity?.fechaHora
      };
    }).sort((a, b) => (b.tripsToday || 0) - (a.tripsToday || 0));
  }, [choferes, viajes]);

  const mainGridChoferes = useMemo(() => {
    return filteredChoferes.filter(c => {
      const lastViaje = viajes.filter(v => v.choferId === c.id).sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())[0];
      if (!lastViaje) return true;
      const daysSince = differenceInDays(new Date(), parseISO(lastViaje.fechaHora));
      return daysSince < 7;
    });
  }, [filteredChoferes, viajes]);

  const inactiveChoferes = useMemo(() => {
    return filteredChoferes.filter(c => {
      const lastViaje = viajes.filter(v => v.choferId === c.id).sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())[0];
      if (!lastViaje) return false;
      const daysSince = differenceInDays(new Date(), parseISO(lastViaje.fechaHora));
      return daysSince >= 7;
    });
  }, [filteredChoferes, viajes]);

  const sortedChoferes = useMemo(() => {
    return [...mainGridChoferes].sort((a, b) => {
      if (sortBy === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (sortBy === 'posicion') {
        return a.posicionCola - b.posicionCola;
      }
      if (sortBy === 'viajes_hoy') {
        const aViajes = viajes.filter(v => v.choferId === a.id && v.estado === 'completado' && isToday(parseISO(v.fechaHora))).length;
        const bViajes = viajes.filter(v => v.choferId === b.id && v.estado === 'completado' && isToday(parseISO(v.fechaHora))).length;
        return bViajes - aViajes;
      }
      if (sortBy === 'actividad') {
        const aLastViaje = [...viajes].filter(v => v.choferId === a.id).sort((v1, v2) => new Date(v2.fechaHora).getTime() - new Date(v1.fechaHora).getTime())[0];
        const bLastViaje = [...viajes].filter(v => v.choferId === b.id).sort((v1, v2) => new Date(v2.fechaHora).getTime() - new Date(v1.fechaHora).getTime())[0];
        if (!aLastViaje) return 1;
        if (!bLastViaje) return -1;
        return new Date(bLastViaje.fechaHora).getTime() - new Date(aLastViaje.fechaHora).getTime();
      }
      return 0;
    });
  }, [mainGridChoferes, sortBy, viajes]);

  const handleOpenDialog = (chofer?: Chofer) => {
    if (chofer) {
      setEditingChofer(chofer);
      setFormData({
        nombre: chofer.nombre,
        auto: chofer.auto,
        patente: chofer.patente,
        estado: chofer.estado,
        razonNoDisponible: chofer.razonNoDisponible || '',
        anoAuto: chofer.anoAuto || '',
        kilometraje: chofer.kilometraje || 0,
        fechaProximoService: chofer.fechaProximoService || '',
        fechaVTVVencimiento: chofer.fechaVTVVencimiento || '',
        fechaSeguroVencimiento: chofer.fechaSeguroVencimiento || '',
        capacidadPasajeros: chofer.capacidadPasajeros || 4,
      });
    } else {
      setEditingChofer(null);
      setFormData({
        nombre: '',
        auto: '',
        patente: '',
        estado: 'disponible',
        razonNoDisponible: '',
        anoAuto: '',
        kilometraje: 0,
        fechaProximoService: '',
        fechaVTVVencimiento: '',
        fechaSeguroVencimiento: '',
        capacidadPasajeros: 4,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nombre || !formData.auto || !formData.patente) return;

    if (editingChofer) {
      updateChofer(editingChofer.id, formData);
    } else {
      addChofer(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <SEO
        title="Choferes"
        description="Gestión de choferes y vehículos"
        noindex={true}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Choferes</h1>
          <p className="text-muted-foreground">Gestión de choferes y sus vehículos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Chofer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChofer ? 'Editar Chofer' : 'Nuevo Chofer'}</DialogTitle>
              <DialogDescription>
                {editingChofer ? 'Modifica los datos del chofer' : 'Agrega un nuevo chofer al sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del chofer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auto">Auto (Modelo)</Label>
                  <Input
                    id="auto"
                    value={formData.auto}
                    onChange={(e) => setFormData({ ...formData, auto: e.target.value })}
                    placeholder="Ej: Toyota Corolla"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patente">Patente</Label>
                  <Input
                    id="patente"
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                    placeholder="Patente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="anoAuto">Año</Label>
                  <Input
                    id="anoAuto"
                    value={formData.anoAuto}
                    onChange={(e) => setFormData({ ...formData, anoAuto: e.target.value })}
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kilometraje">Kilometraje</Label>
                  <Input
                    id="kilometraje"
                    type="number"
                    value={formData.kilometraje}
                    onChange={(e) => setFormData({ ...formData, kilometraje: Number(e.target.value) })}
                    placeholder="85000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidadPasajeros">Pasajeros</Label>
                  <Input
                    id="capacidadPasajeros"
                    type="number"
                    value={formData.capacidadPasajeros}
                    onChange={(e) => setFormData({ ...formData, capacidadPasajeros: Number(e.target.value) })}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaProximoService">Próximo Service</Label>
                  <Input
                    id="fechaProximoService"
                    type="date"
                    value={formData.fechaProximoService}
                    onChange={(e) => setFormData({ ...formData, fechaProximoService: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaVTVVencimiento">Vencimiento VTV</Label>
                  <Input
                    id="fechaVTVVencimiento"
                    type="date"
                    value={formData.fechaVTVVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVTVVencimiento: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaSeguroVencimiento">Vencimiento Seguro</Label>
                  <Input
                    id="fechaSeguroVencimiento"
                    type="date"
                    value={formData.fechaSeguroVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaSeguroVencimiento: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: EstadoChofer) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadoOptions.map((opt, index) => (
                      <SelectItem key={opt.value || index} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.estado === 'no_disponible' && (
                <div className="space-y-2">
                  <Label htmlFor="razon">Razón</Label>
                  <Select
                    value={formData.razonNoDisponible}
                    onValueChange={(value) => setFormData({ ...formData, razonNoDisponible: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar razón" />
                    </SelectTrigger>
                    <SelectContent>
                    {razonesNoDisponible.map((razon, index) => (
                      <SelectItem key={razon || index} value={razon}>{razon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingChofer ? 'Guardar Cambios' : 'Agregar Chofer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('disponible')}
          className={`p-4 rounded-xl border transition-all text-left ${statusFilter === 'disponible' ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-accent'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">Disponibles</span>
            <CheckCircle2 className="w-4 h-4 text-status-available" />
          </div>
          <span className="text-2xl font-bold text-status-available">{stats.disponibles}</span>
        </button>
        <button
          onClick={() => setStatusFilter('en_viaje')}
          className={`p-4 rounded-xl border transition-all text-left ${statusFilter === 'en_viaje' ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-accent'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">En Viaje</span>
            <Navigation className="w-4 h-4 text-status-en-viaje" />
          </div>
          <span className="text-2xl font-bold text-status-en-viaje">{stats.en_viaje}</span>
        </button>
        <button
          onClick={() => setStatusFilter('no_disponible')}
          className={`p-4 rounded-xl border transition-all text-left ${statusFilter === 'no_disponible' ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-accent'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">No Disponibles</span>
            <XCircle className="w-4 h-4 text-status-no-disponible" />
          </div>
          <span className="text-2xl font-bold text-status-no-disponible">{stats.no_disponible}</span>
        </button>
        <button
          onClick={() => {
            setStatusFilter('todos');
            setShowOnlyTodayActive(!showOnlyTodayActive);
          }}
          className={`p-4 rounded-xl border transition-all text-left ${showOnlyTodayActive ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-accent'}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">Activos Hoy</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-blue-500">{stats.activosHoy}</span>
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        <Tabs value={statusFilter} onValueChange={(val) => {
          setStatusFilter(val);
          setShowOnlyTodayActive(false);
        }} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="todos">Todos ({choferes.length})</TabsTrigger>
            <TabsTrigger value="disponible">Disponibles ({stats.disponibles})</TabsTrigger>
            <TabsTrigger value="en_viaje">En Viaje ({stats.en_viaje})</TabsTrigger>
            <TabsTrigger value="no_disponible">No Disp. ({stats.no_disponible})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar choferes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Auto" />
            </SelectTrigger>
            <SelectContent>
              {uniqueVehicles.map(v => (
                <SelectItem key={v} value={v}>
                  {v === 'todos' ? 'Todos los autos' : v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="posicion">Posición en Cola</SelectItem>
              <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
              <SelectItem value="actividad">Última Actividad</SelectItem>
              <SelectItem value="viajes_hoy">Viajes Hoy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activos Hoy Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Choferes Activos Hoy
        </h2>
        {activeTodayChoferes.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {activeTodayChoferes.map(chofer => (
              <div key={chofer.id} className="flex-shrink-0 w-64 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">{chofer.nombre}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{chofer.tripsToday} viajes hoy</p>
                  {chofer.lastActivityTime && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Último: {new Date(chofer.lastActivityTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm">Ningún chofer activo hoy</p>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedChoferes.map((chofer, index) => (
          <div key={chofer.id || index} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{chofer.nombre}</h2>
                  <p className="text-sm text-muted-foreground">Posición #{chofer.posicionCola}</p>
                </div>
              </div>
              <StatusBadge status={chofer.estado} />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Car className="w-4 h-4" />
              <span>{chofer.auto}</span>
              <span>•</span>
              <span className="font-mono">{chofer.patente}</span>
            </div>

            <div className="space-y-2 mb-4">
              {/* Activity Info */}
              {(() => {
                const driverViajes = viajes.filter(v => v.choferId === chofer.id).sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
                const lastViaje = driverViajes[0];
                const activeViaje = driverViajes.find(v => v.estado === 'en_curso');

                if (activeViaje) {
                  return (
                    <p className="text-xs text-status-en-viaje flex items-center gap-1 font-medium">
                      <Navigation className="w-3 h-3" />
                      En viaje desde hace {formatDistanceToNow(parseISO(activeViaje.fechaHora), { locale: es })}
                    </p>
                  );
                }

                if (lastViaje) {
                  const daysSince = differenceInDays(new Date(), parseISO(lastViaje.fechaHora));
                  if (isToday(parseISO(lastViaje.fechaHora))) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        Hace {formatDistanceToNow(parseISO(lastViaje.fechaHora), { locale: es })} completó viaje
                      </p>
                    );
                  }
                  if (daysSince < 7) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        Última actividad: {formatDistanceToNow(parseISO(lastViaje.fechaHora), { locale: es, addSuffix: true })}
                      </p>
                    );
                  }
                  return (
                    <p className="text-xs text-destructive font-medium">
                      Inactivo (última vez: {new Date(lastViaje.fechaHora).toLocaleDateString('es-AR')})
                    </p>
                  );
                }

                return <p className="text-xs text-muted-foreground">Sin actividad registrada</p>;
              })()}

              {/* Warning Badges */}
              <div className="flex flex-wrap gap-1">
                {chofer.fechaVTVVencimiento && differenceInDays(parseISO(chofer.fechaVTVVencimiento), new Date()) <= 30 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    VTV PROX.
                  </span>
                )}
                {chofer.fechaSeguroVencimiento && differenceInDays(parseISO(chofer.fechaSeguroVencimiento), new Date()) <= 15 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                    <ShieldAlert className="w-3 h-3" />
                    SEGURO VENC.
                  </span>
                )}
                {chofer.fechaProximoService && new Date(chofer.fechaProximoService) < new Date() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                    <Wrench className="w-3 h-3" />
                    SERVICE PEND.
                  </span>
                )}
              </div>
            </div>

            {chofer.estado === 'no_disponible' && chofer.razonNoDisponible && (
              <p className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded mb-4">
                {chofer.razonNoDisponible}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <StatusBadge status={chofer.estado} className="h-2 w-2 p-0 rounded-full" />
                    Estado
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem onClick={() => updateChofer(chofer.id, { estado: 'disponible' })}>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-status-available" />
                    Marcar Disponible
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateChofer(chofer.id, { estado: 'en_viaje' })}>
                    <Navigation className="w-4 h-4 mr-2 text-status-en-viaje" />
                    Marcar En Viaje
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <XCircle className="w-4 h-4 mr-2 text-status-no-disponible" />
                      Marcar No Disponible
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {razonesNoDisponible.map((razon) => (
                        <DropdownMenuItem
                          key={razon}
                          onClick={() => updateChofer(chofer.id, {
                            estado: 'no_disponible',
                            razonNoDisponible: razon
                          })}
                        >
                          {razon}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleOpenDialog(chofer)}
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => navigate('/finanzas', {
                  state: {
                    selectedChoferId: chofer.id.toString(),
                    dateRangePreset: 'last30days'
                  }
                })}
              >
                <History className="w-4 h-4" />
                Historial
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar chofer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará a {chofer.nombre} del sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteChofer(chofer.id)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      {sortedChoferes.length === 0 && mainGridChoferes.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium">No hay choferes</h2>
          <p className="text-muted-foreground">Agrega un nuevo chofer para comenzar</p>
        </div>
      )}

      {/* Inactive Section */}
      {inactiveChoferes.length > 0 && (
        <div className="mt-8 border-t pt-8">
          <button
            onClick={() => setIsInactiveExpanded(!isInactiveExpanded)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            {isInactiveExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-semibold text-lg">Choferes Inactivos ({inactiveChoferes.length})</span>
          </button>

          {isInactiveExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveChoferes.map((chofer, index) => (
                <div key={chofer.id || index} className="bg-card/50 grayscale-[0.5] opacity-80 rounded-xl border p-4 hover:grayscale-0 hover:opacity-100 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h2 className="font-semibold">{chofer.nombre}</h2>
                        <p className="text-xs text-muted-foreground">Sin actividad hace +7 días</p>
                      </div>
                    </div>
                    <StatusBadge status={chofer.estado} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Car className="w-4 h-4" />
                    <span>{chofer.auto}</span>
                    <span>•</span>
                    <span className="font-mono">{chofer.patente}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleOpenDialog(chofer)}
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => navigate('/finanzas', {
                        state: {
                          selectedChoferId: chofer.id.toString(),
                          dateRangePreset: 'last30days'
                        }
                      })}
                    >
                      <History className="w-4 h-4" />
                      Historial
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
