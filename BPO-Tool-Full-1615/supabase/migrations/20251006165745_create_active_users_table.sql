/*
  # Create Active Users Table for Real-time Collaboration

  1. New Tables
    - `active_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `user_name` (text, display name)
      - `module` (text, current module/page)
      - `last_seen` (timestamptz, last activity time)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `active_users` table
    - Allow authenticated users to insert their own presence
    - Allow all authenticated users to read presence data
    - Allow users to update their own presence
    - Allow users to delete their own presence
  
  3. Notes
    - This table enables real-time collaboration features
    - Shows who is currently active in each module
    - Stale entries (>30 seconds old) are automatically cleaned up
*/

CREATE TABLE IF NOT EXISTS active_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  module text NOT NULL,
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_users_module ON active_users(module);
CREATE INDEX IF NOT EXISTS idx_active_users_last_seen ON active_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_active_users_user_id ON active_users(user_id);

ALTER TABLE active_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own presence"
  ON active_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all presence"
  ON active_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own presence"
  ON active_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own presence"
  ON active_users FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
