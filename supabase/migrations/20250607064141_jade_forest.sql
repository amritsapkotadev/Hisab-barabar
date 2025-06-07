/*
# Create Group Members Table

1. New Tables
   - `group_members` table in public schema
     - `group_id` (uuid, foreign key to groups) - reference to group
     - `user_id` (uuid, foreign key to users) - reference to user
     - Primary key is composite of (group_id, user_id)

2. Security
   - Enable RLS on `group_members` table
   - Add policies for group members to read membership data
   - Add policy for group creators to manage memberships

3. Foreign Keys
   - `group_id` references `public.groups(id)`
   - `user_id` references `public.users(id)`
*/

-- Create group_members table in public schema
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Policy: Group members can read membership data
CREATE POLICY "Group members can read memberships"
  ON public.group_members
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Group creators can manage memberships
CREATE POLICY "Group creators can manage memberships"
  ON public.group_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_id 
      AND created_by::text = auth.uid()::text
    )
  );

-- Policy: Users can join groups (insert themselves)
CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);