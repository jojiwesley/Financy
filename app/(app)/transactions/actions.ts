'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type: formData.get('type') as string,
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date') as string,
    category_id: (formData.get('category_id') as string) || null,
    account_id: (formData.get('account_id') as string) || null,
    notes: (formData.get('notes') as string) || null,
    status: (formData.get('status') as string) || 'confirmed',
  });

  if (error) throw new Error(error.message);

  revalidatePath('/transactions');
  redirect('/transactions');
}

export async function updateTransaction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const referenceMonthRaw = formData.get('reference_month') as string | null;

  const { error } = await supabase
    .from('transactions')
    .update({
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      reference_date: referenceMonthRaw ? `${referenceMonthRaw}-01` : null,
      category_id: (formData.get('category_id') as string) || null,
      account_id: (formData.get('account_id') as string) || null,
      notes: (formData.get('notes') as string) || null,
      status: (formData.get('status') as string) || 'confirmed',
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${id}`);
  // Navigation handled by the client component
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/transactions');
  redirect('/transactions');
}
