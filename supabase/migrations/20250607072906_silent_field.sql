/*
  # Fix RLS Policies for Clerk Authentication

  1. Changes
    - Drop existing RLS policies that use auth.uid()
    - Create new RLS policies that work with Clerk user IDs via custom headers
    - Add policies that allow user creation without authentication (for initial sync)
    - Update policies to use custom headers for user identification

  2. Security
    - Maintain data security while supporting Clerk authentication
    - Allow initial user creation for Clerk sync
    - Use custom headers for user identification in RLS
*/

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;

DROP POLICY IF EXISTS "Group members can read groups" ON public.groups;
DROP POLICY IF EXISTS "Group creators can update groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;

DROP POLICY IF EXISTS "Group members can read memberships" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can manage memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

DROP POLICY IF EXISTS "Group members can read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense creators can update expenses" ON public.expenses;

DROP POLICY IF EXISTS "Group members can read expense splits" ON public.expense_splits;
DROP POLICY IF EXISTS "Expense creators can manage splits" ON public.expense_splits;

-- Create new RLS policies for Clerk authentication

-- Users table policies
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (
    id = current_setting('request.headers', true)::json->>'x-user-id'
    OR current_setting('request.headers', true)::json->>'x-auth-provider' = 'clerk'
  );

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (
    id = current_setting('request.headers', true)::json->>'x-user-id'
  );

CREATE POLICY "Allow user creation for Clerk sync"
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
      AND user_id = current_setting('request.headers', true)::json->>'x-user-id'
    )
  );

CREATE POLICY "Group creators can update groups"
  ON public.groups
  FOR UPDATE
  USING (
    created_by = current_setting('request.headers', true)::json->>'x-user-id'
  );

CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (
    created_by = current_setting('request.headers', true)::json->>'x-user-id'
    AND current_setting('request.headers', true)::json->>'x-auth-provider' = 'clerk'
  );

-- Group members table policies
CREATE POLICY "Group members can read memberships"
  ON public.group_members
  FOR SELECT
  USING (
    user_id = current_setting('request.headers', true)::json->>'x-user-id'
    OR EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id 
      AND created_by = current_setting('request.headers', true)::json->>'x-user-id'
    )
  );

CREATE POLICY "Group creators can manage memberships"
  ON public.group_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id 
      AND created_by = current_setting('request.headers', true)::json->>'x-user-id'
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('request.headers', true)::json->>'x-user-id'
    AND current_setting('request.headers', true)::json->>'x-auth-provider' = 'clerk'
  );

-- Expenses table policies
CREATE POLICY "Group members can read expenses"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = expenses.group_id 
      AND user_id = current_setting('request.headers', true)::json->>'x-user-id'
    )
  );

CREATE POLICY "Group members can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    created_by = current_setting('request.headers', true)::json->>'x-user-id'
    AND EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = expenses.group_id 
      AND user_id = current_setting('request.headers', true)::json->>'x-user-id'
    )
    AND current_setting('request.headers', true)::json->>'x-auth-provider' = 'clerk'
  );

CREATE POLICY "Expense creators can update expenses"
  ON public.expenses
  FOR UPDATE
  USING (
    created_by = current_setting('request.headers', true)::json->>'x-user-id'
  );

-- Expense splits table policies
CREATE POLICY "Group members can read expense splits"
  ON public.expense_splits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      JOIN public.group_members gm ON e.group_id = gm.group_id
      WHERE e.id = expense_splits.expense_id 
      AND gm.user_id = current_setting('request.headers', true)::json->>'x-user-id'
    )
  );

CREATE POLICY "Expense creators can manage splits"
  ON public.expense_splits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE id = expense_splits.expense_id 
      AND created_by = current_setting('request.headers', true)::json->>'x-user-id'
    )
  );