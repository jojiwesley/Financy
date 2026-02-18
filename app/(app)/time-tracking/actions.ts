'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type TimeEntryFormData = {
  date: string;
  clock_in: string;
  lunch_start?: string;
  lunch_end?: string;
  clock_out?: string;
  expected_hours?: number;
  notes?: string;
};

export async function upsertTimeEntry(data: TimeEntryFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const payload = {
    user_id: user.id,
    date: data.date,
    clock_in: data.clock_in || null,
    lunch_start: data.lunch_start || null,
    lunch_end: data.lunch_end || null,
    clock_out: data.clock_out || null,
    expected_hours: data.expected_hours ?? 8,
    notes: data.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('time_entries')
    .upsert(payload, { onConflict: 'user_id,date' });

  if (error) throw new Error(error.message);

  revalidatePath('/time-tracking');
  revalidatePath('/time-tracking/entries');
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/time-tracking');
  revalidatePath('/time-tracking/entries');
  redirect('/time-tracking/entries');
}

export async function upsertWorkSchedule(data: {
  name: string;
  daily_hours: number;
  work_days: number[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('time_work_schedules')
    .upsert(
      { user_id: user.id, ...data },
      { onConflict: 'user_id' }
    );

  if (error) throw new Error(error.message);

  revalidatePath('/time-tracking');
}
