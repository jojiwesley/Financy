'use client';

import { createContext, useContext, useState } from 'react';
import { ClockInDrawer } from './clock-in-drawer';

interface ClockInContextType {
  openDrawer: () => void;
}

const ClockInContext = createContext<ClockInContextType>({ openDrawer: () => {} });

export function useClockIn() {
  return useContext(ClockInContext);
}

export function ClockInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <ClockInContext.Provider value={{ openDrawer: () => setOpen(true) }}>
      {children}
      <ClockInDrawer open={open} onClose={() => setOpen(false)} />
    </ClockInContext.Provider>
  );
}
