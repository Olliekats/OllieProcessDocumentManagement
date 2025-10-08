/*
  # Create Approval Matrix and User Settings System

  ## Overview
  This migration creates a comprehensive approval matrix system and user settings/preferences management.

  ## 1. New Tables

  ### approval_matrix
  Defines approval rules based on entity type, amount thresholds, and roles.
  - `id` (uuid, primary key)
  - `entity_type` (text) - What needs approval (sop, process, document, etc)
  - `approval_level` (integer) - Level 1, 2, 3 for escalation
  - `role_required` (text) - Role that can approve (manager, director, admin)
  - `amount_min` (numeric) - Minimum threshold amount (null if not amount-based)
  - `amount_max` (numeric) - Maximum threshold amount
  - `requires_all` (boolean) - If true, all approvers at this level must approve
  - `auto_escalate_hours` (integer) - Hours before auto-escalation
  - `active` (boolean) - Whether this rule is active

  ### approval_assignments
  Assigns specific users to approval roles/levels.
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User who can approve
  - `approval_role` (text) - Their approval role (manager, director, etc)
  - `entity_types` (text[]) - What entity types they can approve
  - `max_amount` (numeric) - Maximum amount they can approve
  - `active` (boolean)

  ### user_settings
  Stores individual user preferences and settings.
  - `user_id` (uuid, primary key)
  - `notification_preferences` (jsonb) - Email, in-app, SMS preferences
  - `email_frequency` (text) - immediate, daily_digest, weekly_digest
  - `theme` (text) - light, dark, auto
  - `language` (text)
  - `timezone` (text)
  - `dashboard_layout` (jsonb) - Custom dashboard preferences
  - `default_view` (text) - Default module on login

  ### notification_log
  Tracks all notifications sent (for auditing and delivery confirmation).
  - `id` (uuid, primary key)
  - `notification_id` (uuid) - References notifications table
  - `user_id` (uuid)
  - `delivery_method` (text) - email, in_app, sms
  - `status` (text) - sent, delivered, failed, bounced
  - `sent_at` (timestamptz)
  - `delivered_at` (timestamptz)
  - `error_message` (text)

  ## 2. Security
  - Enable RLS on all tables
  - Appropriate policies for each table
*/

-- Create approval_matrix table
CREATE TABLE IF NOT EXISTS approval_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('sop', 'process', 'document', 'change', 'expense', 'timeoff', 'workflow')),
  approval_level integer NOT NULL CHECK (approval_level > 0 AND approval_level <= 5),
  role_required text NOT NULL,
  amount_min numeric,
  amount_max numeric,
  requires_all boolean DEFAULT false,
  auto_escalate_hours integer DEFAULT 24,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE approval_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view approval matrix"
  ON approval_matrix FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage approval matrix"
  ON approval_matrix FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create approval_assignments table
CREATE TABLE IF NOT EXISTS approval_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  approval_role text NOT NULL,
  entity_types text[] NOT NULL DEFAULT '{}',
  max_amount numeric,
  department text,
  active boolean DEFAULT true,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE approval_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments"
  ON approval_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "All users can view who can approve"
  ON approval_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage assignments"
  ON approval_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update assignments"
  ON approval_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_preferences jsonb DEFAULT '{
    "email": {"enabled": true, "approvals": true, "mentions": true, "assignments": true, "digest": false},
    "in_app": {"enabled": true, "approvals": true, "mentions": true, "assignments": true, "updates": true},
    "push": {"enabled": false, "approvals": false, "mentions": false, "assignments": false}
  }'::jsonb,
  email_frequency text DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily_digest', 'weekly_digest', 'never')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  dashboard_layout jsonb DEFAULT '{}'::jsonb,
  default_view text DEFAULT 'dashboard',
  show_onboarding boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create notification_log table
CREATE TABLE IF NOT EXISTS notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES notifications(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('email', 'in_app', 'sms', 'push')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at timestamptz,
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs"
  ON notification_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notification logs"
  ON notification_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_matrix_entity_type ON approval_matrix(entity_type) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_approval_assignments_user_id ON approval_assignments(user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_notification_id ON notification_log(notification_id);

-- Insert default approval matrix rules
INSERT INTO approval_matrix (entity_type, approval_level, role_required, amount_min, amount_max, requires_all, auto_escalate_hours) VALUES
  ('sop', 1, 'manager', NULL, NULL, false, 48),
  ('sop', 2, 'director', NULL, NULL, false, 72),
  ('process', 1, 'manager', NULL, NULL, false, 24),
  ('document', 1, 'manager', NULL, NULL, false, 48),
  ('change', 1, 'manager', NULL, NULL, false, 24),
  ('change', 2, 'director', NULL, NULL, true, 48),
  ('expense', 1, 'manager', 0, 5000, false, 24),
  ('expense', 2, 'director', 5000, 50000, false, 48),
  ('expense', 3, 'admin', 50000, NULL, true, 72),
  ('timeoff', 1, 'manager', NULL, NULL, false, 24)
ON CONFLICT DO NOTHING;

-- Create function to auto-create user settings on user creation
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Trigger would be created on auth.users but we don't have direct access
-- Users will get default settings on first access or we can create via app logic
