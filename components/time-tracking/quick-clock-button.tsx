'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClockIn } from './clock-in-provider';

interface QuickClockButtonProps {
  variant?: 'default' | 'outline';
  className?: string;
}

export function QuickClockButton({ variant = 'default', className }: QuickClockButtonProps) {
  const { openDrawer } = useClockIn();

  if (variant === 'outline') {
    return (
      <button
        onClick={openDrawer}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all',
          className
        )}
      >
        <Clock className="h-4 w-4" />
        Bater Ponto
      </button>
    );
  }

  return (
    <button
      onClick={openDrawer}
      className={cn(
        'group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300',
        className
      )}
    >
      <div className="rounded-full bg-white/20 p-1 group-hover:bg-white/30 transition-colors">
        <Clock className="h-3.5 w-3.5" />
      </div>
      Bater Ponto
    </button>
  );
}
