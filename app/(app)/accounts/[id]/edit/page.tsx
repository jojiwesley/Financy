import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditAccountForm } from "./edit-form";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!account) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Editar Conta" description="Atualize os dados da conta">
        <Link
          href="/accounts"
          className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
        >
          Cancelar
        </Link>
      </PageHeader>

      <EditAccountForm
        id={account.id}
        name={account.name}
        type={account.type}
        balance={account.balance ?? 0}
        color={account.color}
      />
    </div>
  );
}
