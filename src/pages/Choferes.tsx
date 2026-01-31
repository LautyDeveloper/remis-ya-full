import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Car, User, Search } from 'lucide-react';
import { Chofer, EstadoChofer } from '@/types';

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
  const { choferes, addChofer, updateChofer, deleteChofer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChofer, setEditingChofer] = useState<Chofer | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    auto: '',
    patente: '',
    estado: 'disponible' as EstadoChofer,
    razonNoDisponible: '',
  });

  const filteredChoferes = choferes.filter(c =>
    c?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c?.auto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c?.patente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedChoferes = [...filteredChoferes].sort((a, b) => a.posicionCola - b.posicionCola);

  const handleOpenDialog = (chofer?: Chofer) => {
    if (chofer) {
      setEditingChofer(chofer);
      setFormData({
        nombre: chofer.nombre,
        auto: chofer.auto,
        patente: chofer.patente,
        estado: chofer.estado,
        razonNoDisponible: chofer.razonNoDisponible || '',
      });
    } else {
      setEditingChofer(null);
      setFormData({
        nombre: '',
        auto: '',
        patente: '',
        estado: 'disponible',
        razonNoDisponible: '',
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
                  <Label htmlFor="auto">Auto</Label>
                  <Input
                    id="auto"
                    value={formData.auto}
                    onChange={(e) => setFormData({ ...formData, auto: e.target.value })}
                    placeholder="Modelo"
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar choferes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedChoferes.map((chofer, index) => (
          <div key={chofer.id || index} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{chofer.nombre}</h3>
                  <p className="text-sm text-muted-foreground">Posición #{chofer.posicionCola}</p>
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

            {chofer.estado === 'no_disponible' && chofer.razonNoDisponible && (
              <p className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded mb-4">
                {chofer.razonNoDisponible}
              </p>
            )}

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

      {sortedChoferes.length === 0 && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay choferes</h3>
          <p className="text-muted-foreground">Agrega un nuevo chofer para comenzar</p>
        </div>
      )}
    </div>
  );
}
