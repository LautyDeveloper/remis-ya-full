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
import { Plus, MapPin, Search, Car, User, DollarSign, CheckCircle, XCircle, Clock, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Pencil, Trash2 } from 'lucide-react';
import { MetodoPago, EstadoViaje, Viaje } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { SEO } from '@/components/shared/SEO';

const metodoPagoOptions: MetodoPago[] = ['Efectivo', 'Transferencia', 'Tarjeta'];

export default function Viajes() {
  const { 
    viajes, choferes, pasajeros, telefonistas, activeTelefonista,
    addViaje, updateViaje, deleteViaje, completarViaje, cancelarViaje, getNextChoferInQueue
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoViaje | 'todos'>('todos');
  const [filterChofer, setFilterChofer] = useState<string>('todos');

  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterTelefonista, setFilterTelefonista] = useState<string>('todos');
  const [filterMetodoPago, setFilterMetodoPago] = useState<string>('todos');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterMontoMin, setFilterMontoMin] = useState('');
  const [filterMontoMax, setFilterMontoMax] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Viaje | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingViaje, setEditingViaje] = useState<Viaje | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: 'completar' | 'cancelar'; viajeId: number | null }>({
    open: false,
    action: 'completar',
    viajeId: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; viajeId: number | null }>({
    open: false,
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

  const handleSort = (key: keyof Viaje) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearAllFilters = () => {
    setFilterEstado('todos');
    setFilterChofer('todos');
    setFilterTelefonista('todos');
    setFilterMetodoPago('todos');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterMontoMin('');
    setFilterMontoMax('');
    setSearchTerm('');
  };

  const activeFiltersCount = useMemo(() => [
    filterEstado !== 'todos',
    filterChofer !== 'todos',
    filterTelefonista !== 'todos',
    filterMetodoPago !== 'todos',
    filterFechaDesde,
    filterFechaHasta,
    filterMontoMin,
    filterMontoMax,
  ].filter(Boolean).length, [
    filterEstado, filterChofer, filterTelefonista, filterMetodoPago,
    filterFechaDesde, filterFechaHasta, filterMontoMin, filterMontoMax
  ]);

  const filteredViajes = useMemo(() => {
    return viajes.filter(v => {
      const matchSearch =
        v?.pasajeroNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v?.choferNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v?.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v?.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v?.notas?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado = filterEstado === 'todos' || v?.estado === filterEstado;
      const matchChofer = filterChofer === 'todos' || v.choferId.toString() === filterChofer;
      const matchTelefonista = filterTelefonista === 'todos' || v.telefonistaId.toString() === filterTelefonista;
      const matchMetodoPago = filterMetodoPago === 'todos' || v.metodoPago === filterMetodoPago;

      const viajeDate = parseISO(v.fechaHora);
      const matchFechaDesde = !filterFechaDesde || viajeDate >= parseISO(filterFechaDesde);
      const matchFechaHasta = !filterFechaHasta || viajeDate <= parseISO(filterFechaHasta + 'T23:59:59');

      const matchMontoMin = !filterMontoMin || v.monto >= Number(filterMontoMin);
      const matchMontoMax = !filterMontoMax || v.monto <= Number(filterMontoMax);

      return matchSearch && matchEstado && matchChofer && matchTelefonista &&
             matchMetodoPago && matchFechaDesde && matchFechaHasta &&
             matchMontoMin && matchMontoMax;
    });
  }, [viajes, searchTerm, filterEstado, filterChofer, filterTelefonista, filterMetodoPago,
      filterFechaDesde, filterFechaHasta, filterMontoMin, filterMontoMax]);

  const sortedViajes = useMemo(() => {
    if (!sortConfig.key) {
      return [...filteredViajes].sort((a, b) => parseISO(b.fechaHora).getTime() - parseISO(a.fechaHora).getTime());
    }

    return [...filteredViajes].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (sortConfig.key === 'monto' || sortConfig.key === 'id') {
        return sortConfig.direction === 'asc'
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }

      if (sortConfig.key === 'fechaHora') {
        return sortConfig.direction === 'asc'
          ? parseISO(String(aVal)).getTime() - parseISO(String(bVal)).getTime()
          : parseISO(String(bVal)).getTime() - parseISO(String(aVal)).getTime();
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredViajes, sortConfig]);

  const paginatedViajes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedViajes.slice(startIndex, endIndex);
  }, [sortedViajes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedViajes.length / itemsPerPage);

  const viajesEnCurso = viajes.filter(v => v.estado === 'en_curso');

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

    if (!activeTelefonista && !editingViaje) {
      toast({
        title: "Error",
        description: "Debes seleccionar un telefonista activo",
        variant: "destructive",
      });
      return;
    }

    const chofer = choferes.find(c => c.id === formData.choferId);
    if (!chofer) return;

    if (editingViaje) {
      updateViaje(editingViaje.id, {
        ...formData,
        choferNombre: chofer.nombre,
        monto: parseFloat(formData.monto),
      });
      toast({ title: "Viaje actualizado" });
      setEditingViaje(null);
    } else {
      addViaje({
        origen: formData.origen,
        destino: formData.destino,
        pasajeroId: formData.pasajeroId,
        pasajeroNombre: formData.pasajeroNombre || 'Pasajero Ocasional',
        choferId: formData.choferId,
        choferNombre: chofer.nombre,
        telefonistaId: activeTelefonista!.id,
        telefonistaNombre: activeTelefonista!.nombre,
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
    }

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

  const choferesDisponibles = choferes.filter(c => c.estado === 'disponible');

  // Table header component
  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof Viaje }) => (
    <th
      className="text-left p-4 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'asc' ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )
        ) : (
          <ArrowUpDown className="w-4 h-4 opacity-40" />
        )}
      </div>
    </th>
  );

  // Pagination component
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Mostrando {sortedViajes.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedViajes.length)} de {sortedViajes.length} viajes
        </p>

        <Select
          value={itemsPerPage.toString()}
          onValueChange={(val) => {
            setItemsPerPage(Number(val));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="20">20 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>

        <div className="flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(pageNum)}
                className="w-9"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SEO
        title="Viajes"
        description="Gestión de viajes activos e histórico"
        noindex={true}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Viajes</h1>
          <p className="text-muted-foreground">Gestión de viajes activos e histórico</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingViaje(null);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nuevo Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingViaje ? 'Editar Viaje' : 'Nuevo Viaje'}</DialogTitle>
              <DialogDescription>
                {editingViaje ? 'Modifica los datos del viaje' : 'Registra un nuevo viaje en el sistema'}
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
              <Button variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setEditingViaje(null);
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingViaje ? 'Guardar Cambios' : 'Crear Viaje'}
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

      {/* Advanced Filters Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={filterEstado} onValueChange={(value) => setFilterEstado(value as EstadoViaje | 'todos')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="en_curso">En Curso</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chofer</Label>
                <Select value={filterChofer} onValueChange={setFilterChofer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {choferes.map((c, index) => (
                      <SelectItem key={c.id || index} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Telefonista</Label>
                <Select value={filterTelefonista} onValueChange={setFilterTelefonista}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {telefonistas.map((t, index) => (
                      <SelectItem key={t.id || index} value={t.id.toString()}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={filterMetodoPago} onValueChange={setFilterMetodoPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {metodoPagoOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={filterFechaDesde}
                  onChange={(e) => setFilterFechaDesde(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={filterFechaHasta}
                  onChange={(e) => setFilterFechaHasta(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Monto Mínimo</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filterMontoMin}
                  onChange={(e) => setFilterMontoMin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Monto Máximo</Label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filterMontoMax}
                  onChange={(e) => setFilterMontoMax(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Buscar por pasajero, chofer, ruta o notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label="Buscar viajes"
          />
        </div>
      </div>

      {/* Viajes List */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortableHeader label="ID" sortKey="id" />
                <SortableHeader label="Pasajero" sortKey="pasajeroNombre" />
                <SortableHeader label="Chofer" sortKey="choferNombre" />
                <SortableHeader label="Ruta" sortKey="origen" />
                <SortableHeader label="Monto" sortKey="monto" />
                <SortableHeader label="Fecha" sortKey="fechaHora" />
                <SortableHeader label="Telefonista" sortKey="telefonistaNombre" />
                <SortableHeader label="Estado" sortKey="estado" />
                <th className="text-left p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedViajes.map((viaje, index) => (
                <tr key={viaje.id || index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-sm text-muted-foreground">#{viaje.id}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{viaje.pasajeroNombre}</span>
                      </div>
                      {viaje.esReserva && (
                        <Badge variant="outline" className="w-fit text-[10px] py-0 h-4 border-blue-200 text-blue-600 bg-blue-50">
                          📅 Reserva
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      {viaje.choferNombre}
                    </div>
                  </td>
                  <td className="p-4 min-w-[200px]">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{viaje.origen}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <span className="truncate">{viaje.destino}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{formatCurrency(viaje.monto)}</span>
                    </div>
                    <Badge variant="secondary" className="mt-1">{viaje.metodoPago}</Badge>
                  </td>
                  <td className="p-4 text-sm">
                    <div>{format(parseISO(viaje.fechaHora), 'dd/MM/yyyy', { locale: es })}</div>
                    <div className="text-muted-foreground">{format(parseISO(viaje.fechaHora), 'HH:mm', { locale: es })}</div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{viaje.telefonistaNombre}</td>
                  <td className="p-4">
                    <StatusBadge status={viaje.estado} />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingViaje(viaje);
                          setFormData({
                            origen: viaje.origen,
                            destino: viaje.destino,
                            pasajeroId: viaje.pasajeroId,
                            pasajeroNombre: viaje.pasajeroNombre,
                            choferId: viaje.choferId,
                            monto: viaje.monto.toString(),
                            metodoPago: viaje.metodoPago,
                            notas: viaje.notas || '',
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, viajeId: viaje.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
      <PaginationControls />

      {/* Confirm Dialog (Completar/Cancelar) */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El viaje será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog.viajeId) {
                  deleteViaje(deleteDialog.viajeId);
                  toast({ title: "Viaje eliminado" });
                }
                setDeleteDialog({ open: false, viajeId: null });
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
