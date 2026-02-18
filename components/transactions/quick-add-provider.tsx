'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { QuickAddDrawer } from '@/components/transactions/quick-add-drawer';

interface QuickAddContextValue {
  openDrawer: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  return (
    <QuickAddContext.Provider value={{ openDrawer }}>
      {children}
      <QuickAddDrawer open={open} onClose={closeDrawer} />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error('useQuickAdd must be used inside QuickAddProvider');
  return ctx;
}
