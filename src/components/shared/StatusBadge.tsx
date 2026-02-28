import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'chofer' | 'viaje' | 'reserva';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Chofer statuses
  disponible: { label: 'Disponible', className: 'status-available' },
  en_viaje: { label: 'En Viaje', className: 'status-busy' },
  no_disponible: { label: 'No Disponible', className: 'status-unavailable' },
  
  // Viaje/Reserva statuses
  pendiente: { label: 'Pendiente', className: 'status-pending' },
  en_curso: { label: 'En Curso', className: 'status-busy' },
  completado: { label: 'Completado', className: 'status-completed' },
  cancelado: { label: 'Cancelado', className: 'status-cancelled' },
  cancelada: { label: 'Cancelada', className: 'status-cancelled' },
  
  // Reserva statuses
  programada: { label: 'Programada', className: 'status-pending' },
  confirmada: { label: 'Confirmada', className: 'status-info' },
  completada: { label: 'Completada', className: 'status-completed' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'status-unavailable' };
  
  return (
    <span className={cn('status-badge', config.className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
