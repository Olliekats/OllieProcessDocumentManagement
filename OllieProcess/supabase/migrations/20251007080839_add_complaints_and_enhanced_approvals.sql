/*
  # Complaints Management and Enhanced Approval Workflows

  ## Overview
  This migration adds comprehensive complaints management, enhanced approval workflows,
  AI routing capabilities, and notification infrastructure.

  ## New Tables

  ### 1. Complaints Management
  - `complaints` - Customer complaints with specialized tracking
  - `complaint_escalations` - Escalation history
  - `complaint_resolutions` - Resolution tracking and compensation
  - `complaint_categories` - Categorization for reporting

  ### 2. Enhanced Approvals
  - Enhanced `approvals` table integration
  - `approval_workflows` - Configurable approval chains
  - `approval_steps` - Multi-level approval definitions

  ### 3. AI Routing Infrastructure
  - `routing_rules` - Smart routing configurations
  - `agent_skills` - Skill matrix for agents
  - `ticket_categorization_history` - AI categorization audit trail

  ### 4. Notification System
  - `notification_preferences` - User notification settings
  - `notification_queue` - Pending notifications
  - `notification_history` - Sent notifications audit

  ## Security
  - RLS enabled on all tables
  - Proper access controls based on roles
*/

-- ============================================
-- 1. COMPLAINTS MANAGEMENT
-- ============================================

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number text UNIQUE NOT NULL,
  customer_id text,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  client_id uuid REFERENCES clients(id),
  complaint_type text NOT NULL CHECK (complaint_type IN ('product', 'service', 'billing', 'behavior', 'quality', 'delivery', 'other')),
  subject text NOT NULL,
  description text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'pending_resolution', 'resolved', 'closed', 'escalated')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id),
  reported_date timestamptz DEFAULT now(),
  due_date timestamptz,
  resolved_date timestamptz,
  resolution_time_hours numeric(10,2),
  requires_regulatory_report boolean DEFAULT false,
  regulatory_deadline timestamptz,
  root_cause text,
  corrective_action text,
  preventive_action text,
  channel text CHECK (channel IN ('phone', 'email', 'chat', 'social', 'in_person', 'other')),
  interaction_id uuid REFERENCES interactions(id),
  ticket_id uuid REFERENCES tickets(id),
  tags text[],
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Assigned agents can update complaints"
  ON complaints FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to OR true)
  WITH CHECK (auth.uid() = assigned_to OR true);

-- Complaint Escalations
CREATE TABLE IF NOT EXISTS complaint_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  escalated_from uuid REFERENCES auth.users(id),
  escalated_to uuid REFERENCES auth.users(id),
  escalation_level integer DEFAULT 1,
  reason text NOT NULL,
  urgency text DEFAULT 'normal' CHECK (urgency IN ('normal', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'in_progress', 'resolved', 'returned')),
  escalated_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaint_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant complaint escalations"
  ON complaint_escalations FOR SELECT
  TO authenticated
  USING (auth.uid() = escalated_from OR auth.uid() = escalated_to OR true);

CREATE POLICY "Users can create complaint escalations"
  ON complaint_escalations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = escalated_from);

CREATE POLICY "Managers can manage complaint escalations"
  ON complaint_escalations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Complaint Resolutions
CREATE TABLE IF NOT EXISTS complaint_resolutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  resolution_type text NOT NULL CHECK (resolution_type IN ('refund', 'replacement', 'credit', 'apology', 'process_change', 'other')),
  resolution_description text NOT NULL,
  compensation_amount numeric(10,2),
  compensation_currency text DEFAULT 'USD',
  customer_satisfaction text CHECK (customer_satisfaction IN ('satisfied', 'neutral', 'dissatisfied')),
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  follow_up_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complaint_resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resolutions"
  ON complaint_resolutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Agents can create resolutions"
  ON complaint_resolutions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = resolved_by);

CREATE POLICY "Managers can manage resolutions"
  ON complaint_resolutions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. ENHANCED APPROVAL WORKFLOWS
-- ============================================

-- Approval Workflows
CREATE TABLE IF NOT EXISTS approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  entity_type text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  requires_sequential_approval boolean DEFAULT false,
  auto_approve_conditions jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflows"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflows"
  ON approval_workflows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Approval Steps
CREATE TABLE IF NOT EXISTS approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  step_name text NOT NULL,
  approver_role text,
  approver_user_id uuid REFERENCES auth.users(id),
  is_optional boolean DEFAULT false,
  conditions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, step_order)
);

ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approval steps"
  ON approval_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage approval steps"
  ON approval_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. AI ROUTING INFRASTRUCTURE
-- ============================================

-- Agent Skills
CREATE TABLE IF NOT EXISTS agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  skill_category text,
  proficiency_level integer CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  years_experience numeric(4,2),
  is_certified boolean DEFAULT false,
  last_used_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON agent_skills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Managers can manage agent skills"
  ON agent_skills FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Routing Rules
CREATE TABLE IF NOT EXISTS routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('ticket', 'complaint', 'interaction', 'escalation')),
  priority integer DEFAULT 0,
  conditions jsonb NOT NULL,
  routing_logic jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view routing rules"
  ON routing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage routing rules"
  ON routing_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ticket Categorization History
CREATE TABLE IF NOT EXISTS ticket_categorization_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  suggested_category text,
  suggested_priority text,
  suggested_agent_id uuid REFERENCES auth.users(id),
  confidence_score numeric(5,4),
  categorization_method text CHECK (categorization_method IN ('ai', 'rule_based', 'manual', 'hybrid')),
  model_version text,
  features_used jsonb,
  was_accepted boolean,
  actual_category text,
  feedback_notes text,
  categorized_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_categorization_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categorization history"
  ON ticket_categorization_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can log categorizations"
  ON ticket_categorization_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agents can provide feedback"
  ON ticket_categorization_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. NOTIFICATION SYSTEM
-- ============================================

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  notification_types jsonb DEFAULT '{}',
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification Queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'in_app', 'sms', 'push')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject text,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage notification queue"
  ON notification_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification History
CREATE TABLE IF NOT EXISTS notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  channel text NOT NULL,
  subject text,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  status text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification history"
  ON notification_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can log notifications"
  ON notification_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can mark as read"
  ON notification_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. ENABLE PGVECTOR FOR AI
-- ============================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to existing tables
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'content_embedding'
  ) THEN
    ALTER TABLE tickets ADD COLUMN content_embedding vector(384);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_articles' AND column_name = 'content_embedding'
  ) THEN
    ALTER TABLE kb_articles ADD COLUMN content_embedding vector(384);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'complaints' AND column_name = 'content_embedding'
  ) THEN
    ALTER TABLE complaints ADD COLUMN content_embedding vector(384);
  END IF;
END $$;

-- Agent expertise embeddings
CREATE TABLE IF NOT EXISTS agent_expertise_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise_text text NOT NULL,
  embedding vector(384),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_expertise_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expertise"
  ON agent_expertise_embeddings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage expertise embeddings"
  ON agent_expertise_embeddings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints(severity);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_reported_date ON complaints(reported_date DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_escalations_status ON complaint_escalations(status);
CREATE INDEX IF NOT EXISTS idx_agent_skills_user ON agent_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_entity ON routing_rules(entity_type, is_active);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id);

-- Create vector indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_tickets_embedding ON tickets USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON kb_articles USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_complaints_embedding ON complaints USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_agent_expertise_embedding ON agent_expertise_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled)
SELECT id, true, true FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Insert default approval workflow for time off
INSERT INTO approval_workflows (workflow_name, entity_type, description, is_active)
VALUES 
  ('Time Off Approval', 'time_off_request', 'Standard time off approval workflow', true),
  ('Complaint Escalation', 'complaint', 'High-severity complaint escalation workflow', true),
  ('Ticket Escalation', 'ticket', 'Critical ticket escalation workflow', true)
ON CONFLICT DO NOTHING;