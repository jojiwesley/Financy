'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    color: (formData.get('color') as string) || '#6366f1',
    icon: (formData.get('icon') as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/categories');
  redirect('/categories');
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/categories');
  redirect('/categories');
}
