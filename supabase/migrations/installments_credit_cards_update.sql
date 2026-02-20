-- ============================================================
-- Migration: Installments & Credit Cards enhancements
-- Adds hybrid installment tracking support:
--   - transactions.installment_id  → links a confirmed parcel to its installment rule
--   - transactions.billing_month   → invoice month for grouping by billing cycle
--   - installments.auto_confirm    → opt-in automatic parcel confirmation
--   - installments.confirmed_installments → tracks how many parcels were confirmed
-- ============================================================

-- 1. Add installment_id to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS installment_id uuid
    REFERENCES public.installments(id) ON DELETE SET NULL;

-- 2. Add billing_month to transactions (first day of the billing month)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS billing_month date;

-- 3. Add auto_confirm to installments
ALTER TABLE public.installments
  ADD COLUMN IF NOT EXISTS auto_confirm boolean NOT NULL DEFAULT false;

-- 4. Add confirmed_installments to installments
ALTER TABLE public.installments
  ADD COLUMN IF NOT EXISTS confirmed_installments integer NOT NULL DEFAULT 0;

-- 5. Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_installment_id
  ON public.transactions(installment_id);

CREATE INDEX IF NOT EXISTS idx_transactions_billing_month
  ON public.transactions(billing_month);

-- 6. RLS: new columns inherit the table-level RLS policies already in place.
--    No additional policies needed since the columns belong to the same rows
--    already protected by user_id checks.
