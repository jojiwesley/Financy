-- ============================================================
-- Migration: Add missing columns to transactions
-- Adds columns that exist in database.types.ts but were never
-- applied via migration.
-- ============================================================

-- credit_card_id: links a transaction to a credit card
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS credit_card_id uuid
    REFERENCES public.credit_cards(id) ON DELETE SET NULL;

-- account_id: links a transaction to a bank account
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_id uuid
    REFERENCES public.accounts(id) ON DELETE SET NULL;

-- notes: optional text notes on a transaction
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS notes text;

-- reference_date: competency date (used for recurring income/expense grouping)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reference_date date;

-- status: confirmed | pending
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id
  ON public.transactions(credit_card_id);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id
  ON public.transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_reference_date
  ON public.transactions(reference_date);

CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON public.transactions(status);
