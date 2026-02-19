'use client';

import {
  DollarSign,
  Clock,
  Briefcase,
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuickAdd } from '@/components/transactions/quick-add-provider';
import { useClockIn } from '@/components/time-tracking/clock-in-provider';

interface ActionMenuProps {
  open: boolean;
  onClose: () => void;
}

export function ActionMenu({ open, onClose }: ActionMenuProps) {
  const { openDrawer: openTransaction } = useQuickAdd();
  const { openDrawer: openClockIn } = useClockIn();

  if (!open) return null;

  const handleAction = (action: 'income' | 'expense' | 'clock-in') => {
    onClose();
    setTimeout(() => {
      if (action === 'clock-in') {
        openClockIn();
      } else {
        // Here we could pass pre-filled type to transaction drawer if supported
        // For now, it just opens the drawer which defaults to Expense, but user can switch.
        // Ideally we would pass the intended type.
        // Let's assume openTransaction just opens it for now.
        openTransaction();
      }
    }, 150); // Small delay for smooth transition
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed bottom-0 left-0 z-50 w-full rounded-t-3xl bg-background p-6 shadow-2xl transition-transform duration-300 ease-out pb-safe',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-muted" />
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => handleAction('expense')}
            className="flex flex-col items-center gap-3 transition-transform active:scale-95 group"
          >
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shadow-md ring-4 ring-transparent group-active:ring-red-100 dark:group-active:ring-red-900/30 transition-all">
              <TrendingDown className="h-8 w-8" />
            </div>
            <span className="text-sm font-medium text-foreground">Despesa</span>
          </button>

          <button
            onClick={() => handleAction('income')}
            className="flex flex-col items-center gap-3 transition-transform active:scale-95 group"
          >
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400 shadow-md ring-4 ring-transparent group-active:ring-green-100 dark:group-active:ring-green-900/30 transition-all">
              <TrendingUp className="h-8 w-8" />
            </div>
            <span className="text-sm font-medium text-foreground">Receita</span>
          </button>

          <button
            onClick={() => handleAction('clock-in')}
            className="flex flex-col items-center gap-3 transition-transform active:scale-95 group"
          >
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md ring-4 ring-transparent group-active:ring-blue-100 dark:group-active:ring-blue-900/30 transition-all">
              <Clock className="h-8 w-8" />
            </div>
            <span className="text-sm font-medium text-foreground">Ponto</span>
          </button>
          
           {/* Add more later? */}
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-muted py-4 font-medium hover:bg-muted/80 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </>
  );
}
