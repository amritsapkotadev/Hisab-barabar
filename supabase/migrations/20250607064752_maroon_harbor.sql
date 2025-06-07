/*
  # Fix Clerk User ID Compatibility

  1. Changes
    - Convert user ID columns from UUID to TEXT to support Clerk's user ID format
    - Update all foreign key references
    - Recreate indexes with proper data types
    - Update RLS policies to work with TEXT IDs

  2. Security
    - Maintain all existing RLS policies
    - Ensure proper access control with TEXT-based user IDs
*/

-- Drop existing foreign key constraints and indexes
DROP INDEX IF EXISTS idx_groups_created_by;
DROP INDEX IF EXISTS idx_group_members_group_id;
DROP INDEX IF EXISTS idx_group_members_user_id;
DROP INDEX IF EXISTS idx_expenses_group_id;
DROP INDEX IF EXISTS idx_expenses_created_by;
DROP INDEX IF EXISTS idx_expense_splits_expense_id;
DROP INDEX IF EXISTS idx_expense_splits_user_id;

-- Drop existing tables to recreate with proper data types
DROP TABLE IF EXISTS public.expense_splits;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.group_members;
DROP TABLE IF EXISTS public.groups;
DROP TABLE IF EXISTS public.users;

-- Recreate users table with TEXT id for Clerk compatibility
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate group_members table
CREATE TABLE public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

-- Recreate expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  created_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate expense_splits table
CREATE TABLE public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  paid_amount NUMERIC(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  owed_amount NUMERIC(10,2) DEFAULT 0 CHECK (owed_amount >= 0),
  UNIQUE(expense_id, user_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Groups table policies
CREATE POLICY "Group members can read groups"
  ON public.groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can update groups"
  ON public.groups
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Group members table policies
CREATE POLICY "Group members can read memberships"
  ON public.group_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Group creators can manage memberships"
  ON public.group_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Expenses table policies
CREATE POLICY "Group members can read expenses"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = expenses.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = expenses.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update expenses"
  ON public.expenses
  FOR UPDATE
  USING (created_by = auth.uid());

-- Expense splits table policies
CREATE POLICY "Group members can read expense splits"
  ON public.expense_splits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.group_members gm ON e.group_id = gm.group_id
      WHERE e.id = expense_splits.expense_id 
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can manage splits"
  ON public.expense_splits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE id = expense_splits.expense_id 
      AND created_by = auth.uid()
    )
  );

-- Recreate indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_created_at ON public.groups(created_at);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_created_at ON public.expenses(created_at);
CREATE INDEX idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON public.expense_splits(user_id);