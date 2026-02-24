import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'positive' | 'negative' | 'neutral';
  trendValue?: string;
  className?: string;
}

export const MetricCard = memo(({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  trendValue,
  className,
}: MetricCardProps) => {
  const trendColors = {
    positive: 'text-green-500 dark:text-green-400',
    negative: 'text-red-500 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-lg dark:hover:shadow-red-500/10 card-hover",
      className
    )}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      <div className="relative space-y-3">
        {/* Header with icon */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Value */}
        <div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* Trend indicator */}
        {trendValue && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendColors[trend])}>
            {trend === 'positive' && <TrendingUp className="w-4 h-4" />}
            {trend === 'negative' && <TrendingDown className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';
