/*
# Create Groups Table

1. New Tables
   - `groups` table in public schema
     - `id` (uuid, primary key, auto-generated)
     - `group_name` (text, not null) - name of the group
     - `description` (text, nullable) - optional description
     - `created_by` (uuid, foreign key to users) - creator of the group
     - `created_at` (timestamptz) - creation timestamp

2. Security
   - Enable RLS on `groups` table
   - Add policies for group members to read group data
   - Add policy for creators to manage their groups

3. Foreign Keys
   - `created_by` references `public.users(id)`
*/

-- Create groups table in public schema
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can read group data (via group_members table)
CREATE POLICY "Group members can read groups"
  ON public.groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id 
      AND user_id::text = auth.uid()::text
    )
  );

-- Policy: Group creators can update their groups
CREATE POLICY "Group creators can update groups"
  ON public.groups
  FOR UPDATE
  USING (created_by::text = auth.uid()::text);

-- Policy: Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid()::text = created_by::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at);