'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Plus, Receipt, Wallet, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuickAdd } from '@/components/transactions/quick-add-provider';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openActionMenu } = useQuickAdd();

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/transactions', label: 'Transações', icon: Receipt },
    { type: 'button', onClick: openActionMenu, icon: Plus }, // Special item
    { href: '/time-tracking', label: 'Ponto', icon: Clock },
    { href: '/accounts', label: 'Contas', icon: Wallet },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t border-border/40 bg-background/80 backdrop-blur-xl md:hidden pb-safe">
      <div className="flex h-16 items-center justify-between px-2">
        {navItems.map((item, index) => {
          if (item.type === 'button') {
            return (
              <div key="quick-add" className="flex flex-1 items-center justify-center -mt-8">
                <button
                  onClick={item.onClick}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/30 transition-transform active:scale-95 border-2 border-background"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            );
          }

          const active = item.href === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.href!);
            
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full shadow-[0_1px_6px_rgba(var(--primary),0.5)]" />
              )}
              <item.icon className={cn("h-5 w-5 mb-0.5 transition-transform duration-200", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium transition-colors", active && "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

