import { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function ReservasAlert() {
  const { reservas } = useData();
  const [upcomingReservas, setUpcomingReservas] = useState<typeof reservas>([]);

  useEffect(() => {
    const checkReservas = () => {
      const now = new Date();
      const upcoming = reservas.filter(r => {
        if (r.estado !== 'programada') return false;
        const reservaTime = parseISO(r.fechaHora);
        const diffMinutes = differenceInMinutes(reservaTime, now);
        return diffMinutes > 0 && diffMinutes <= 60;
      });
      setUpcomingReservas(upcoming);
    };

    checkReservas();
    const interval = setInterval(checkReservas, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reservas]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {upcomingReservas.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs animate-pulse-soft"
            >
              {upcomingReservas.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Próximas Reservas</h4>
          {upcomingReservas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay reservas próximas</p>
          ) : (
            <div className="space-y-2">
              {upcomingReservas.map(r => {
                const reservaTime = parseISO(r.fechaHora);
                const diffMinutes = differenceInMinutes(reservaTime, new Date());
                return (
                  <div key={r.id} className="p-3 bg-accent rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{r.pasajeroNombre}</span>
                      <Badge variant={diffMinutes <= 30 ? 'destructive' : 'secondary'}>
                        {diffMinutes} min
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(reservaTime, 'HH:mm', { locale: es })} - {r.origen} → {r.destino}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
