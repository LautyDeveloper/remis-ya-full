import { useData } from "@/context/DataContext";
import { format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReservaCalendarViewProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function ReservaCalendarView({ onDateSelect, selectedDate }: ReservaCalendarViewProps) {
  const { reservas } = useData();

  const getReservasForDate = (date: Date) => {
    return reservas.filter(r => isSameDay(parseISO(r.fechaHora), date));
  };

  const getDayStatus = (date: Date) => {
    const dayReservas = getReservasForDate(date);
    if (dayReservas.length === 0) return null;

    const hasUnconfirmed = dayReservas.some(r => r.estado === 'pendiente');
    if (hasUnconfirmed) return 'pending';

    return 'confirmed';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-4 md:col-span-1">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          locale={es}
          className="rounded-md border shadow-none"
          modifiers={{
            hasReservas: (date: Date) => getReservasForDate(date).length > 0,
            pending: (date: Date) => getDayStatus(date) === 'pending',
          }}
          modifiersClassNames={{
            hasReservas: "font-bold text-primary",
            pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          }}
        />
      </Card>

      <Card className="p-6 md:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          <Badge variant="secondary">
            {getReservasForDate(selectedDate).length} Reservas
          </Badge>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {getReservasForDate(selectedDate).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay reservas para este día
            </div>
          ) : (
            getReservasForDate(selectedDate)
              .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime())
              .map(reserva => (
                <div
                  key={reserva.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-lg font-bold">{format(parseISO(reserva.fechaHora), "HH:mm")}</p>
                    <Badge variant={reserva.estado === 'pendiente' ? 'outline' : 'default'} className="text-[10px] px-1 h-4">
                      {reserva.estado}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{reserva.pasajeroNombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {reserva.origen} → {reserva.destino}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">{reserva.choferNombre}</p>
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>
    </div>
  );
}
