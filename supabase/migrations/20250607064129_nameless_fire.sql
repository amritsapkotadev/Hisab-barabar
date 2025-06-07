/*
# Create Users Table and Authentication Setup

1. New Tables
   - `users` table in public schema
     - `id` (uuid, primary key) - matches Clerk user ID
     - `name` (text, not null) - user's display name
     - `email` (text, unique, not null) - user's email
     - `phone` (text, nullable) - user's phone number
     - `created_at` (timestamptz) - creation timestamp

2. Security
   - Enable RLS on `users` table
   - Add policies for authenticated users to read/update their own data
   - Add policy for service role to manage all users

3. Notes
   - This table stores Clerk users synced to Supabase
   - Uses public schema as required by Supabase
   - RLS policies ensure data security
*/

-- Create users table in public schema (required by Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Policy: Service role can manage all users (for Clerk sync)
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  TO service_role
  USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);