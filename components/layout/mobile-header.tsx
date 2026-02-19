'use client';

import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:hidden">
      <button
        onClick={onOpenSidebar}
        className="-ml-2 p-2 text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Abrir menu</span>
      </button>
      
      <div className="ml-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20">
          F
        </div>
        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Financy
        </span>
      </div>
    </header>
  );
}
