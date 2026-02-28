import { useData } from "@/context/DataContext";
import { format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { User, MapPin } from "lucide-react";

interface ReservaTimelineViewProps {
  selectedDate: Date;
}

export function ReservaTimelineView({ selectedDate }: ReservaTimelineViewProps) {
  const { reservas } = useData();

  const dayReservas = reservas
    .filter(r => isSameDay(parseISO(r.fechaHora), selectedDate))
    .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime());

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          Línea de Tiempo - {format(selectedDate, "d 'de' MMMM", { locale: es })}
        </h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Confirmada</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Completada</span>
          </div>
        </div>
      </div>

      <div className="relative pl-16 space-y-0 border-l border-muted">
        {hours.map((hour) => {
          const hourReservas = dayReservas.filter(r => {
            const date = parseISO(r.fechaHora);
            return date.getHours() === hour;
          });

          return (
            <div key={hour} className="relative min-h-[80px] border-b border-muted/50 last:border-0">
              {/* Hour Label */}
              <div className="absolute -left-16 top-0 w-12 text-right">
                <span className="text-sm font-medium text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Grid Line Indicator */}
              <div className="absolute -left-[1px] top-0 w-3 h-[1px] bg-muted" />

              {/* Reservations for this hour */}
              <div className="py-2 pl-4 flex flex-wrap gap-3">
                {hourReservas.length === 0 ? (
                  <span className="text-xs text-muted-foreground/40 italic py-2">Sin actividad</span>
                ) : (
                  hourReservas.map((reserva) => (
                    <div
                      key={reserva.id}
                      className={cn(
                        "group relative w-full sm:w-[300px] p-3 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer",
                        reserva.estado === 'pendiente' && "bg-amber-50 border-amber-500 dark:bg-amber-950/20",
                        reserva.estado === 'confirmada' && "bg-blue-50 border-blue-500 dark:bg-blue-950/20",
                        reserva.estado === 'en_curso' && "bg-green-50 border-green-500 dark:bg-green-950/20",
                        reserva.estado === 'completada' && "bg-slate-50 border-slate-400 dark:bg-slate-900/50",
                        reserva.estado === 'cancelada' && "bg-red-50 border-red-400 dark:bg-red-900/20"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-bold">
                          {format(parseISO(reserva.fechaHora), "HH:mm")}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">
                          {reserva.estado}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          <User className="w-3 h-3" />
                          <span className="truncate">{reserva.pasajeroNombre}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{reserva.origen}</span>
                        </div>
                      </div>

                      {/* Hover details tooltip style */}
                      <div className="hidden group-hover:block absolute top-full left-0 z-10 w-full bg-popover text-popover-foreground p-3 rounded-lg shadow-xl border mt-1">
                        <p className="text-xs font-bold mb-1">Detalles del viaje:</p>
                        <p className="text-xs">{reserva.origen} → {reserva.destino}</p>
                        <p className="text-xs mt-1">Chofer: {reserva.choferNombre}</p>
                        {reserva.montoEstimado > 0 && (
                          <p className="text-xs mt-1 font-semibold">{formatCurrency(reserva.montoEstimado)}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
