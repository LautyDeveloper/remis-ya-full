import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  // Chofer statuses
  disponible: {
    label: 'Disponible',
    variant: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20'
  },
  en_viaje: {
    label: 'En Viaje',
    variant: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/20'
  },
  no_disponible: {
    label: 'No Disponible',
    variant: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20'
  },
  
  // Viaje/Reserva statuses
  pendiente: {
    label: 'Pendiente',
    variant: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
  },
  en_curso: {
    label: 'En Curso',
    variant: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/20'
  },
  completado: {
    label: 'Completado',
    variant: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20'
  },
  cancelado: {
    label: 'Cancelado',
    variant: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20'
  },
  
  // Reserva statuses
  programada: {
    label: 'Programada',
    variant: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
  },
  confirmada: {
    label: 'Confirmada',
    variant: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20'
  },
  completada: {
    label: 'Completada',
    variant: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20'
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    variant: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20'
  };
  
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5",
      config.variant
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
