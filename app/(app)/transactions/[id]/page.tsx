import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/page-header';
import { deleteTransaction, updateTransaction } from '../actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Tables } from '@/types/database.types';
import { DeleteButton } from './delete-button';
import { EditTransactionForm } from './edit-transaction-form';

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: txRaw } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  const tx = txRaw as Tables<'transactions'> | null;
  if (!tx) notFound();

  const deleteAction = deleteTransaction.bind(null, id);
  const updateAction = updateTransaction.bind(null, id);

  const typeLabel = tx.type === 'income' ? 'Receita' : 'Despesa';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar ${typeLabel}`}
        description={`Lançado em ${new Date(tx.date).toLocaleDateString('pt-BR')}`}
      >
        <Link
          href="/transactions"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Voltar
        </Link>
        <DeleteButton action={deleteAction} />
      </PageHeader>

      <div className="mx-auto max-w-2xl">
        <EditTransactionForm tx={tx} updateAction={updateAction} />
      </div>
    </div>
  );
}
