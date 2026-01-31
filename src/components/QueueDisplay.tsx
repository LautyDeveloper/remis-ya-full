import { useData } from '@/context/DataContext';
import { Car, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

export function QueueDisplay() {
  const { choferes } = useData();
  
  const sortedChoferes = [...choferes]
    .sort((a, b) => a.posicionCola - b.posicionCola);

  return (
    <div className="space-y-2">
      {sortedChoferes.map((chofer, index) => (
        <div
          key={chofer.id}
          className={cn(
            'queue-item',
            index === 0 && chofer.estado === 'disponible' && 'border-primary bg-primary/5'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            chofer.estado === 'disponible' 
              ? 'bg-status-available text-white' 
              : chofer.estado === 'en_viaje'
              ? 'bg-status-busy text-white'
              : 'bg-muted text-muted-foreground'
          )}>
            {chofer.posicionCola}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium truncate">{chofer.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="w-3 h-3" />
              <span>{chofer.auto}</span>
              <span>•</span>
              <span>{chofer.patente}</span>
            </div>
          </div>
          <StatusBadge status={chofer.estado} />
        </div>
      ))}
    </div>
  );
}
