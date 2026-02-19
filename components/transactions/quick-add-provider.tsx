'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { QuickAddDrawer } from '@/components/transactions/quick-add-drawer';
import { ActionMenu } from '@/components/layout/action-menu';

interface QuickAddContextValue {
  openDrawer: () => void;
  openActionMenu: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  const openActionMenu = useCallback(() => setMenuOpen(true), []);
  const closeActionMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <QuickAddContext.Provider value={{ openDrawer, openActionMenu }}>
      {children}
      <QuickAddDrawer open={open} onClose={closeDrawer} />
      <ActionMenu open={menuOpen} onClose={closeActionMenu} />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error('useQuickAdd must be used inside QuickAddProvider');
  return ctx;
}
