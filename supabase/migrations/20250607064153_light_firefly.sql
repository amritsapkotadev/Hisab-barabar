/*
# Create Expense Splits Table

1. New Tables
   - `expense_splits` table in public schema
     - `id` (uuid, primary key, auto-generated)
     - `expense_id` (uuid, foreign key to expenses) - which expense this split belongs to
     - `user_id` (uuid, foreign key to users) - which user this split is for
     - `paid_amount` (numeric, default 0) - how much this user paid
     - `owed_amount` (numeric, default 0) - how much this user owes

2. Security
   - Enable RLS on `expense_splits` table
   - Add policies for group members to read splits
   - Add policy for expense creators to manage splits

3. Foreign Keys
   - `expense_id` references `public.expenses(id)`
   - `user_id` references `public.users(id)`

4. Constraints
   - Amounts must be non-negative
   - Unique constraint on (expense_id, user_id)
*/

-- Create expense_splits table in public schema
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  paid_amount NUMERIC(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  owed_amount NUMERIC(10,2) DEFAULT 0 CHECK (owed_amount >= 0),
  UNIQUE(expense_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can read expense splits
CREATE POLICY "Group members can read expense splits"
  ON public.expense_splits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.group_members gm ON e.group_id = gm.group_id
      WHERE e.id = expense_splits.expense_id 
      AND gm.user_id::text = auth.uid()::text
    )
  );

-- Policy: Expense creators can manage splits
CREATE POLICY "Expense creators can manage splits"
  ON public.expense_splits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE id = expense_splits.expense_id 
      AND created_by::text = auth.uid()::text
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);