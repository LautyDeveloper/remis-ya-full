import { useData } from '@/context/DataContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Headphones } from 'lucide-react';

export function TelefonistaSelector() {
  const { telefonistas, activeTelefonista, setActiveTelefonista } = useData();
  const activeTelefonistas = telefonistas.filter(t => t.activo);

  const handleChange = (value: string) => {
    const telefonista = telefonistas.find(t => t.id === parseInt(value));
    setActiveTelefonista(telefonista || null);
  };

  return (
    <div className="flex items-center gap-2">
      <Headphones className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground hidden sm:inline">Telefonista:</span>
      <Select
        value={activeTelefonista?.id.toString() || ''}
        onValueChange={handleChange}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Seleccionar" />
        </SelectTrigger>
        <SelectContent>
          {activeTelefonistas.map((t) => (
            <SelectItem key={t.id} value={t.id.toString()}>
              {t.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
