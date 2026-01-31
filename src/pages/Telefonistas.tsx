import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Headphones, Search } from 'lucide-react';
import { Telefonista } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function Telefonistas() {
  const { telefonistas, viajes, addTelefonista, updateTelefonista, deleteTelefonista } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTelefonista, setEditingTelefonista] = useState<Telefonista | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    activo: true,
  });

  const filteredTelefonistas = telefonistas.filter(t =>
    t?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getViajesCount = (telefonistaId: number) => {
    return viajes.filter(v => v.telefonistaId === telefonistaId && v.estado === 'completado').length;
  };

  const handleOpenDialog = (telefonista?: Telefonista) => {
    if (telefonista) {
      setEditingTelefonista(telefonista);
      setFormData({
        nombre: telefonista.nombre,
        activo: telefonista.activo,
      });
    } else {
      setEditingTelefonista(null);
      setFormData({
        nombre: '',
        activo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nombre) return;

    if (editingTelefonista) {
      updateTelefonista(editingTelefonista.id, formData);
    } else {
      addTelefonista(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Telefonistas</h1>
          <p className="text-muted-foreground">Gestión del equipo de atención</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Telefonista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTelefonista ? 'Editar Telefonista' : 'Nuevo Telefonista'}</DialogTitle>
              <DialogDescription>
                {editingTelefonista ? 'Modifica los datos del telefonista' : 'Agrega un nuevo telefonista al sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del telefonista"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activo">Estado Activo</Label>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingTelefonista ? 'Guardar Cambios' : 'Agregar Telefonista'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar telefonistas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTelefonistas.map((telefonista, index) => (
          <div key={telefonista.id || index} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  telefonista.activo ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Headphones className={`w-5 h-5 ${telefonista.activo ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{telefonista.nombre}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getViajesCount(telefonista.id)} viajes registrados
                  </p>
                </div>
              </div>
              <Badge variant={telefonista.activo ? 'default' : 'secondary'}>
                {telefonista.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleOpenDialog(telefonista)}
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
                    <AlertDialogTitle>¿Eliminar telefonista?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará a {telefonista.nombre} del sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTelefonista(telefonista.id)}
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

      {filteredTelefonistas.length === 0 && (
        <div className="text-center py-12">
          <Headphones className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No hay telefonistas</h3>
          <p className="text-muted-foreground">Agrega un nuevo telefonista para comenzar</p>
        </div>
      )}
    </div>
  );
}
