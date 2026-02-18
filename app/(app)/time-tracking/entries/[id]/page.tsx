import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditEntryForm } from './edit-form';
import { DeleteEntryButton } from './delete-button';
import type { Tables } from '@/types/database.types';

export default async function TimeEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: entry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (!entry) notFound();

  const typedEntry = entry as Tables<'time_entries'>;
  const dateLabel = new Date(typedEntry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/time-tracking/entries"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold capitalize">{dateLabel}</h1>
            <p className="text-xs text-muted-foreground">Editar registro de ponto</p>
          </div>
        </div>
        <DeleteEntryButton id={typedEntry.id} />
      </div>

      <EditEntryForm entry={typedEntry} />
    </div>
  );
}
