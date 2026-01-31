import { ReactNode, memo } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export const MetricCard = memo(({ title, value, subtitle, icon, trend, className }: MetricCardProps) => {
  return (
    <div className={cn('metric-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-sm mt-2 flex items-center gap-1',
              trend.value >= 0 ? 'text-status-available' : 'text-destructive'
            )}>
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground">{trend.label}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';
