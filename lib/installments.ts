/**
 * Pure helper functions for installment schedule computation.
 * No I/O — these functions only compute; they never read or write to the database.
 */

export type InstallmentParcel = {
  parcelNumber: number; // 1-based
  billingMonth: string; // 'YYYY-MM-DD' — first day of billing month
  dueDate: string; // 'YYYY-MM-DD' — actual due date using card's due_day
  amount: number; // amount for this specific parcel
};

/**
 * Computes the first billing month for a purchase given the card's closing day.
 *
 * Rule:
 * - If purchase day <= closing_day  → billed in the same month
 * - If purchase day >  closing_day  → already past closing; billed next month
 */
export function computeFirstBillingMonth(
  purchaseDate: Date,
  closingDay: number,
): Date {
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth(); // 0-indexed
  const day = purchaseDate.getDate();

  if (day <= closingDay) {
    return new Date(year, month, 1);
  } else {
    // Next month
    return new Date(year, month + 1, 1);
  }
}

/**
 * Returns all parcel entries for a given installment rule.
 * Starts from `startParcel` (1-based, default = 1) so it can be used to
 * compute only the remaining/unconfirmed parcels.
 */
export function computeInstallmentSchedule(params: {
  installmentAmount: number;
  totalInstallments: number;
  totalAmount: number;
  purchaseDate: Date;
  closingDay: number;
  dueDay: number;
  startParcel?: number;
}): InstallmentParcel[] {
  const {
    installmentAmount,
    totalInstallments,
    totalAmount,
    purchaseDate,
    closingDay,
    dueDay,
    startParcel = 1,
  } = params;

  const firstBillingMonth = computeFirstBillingMonth(purchaseDate, closingDay);
  const parcels: InstallmentParcel[] = [];

  // Distribute rounding to the last parcel
  const baseAmount = parseFloat((totalAmount / totalInstallments).toFixed(2));
  const roundingDiff = parseFloat(
    (totalAmount - baseAmount * totalInstallments).toFixed(2),
  );

  for (let i = startParcel - 1; i < totalInstallments; i++) {
    const billingDate = new Date(
      firstBillingMonth.getFullYear(),
      firstBillingMonth.getMonth() + i,
      1,
    );

    // Build due date using the card's due_day in the billing month
    // If due_day doesn't exist in that month (e.g. 31 in April), clamp to last day
    const maxDay = new Date(
      billingDate.getFullYear(),
      billingDate.getMonth() + 1,
      0,
    ).getDate();
    const resolvedDueDay = Math.min(dueDay, maxDay);
    const dueDate = new Date(
      billingDate.getFullYear(),
      billingDate.getMonth(),
      resolvedDueDay,
    );

    const isLastParcel = i === totalInstallments - 1;
    const amount = isLastParcel
      ? parseFloat((installmentAmount + roundingDiff).toFixed(2))
      : baseAmount;

    parcels.push({
      parcelNumber: i + 1,
      billingMonth: billingDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      amount,
    });
  }

  return parcels;
}

/**
 * Given an installment record and its credit card, returns the parcels
 * that have NOT yet been confirmed (parcelNumber > confirmed_installments).
 */
export function getPendingParcels(params: {
  installmentAmount: number;
  totalInstallments: number;
  totalAmount: number;
  startDate: string; // ISO date string
  closingDay: number;
  dueDay: number;
  confirmedInstallments: number;
}): InstallmentParcel[] {
  return computeInstallmentSchedule({
    ...params,
    purchaseDate: new Date(params.startDate),
    startParcel: params.confirmedInstallments + 1,
  });
}

/** Formats a billing month date string ('YYYY-MM-DD') to 'MMM/YYYY' pt-BR label */
export function formatBillingMonth(billingMonth: string): string {
  const [year, month] = billingMonth.split("-");
  const MONTHS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${MONTHS[parseInt(month, 10) - 1]}/${year}`;
}
