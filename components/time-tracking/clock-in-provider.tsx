"use client";

import { createContext, useContext, useState } from "react";
import { ClockInDrawer } from "./clock-in-drawer";

interface ClockInContextType {
  openDrawer: (date?: string) => void;
}

const ClockInContext = createContext<ClockInContextType>({
  openDrawer: () => {},
});

export function useClockIn() {
  return useContext(ClockInContext);
}

export function ClockInProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);

  function openDrawer(date?: string) {
    setInitialDate(date);
    setOpen(true);
  }

  return (
    <ClockInContext.Provider value={{ openDrawer }}>
      {children}
      <ClockInDrawer
        open={open}
        onClose={() => setOpen(false)}
        initialDate={initialDate}
      />
    </ClockInContext.Provider>
  );
}
