"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBill(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("bills").insert({
    user_id: user.id,
    description: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string) || 0,
    due_date: formData.get("due_date") as string,
    category_id: (formData.get("category_id") as string) || null,
    is_recurring: formData.get("is_recurring") === "true",
    status: "pending",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  redirect("/bills");
}

export async function payBill(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the bill before marking as paid so we can generate the next occurrence
  const { data: bill, error: fetchErr } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !bill) throw new Error("Conta não encontrada");

  const { error } = await supabase
    .from("bills")
    .update({ status: "paid" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  // If recurring, create next month's occurrence automatically
  if (bill.is_recurring && bill.due_date) {
    const currentDue = new Date(bill.due_date + "T12:00:00");
    const nextDue = new Date(
      currentDue.getFullYear(),
      currentDue.getMonth() + 1,
      currentDue.getDate(),
    );
    const nextDueStr = nextDue.toISOString().split("T")[0];

    await supabase.from("bills").insert({
      user_id: user.id,
      description: bill.description,
      amount: bill.amount,
      due_date: nextDueStr,
      category_id: bill.category_id ?? null,
      is_recurring: true,
      status: "pending",
    });
  }

  revalidatePath("/bills");
}

export async function updateBill(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("bills")
    .update({
      description: formData.get("name") as string,
      amount: parseFloat(formData.get("amount") as string) || 0,
      due_date: formData.get("due_date") as string,
      category_id: (formData.get("category_id") as string) || null,
      is_recurring: formData.get("is_recurring") === "true",
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  redirect("/bills");
}

export async function deleteBill(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  redirect("/bills");
}
