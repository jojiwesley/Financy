import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: React.ReactNode;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'primary';
  trend?: {
    value: number;
    label: string;
  };
  className?: string; // Add className prop
}

export function MetricCard({
  title,
  value,
  subValue,
  icon: Icon,
  variant = 'default',
  trend,
  className,
}: MetricCardProps) {
  const variants = {
    default: 'text-foreground bg-secondary/50',
    primary: 'text-white bg-white/20', 
    success: 'text-emerald-500 bg-emerald-500/10',
    danger: 'text-rose-500 bg-rose-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  };

  const isPrimary = variant === 'primary';

  return (
    <Card className={cn(
      "overflow-hidden relative group transition-all duration-300 border-border/50",
      isPrimary ? "bg-gradient-to-br from-indigo-600 to-violet-600 border-none shadow-xl" : "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1",
      className
    )}>
      {/* Background Glow Effect */}
      {!isPrimary && (
        <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500", 
          variant === 'default' && "bg-primary/20",
          variant === 'success' && "bg-emerald-500/20",
          variant === 'danger' && "bg-rose-500/20",
          variant === 'warning' && "bg-amber-500/20",
          variant === 'info' && "bg-blue-500/20",
        )} />
      )}
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className={cn("text-sm font-medium", isPrimary ? "text-indigo-100" : "text-muted-foreground")}>
            {title}
          </p>
          <div className={cn('p-2.5 rounded-xl transition-colors', variants[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className={cn("text-2xl font-bold tracking-tight", isPrimary ? "text-white" : "text-foreground")}>
            {value}
          </h3>
          
          <div className="flex items-center gap-2">
             {trend && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
                trend.value >= 0 
                  ? (isPrimary ? "bg-emerald-400/20 text-emerald-100" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10")
                  : (isPrimary ? "bg-rose-400/20 text-rose-100" : "text-rose-600 bg-rose-100 dark:bg-rose-500/10")
              )}>
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </span>
            )}
            {subValue && (
              <div className={cn("text-xs truncate", isPrimary ? "text-indigo-200" : "text-muted-foreground")}>
                {subValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
