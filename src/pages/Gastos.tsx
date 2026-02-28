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
import { Plus, Pencil, Trash2, Receipt, Search } from 'lucide-react';
import { CategoriaGasto, Gasto } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const categoriaOptions: CategoriaGasto[] = [
  'Sueldo Telefonista',
  'Agua',
  'Teléfono/Internet',
  'Repuestos/Arreglos',
  'Combustible',
  'Impuestos',
  'Alquiler',
  'Otros',
];

export default function Gastos() {
  const { gastos, addGasto, updateGasto, deleteGasto, activeTelefonista } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  const [formData, setFormData] = useState({
    categoria: 'Otros' as CategoriaGasto,
    monto: '',
    descripcion: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredGastos = gastos
    .filter(g =>
      g.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => parseISO(b.fecha).getTime() - parseISO(a.fecha).getTime());

  const handleSubmit = () => {
    if (!formData.monto) return;

    if (!activeTelefonista) {
      toast({
        title: "Acceso Restringido",
        description: "Solo los telefonistas pueden registrar gastos operativos.",
        variant: "destructive",
      });
      return;
    }

    const gastoData = {
      categoria: formData.categoria,
      monto: parseFloat(formData.monto),
      descripcion: formData.descripcion,
      fecha: new Date(formData.fecha).toISOString(),
      telefonistaId: activeTelefonista.id,
      telefonistaNombre: activeTelefonista.nombre,
    };

    if (editingGasto) {
      updateGasto(editingGasto.id, gastoData);
    } else {
      addGasto(gastoData);
    }

    setFormData({
      categoria: 'Otros',
      monto: '',
      descripcion: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingGasto(null);
    setIsDialogOpen(false);
  };

  const totalGastos = filteredGastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">Gestión de egresos de la agencia</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
              <DialogDescription>
                Registra un nuevo egreso en el sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value: CategoriaGasto) =>
                    setFormData({ ...formData, categoria: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriaOptions.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles del gasto..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingGasto ? 'Guardar Cambios' : 'Registrar Gasto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Gastos Card */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Gastos (período filtrado)</p>
            <p className="text-3xl font-bold text-destructive">{formatCurrency(totalGastos)}</p>
          </div>
          <Receipt className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar gastos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">Fecha</th>
                <th className="text-left p-4 font-medium">Categoría</th>
                <th className="text-left p-4 font-medium">Descripción</th>
                <th className="text-left p-4 font-medium">Monto</th>
                <th className="text-left p-4 font-medium">Registrado por</th>
                <th className="text-left p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGastos.map(gasto => (
                <tr key={gasto.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 text-sm">
                    {format(parseISO(gasto.fecha), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-muted rounded text-sm">
                      {gasto.categoria}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{gasto.descripcion || '-'}</td>
                  <td className="p-4 font-semibold text-destructive">
                    {formatCurrency(gasto.monto)}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {gasto.telefonistaNombre}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingGasto(gasto);
                          setFormData({
                            categoria: gasto.categoria,
                            monto: gasto.monto.toString(),
                            descripcion: gasto.descripcion,
                            fecha: format(parseISO(gasto.fecha), 'yyyy-MM-dd'),
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteGasto(gasto.id)}
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
        {filteredGastos.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay gastos registrados</h3>
          </div>
        )}
      </div>
    </div>
  );
}
