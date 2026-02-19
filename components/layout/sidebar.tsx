'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  CreditCard,
  Home,
  Layers,
  LayoutGrid,
  LogOut,
  Plus,
  Receipt,
  Tag,
  User,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useQuickAdd } from '@/components/transactions/quick-add-provider';

const navItems = [
  { href: '/', label: 'Geral', icon: Home },
  { href: '/transactions', label: 'Transações', icon: Receipt },
  { href: '/accounts', label: 'Contas', icon: Wallet },
  { href: '/credit-cards', label: 'Cartões', icon: CreditCard },
  { href: '/installments', label: 'Parcelamentos', icon: Layers },
  { href: '/bills', label: 'Contas a Pagar', icon: LayoutGrid },
  { href: '/categories', label: 'Categorias', icon: Tag },
];

const timeTrackingItems = [
  { href: '/time-tracking', label: 'Visão Geral', icon: Home },
  { href: '/time-tracking/entries', label: 'Registros', icon: Clock },
  { href: '/time-tracking/reports', label: 'Relatórios', icon: LayoutGrid },
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openActionMenu } = useQuickAdd();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    onClose?.();
  }

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <aside className={cn("flex h-screen w-72 flex-col border-r border-border/40 bg-background/60 backdrop-blur-xl z-50", className)}>
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-border/40 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25">
          F
        </div>
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Financy</span>
      </div>

      {/* Quick add button */}
      <div className="px-4 pt-6 pb-2">
        <button
          onClick={openActionMenu}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300"
        >
          <div className="rounded-full bg-white/20 p-1 group-hover:bg-white/30 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          Novo Registro
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={handleLinkClick}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-sm ring-2 ring-primary/20" />
              )}
            </Link>
          );
        })}

        {/* Time Tracking section */}
        <div className="pt-4 pb-1">
          <div className="flex items-center gap-2 px-4 mb-2">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Ponto
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </div>
        </div>

        {timeTrackingItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/time-tracking'
            ? pathname === '/time-tracking'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              onClick={handleLinkClick}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-sm ring-2 ring-primary/20" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-border/40 px-4 py-6 space-y-1">
        <Link
          onClick={handleLinkClick}
          href="/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
            pathname === '/profile'
              ? 'bg-primary/10 text-primary border border-border/50'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <User className="h-5 w-5 shrink-0" />
          Perfil
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
