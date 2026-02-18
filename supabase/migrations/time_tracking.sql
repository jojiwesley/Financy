-- Time Tracking Module
-- Run this SQL in your Supabase SQL Editor

-- Table: time_entries
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME,
  lunch_start TIME,
  lunch_end TIME,
  clock_out TIME,
  expected_hours NUMERIC(4, 2) DEFAULT 8.0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Table: time_work_schedules (jornada de trabalho padrão do usuário)
CREATE TABLE IF NOT EXISTS public.time_work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Jornada Padrão',
  daily_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.0,
  work_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Dom, 1=Seg, ..., 6=Sab
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trigger: atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_work_schedules ENABLE ROW LEVEL SECURITY;

-- time_entries policies
CREATE POLICY "Users can view own time entries"
  ON public.time_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries"
  ON public.time_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time entries"
  ON public.time_entries FOR DELETE
  USING (auth.uid() = user_id);

-- time_work_schedules policies
CREATE POLICY "Users can view own work schedules"
  ON public.time_work_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work schedules"
  ON public.time_work_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work schedules"
  ON public.time_work_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work schedules"
  ON public.time_work_schedules FOR DELETE
  USING (auth.uid() = user_id);
