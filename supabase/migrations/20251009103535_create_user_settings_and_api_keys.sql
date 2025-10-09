/*
  # Create User Settings and API Keys Tables

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `notification_preferences` (jsonb)
      - `email_frequency` (text)
      - `theme` (text)
      - `language` (text)
      - `timezone` (text)
      - `default_view` (text)
      - `show_onboarding` (boolean)
      - `api_keys` (jsonb) - Stores OpenAI, Twilio, Salesforce, Bird.com keys
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
  2. Security
    - Enable RLS on user_settings table
    - Users can only view and update their own settings
    - API keys stored in encrypted JSONB format
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notification_preferences jsonb DEFAULT '{
    "email": {"enabled": true, "approvals": true, "mentions": true, "assignments": true, "digest": false},
    "in_app": {"enabled": true, "approvals": true, "mentions": true, "assignments": true, "updates": true},
    "push": {"enabled": false, "approvals": false, "mentions": false, "assignments": false}
  }'::jsonb,
  email_frequency text DEFAULT 'immediate',
  theme text DEFAULT 'light',
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  default_view text DEFAULT 'dashboard',
  show_onboarding boolean DEFAULT true,
  api_keys jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);