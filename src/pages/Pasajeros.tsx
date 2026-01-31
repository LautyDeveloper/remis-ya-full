import { useState } from 'react';
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
import { Plus, Pencil, Trash2, User, Phone, MapPin, Search, X } from 'lucide-react';
import { Pasajero, MetodoPago, DireccionFavorita } from '@/types';
import { Badge } from '@/components/ui/badge';

const metodoPagoOptions: MetodoPago[] = ['Efectivo', 'Transferencia', 'Tarjeta'];

export default function Pasajeros() {
  const { pasajeros, addPasajero, updatePasajero, deletePasajero } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPasajero, setEditingPasajero] = useState<Pasajero | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccionPrincipal: '',
    telefono: '',
    metodoPagoPreferido: 'Efectivo' as MetodoPago,
    direccionesFavoritas: [] as DireccionFavorita[],
    notas: '',
  });

  const [newDireccion, setNewDireccion] = useState({ etiqueta: '', direccion: '' });

  const filteredPasajeros = pasajeros.filter(p =>
    p?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.direccionPrincipal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p?.telefono?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (pasajero?: Pasajero) => {
    if (pasajero) {
      setEditingPasajero(pasajero);
      setFormData({
        nombre: pasajero.nombre,
        direccionPrincipal: pasajero.direccionPrincipal,
        telefono: pasajero.telefono,
        metodoPagoPreferido: pasajero.metodoPagoPreferido,
        direccionesFavoritas: [...pasajero.direccionesFavoritas],
        notas: pasajero.notas,
      });
    } else {
      setEditingPasajero(null);
      setFormData({
        nombre: '',
        direccionPrincipal: '',
        telefono: '',
        metodoPagoPreferido: 'Efectivo',
        direccionesFavoritas: [],
        notas: '',
      });
    }
    setNewDireccion({ etiqueta: '', direccion: '' });
    setIsDialogOpen(true);
  };

  const handleAddDireccion = () => {
    if (newDireccion.etiqueta && newDireccion.direccion) {
      setFormData({
        ...formData,
        direccionesFavoritas: [...formData.direccionesFavoritas, { ...newDireccion }],
      });
      setNewDireccion({ etiqueta: '', direccion: '' });
    }
  };

  const handleRemoveDireccion = (index: number) => {
    setFormData({
      ...formData,
      direccionesFavoritas: formData.direccionesFavoritas.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.nombre || !formData.direccionPrincipal) return;

    if (editingPasajero) {
      updatePasajero(editingPasajero.id, formData);
    } else {
      addPasajero(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pasajeros</h1>
          <p className="text-muted-foreground">Gestión de pasajeros recurrentes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Pasajero
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPasajero ? 'Editar Pasajero' : 'Nuevo Pasajero'}</DialogTitle>
              <DialogDescription>
                {editingPasajero ? 'Modifica los datos del pasajero' : 'Agrega un nuevo pasajero al sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del pasajero"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccionPrincipal">Dirección Principal *</Label>
                <Input
                  id="direccionPrincipal"
                  value={formData.direccionPrincipal}
                  onChange={(e) => setFormData({ ...formData, direccionPrincipal: e.target.value })}
                  placeholder="Dirección principal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Teléfono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de Pago</Label>
                  <Select
                    value={formData.metodoPagoPreferido}
                    onValueChange={(value: MetodoPago) => setFormData({ ...formData, metodoPagoPreferido: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {metodoPagoOptions.map((opt, index) => (
                        <SelectItem key={opt || index} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Direcciones Favoritas */}
              <div className="space-y-2">
                <Label>Direcciones Favoritas</Label>
                {formData.direccionesFavoritas.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {formData.direccionesFavoritas.map((dir, index) => (
                      <div key={`${dir.etiqueta}-${index}`} className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                        <Badge variant="secondary">{dir.etiqueta}</Badge>
                        <span className="flex-1 text-sm truncate">{dir.direccion}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveDireccion(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Etiqueta (ej: Casa)"
                    value={newDireccion.etiqueta}
                    onChange={(e) => setNewDireccion({ ...newDireccion, etiqueta: e.target.value })}
                    className="w-32"
                  />
                  <Input
                    placeholder="Dirección"
                    value={newDireccion.direccion}
                    onChange={(e) => setNewDireccion({ ...newDireccion, direccion: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddDireccion}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingPasajero ? 'Guardar Cambios' : 'Agregar Pasajero'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pasajeros..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPasajeros.map((pasajero, index) => (
          <div key={pasajero.id || index} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{pasajero.nombre}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {pasajero.metodoPagoPreferido}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{pasajero.direccionPrincipal}</span>
              </div>
              {pasajero.telefono && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{pasajero.telefono}</span>
                </div>
              )}
            </div>

            {pasajero.direccionesFavoritas.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {pasajero.direccionesFavoritas.map((dir, index) => (
                  <Badge key={`${dir.etiqueta}-${index}`} variant="outline" className="text-xs">
                    {dir.etiqueta}
                  </Badge>
                ))}
              </div>
            )}

            {pasajero.notas && (
              <p className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded mb-4 truncate">
                {pasajero.notas}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleOpenDialog(pasajero)}
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
                    <AlertDialogTitle>¿Eliminar pasajero?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará a {pasajero.nombre} del sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deletePasajero(pasajero.id)}
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

      {filteredPasajeros.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay pasajeros</h3>
          <p className="text-muted-foreground">Agrega un nuevo pasajero para comenzar</p>
        </div>
      )}
    </div>
  );
}
