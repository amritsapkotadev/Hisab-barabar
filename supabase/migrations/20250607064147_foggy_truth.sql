/*
# Create Expenses Table

1. New Tables
   - `expenses` table in public schema
     - `id` (uuid, primary key, auto-generated)
     - `group_id` (uuid, foreign key to groups) - which group this expense belongs to
     - `title` (text, not null) - expense title/description
     - `amount` (numeric, not null) - total expense amount
     - `created_by` (uuid, foreign key to users) - who created the expense
     - `date` (timestamptz, not null) - when the expense occurred
     - `created_at` (timestamptz) - when the record was created

2. Security
   - Enable RLS on `expenses` table
   - Add policies for group members to read/create expenses
   - Add policy for expense creators to update their expenses

3. Foreign Keys
   - `group_id` references `public.groups(id)`
   - `created_by` references `public.users(id)`
*/

-- Create expenses table in public schema
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can read expenses
CREATE POLICY "Group members can read expenses"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = expenses.group_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Policy: Group members can create expenses
CREATE POLICY "Group members can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = created_by::text
    AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = expenses.group_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Policy: Expense creators can update their expenses
CREATE POLICY "Expense creators can update expenses"
  ON public.expenses
  FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);