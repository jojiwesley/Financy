'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBill(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('bills').insert({
    user_id: user.id,
    description: formData.get('name') as string,
    amount: parseFloat(formData.get('amount') as string) || 0,
    due_date: formData.get('due_date') as string,
    category_id: (formData.get('category_id') as string) || null,
    is_recurring: formData.get('is_recurring') === 'true',
    status: 'pending',
    notes: (formData.get('notes') as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/bills');
  redirect('/bills');
}

export async function payBill(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('bills')
    .update({ status: 'paid' })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/bills');
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/bills');
  redirect('/bills');
}
