import { useData } from "@/context/DataContext";
import { Reserva } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  User,
  Car,
  Phone,
  Clock,
  Play,
  Pencil,
  Trash2
} from "lucide-react";
import { differenceInMinutes, parseISO, isPast } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ReservaCardProps {
  reserva: Reserva;
  onEdit: (reserva: Reserva) => void;
  onDelete: (id: number) => void;
  onReprogramar: (reserva: Reserva) => void;
  onIniciarViaje: (id: number) => void;
}

export function ReservaCard({
  reserva,
  onEdit,
  onDelete,
  onReprogramar,
  onIniciarViaje
}: ReservaCardProps) {
  const { updateReserva, pasajeros, activeTelefonista } = useData();

  const passenger = pasajeros.find(p => p.id === reserva.pasajeroId);
  const phone = passenger?.telefono;

  const handleClienteConfirmadoChange = async (checked: boolean) => {
    const now = new Date().toISOString();
    const updates: Partial<Reserva> = {
      clienteConfirmado: checked,
      clienteConfirmadoFecha: checked ? now : undefined
    };

    if (checked && reserva.choferAvisado) {
      updates.estado = 'confirmada';
    } else if (!checked && reserva.estado === 'confirmada') {
      updates.estado = 'pendiente';
    }

    await updateReserva(reserva.id, updates);
    toast({
      title: checked ? "Cliente confirmado" : "Confirmación de cliente removida",
      description: checked ? formatDate(now, 'HH:mm') : undefined
    });
  };

  const handleChoferAvisadoChange = async (checked: boolean) => {
    const now = new Date().toISOString();
    const updates: Partial<Reserva> = {
      choferAvisado: checked,
      choferAvisadoFecha: checked ? now : undefined
    };

    if (checked && reserva.clienteConfirmado) {
      updates.estado = 'confirmada';
    } else if (!checked && reserva.estado === 'confirmada') {
      updates.estado = 'pendiente';
    }

    await updateReserva(reserva.id, updates);
    toast({
      title: checked ? "Chofer avisado" : "Aviso a chofer removido",
      description: checked ? formatDate(now, 'HH:mm') : undefined
    });
  };

  const minutesToReserva = differenceInMinutes(parseISO(reserva.fechaHora), new Date());
  const isUrgent = minutesToReserva <= 30 && minutesToReserva > 0;
  const isOverdue = isPast(parseISO(reserva.fechaHora)) && (reserva.estado === 'pendiente' || reserva.estado === 'confirmada');

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${
      isUrgent ? 'border-primary ring-1 ring-primary/20' :
      isOverdue ? 'border-destructive ring-1 ring-destructive/20' : ''
    }`}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{formatDate(reserva.fechaHora, 'HH:mm')}</span>
              {isUrgent && (
                <Badge variant="destructive" className="animate-pulse">URGENTE</Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive">ATRASADA</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(reserva.fechaHora, 'dd/MM/yyyy')}</span>
            </div>
          </div>
          <StatusBadge status={reserva.estado} />
        </div>

        {/* Main Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{reserva.pasajeroNombre}</span>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-1 hover:bg-accent rounded-full text-primary transition-colors"
                title="Llamar"
              >
                <Phone className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span className="line-clamp-1">{reserva.origen}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <span className="text-muted-foreground">→</span>
              </div>
              <span className="line-clamp-1">{reserva.destino}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className={reserva.choferId ? '' : 'text-amber-600 font-medium'}>
                {reserva.choferNombre}
              </span>
            </div>
            {reserva.montoEstimado > 0 && (
              <span className="font-medium">{formatCurrency(reserva.montoEstimado)}</span>
            )}
          </div>
        </div>

        {/* Confirmation Checklist */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmaciones</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`client-${reserva.id}`}
                  checked={reserva.clienteConfirmado}
                  onCheckedChange={(checked) => handleClienteConfirmadoChange(checked as boolean)}
                />
                <label
                  htmlFor={`client-${reserva.id}`}
                  className="text-sm cursor-pointer"
                >
                  Cliente confirmado
                </label>
              </div>
              {reserva.clienteConfirmadoFecha && (
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(reserva.clienteConfirmadoFecha, 'HH:mm')}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`driver-${reserva.id}`}
                  checked={reserva.choferAvisado}
                  onCheckedChange={(checked) => handleChoferAvisadoChange(checked as boolean)}
                />
                <label
                  htmlFor={`driver-${reserva.id}`}
                  className="text-sm cursor-pointer"
                >
                  Chofer avisado
                </label>
              </div>
              {reserva.choferAvisadoFecha && (
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(reserva.choferAvisadoFecha, 'HH:mm')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {reserva.notas && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-2 text-xs text-amber-800 dark:text-amber-200">
            <p className="line-clamp-2">{reserva.notas}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {reserva.estado !== 'completada' && reserva.estado !== 'cancelada' && reserva.estado !== 'en_curso' && (
            <>
              <Button
                className="flex-1 gap-2"
                size="sm"
                onClick={() => onIniciarViaje(reserva.id)}
                disabled={!activeTelefonista}
              >
                <Play className="w-3 h-3" />
                Iniciar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReprogramar(reserva)}
                title="Reprogramar"
              >
                <Clock className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(reserva)}
                title="Editar"
              >
                <Pencil className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(reserva.id)}
                title="Eliminar/Cancelar"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
          {reserva.estado === 'en_curso' && (
            <div className="flex-1 text-center py-1 text-sm font-medium text-green-600 bg-green-50 rounded-md">
              Viaje en curso
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
