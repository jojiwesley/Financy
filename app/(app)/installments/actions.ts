"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateInstallmentInput = {
  description: string;
  credit_card_id: string;
  purchase_date: string; // 'YYYY-MM-DD'
  total_installments: number;
  total_amount: number;
  installment_amount: number;
  category_id?: string | null;
  /** Which installment number is the current one (1-based). Default 1. */
  start_installment?: number;
};

// ---------------------------------------------------------------------------
// createInstallment
// ---------------------------------------------------------------------------

/**
 * Creates an installment rule.
 * All parcels from confirmed_installments+1 onwards appear on the calendar.
 * No transactions are created — the calendar is computed from the rule.
 */
export async function createInstallment(
  input: CreateInstallmentInput,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  if (input.total_installments < 1)
    throw new Error("Número de parcelas inválido");
  if (input.total_amount <= 0) throw new Error("Valor total inválido");
  if (!input.credit_card_id) throw new Error("Cartão de crédito obrigatório");

  // alreadyPaid = start_installment - 1 (parcelas anteriores já pagas)
  const alreadyPaid = Math.max(0, (input.start_installment ?? 1) - 1);

  const { error } = await supabase.from("installments").insert({
    user_id: user.id,
    description: input.description.trim(),
    credit_card_id: input.credit_card_id,
    start_date: input.purchase_date,
    total_installments: input.total_installments,
    total_amount: input.total_amount,
    installment_amount: input.installment_amount,
    current_installment: alreadyPaid,
    confirmed_installments: alreadyPaid,
    auto_confirm: false,
    status: "active",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/installments");
  redirect("/installments");
}

// ---------------------------------------------------------------------------
// cancelInstallment
// ---------------------------------------------------------------------------

export async function cancelInstallment(installmentId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("installments")
    .update({ status: "cancelled" })
    .eq("id", installmentId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/installments");
}
