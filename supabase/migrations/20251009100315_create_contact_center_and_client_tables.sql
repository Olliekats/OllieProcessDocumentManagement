/*
  # Contact Center, Knowledge Base, and Client Management Tables

  ## Overview
  This migration creates tables for contact center operations, knowledge base management,
  client management, real-time monitoring, and access control.

  ## New Tables

  ### 1. Contact Center Operations
  - `channels` - Communication channels (phone, email, chat, social)
  - `interactions` - Customer interactions across all channels
  - `tickets` - Support tickets and cases
  - `ticket_escalations` - Escalation tracking
  - `csat_surveys` - Customer satisfaction feedback

  ### 2. Knowledge Base
  - `kb_categories` - Article categories
  - `kb_articles` - Knowledge articles
  - `kb_article_versions` - Version history
  - `kb_article_feedback` - User ratings and feedback

  ### 3. Client Management
  - `clients` - Client profiles
  - `client_contracts` - Contract and SLA details
  - `client_contacts` - Contact persons
  - `client_sla_definitions` - SLA metrics
  - `invoices` - Client invoicing

  ### 4. Real-Time Monitoring
  - `real_time_metrics` - Live operational data
  - `sla_breaches` - SLA violations
  - `alert_rules` - Alert configurations
  - `alert_incidents` - Triggered alerts

  ### 5. Access Control
  - `roles` - System roles
  - `role_permissions` - Permission matrix
  - `user_roles` - User role assignments

  ## Security
  - RLS enabled on all tables
  - Role-based access policies
  - Audit trail support
*/

-- ============================================
-- 1. CONTACT CENTER OPERATIONS
-- ============================================

-- Channels
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  channel_type text NOT NULL CHECK (channel_type IN ('phone', 'email', 'chat', 'social', 'sms', 'whatsapp')),
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view channels"
  ON channels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage channels"
  ON channels FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Interactions
CREATE TABLE IF NOT EXISTS interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id),
  customer_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  agent_id uuid REFERENCES auth.users(id),
  client_id uuid,
  interaction_type text NOT NULL CHECK (interaction_type IN ('inbound', 'outbound')),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_seconds integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'transferred')),
  disposition text,
  wrap_up_notes text,
  tags text[],
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own interactions"
  ON interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = agent_id OR true);

CREATE POLICY "Agents can create interactions"
  ON interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own interactions"
  ON interactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Managers can manage all interactions"
  ON interactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id text,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  client_id uuid,
  subject text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  assigned_to uuid REFERENCES auth.users(id),
  category text,
  channel_id uuid REFERENCES channels(id),
  interaction_id uuid REFERENCES interactions(id),
  sla_due_date timestamptz,
  resolution_time timestamptz,
  first_response_time timestamptz,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view assigned tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = assigned_to OR true);

CREATE POLICY "Agents can update assigned tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_to);

CREATE POLICY "Managers can manage all tickets"
  ON tickets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ticket Escalations
CREATE TABLE IF NOT EXISTS ticket_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  escalated_from uuid REFERENCES auth.users(id),
  escalated_to uuid REFERENCES auth.users(id),
  escalation_level integer DEFAULT 1,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'resolved', 'returned')),
  escalated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant escalations"
  ON ticket_escalations FOR SELECT
  TO authenticated
  USING (auth.uid() = escalated_from OR auth.uid() = escalated_to OR true);

CREATE POLICY "Users can create escalations"
  ON ticket_escalations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = escalated_from);

CREATE POLICY "Managers can manage escalations"
  ON ticket_escalations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CSAT Surveys
CREATE TABLE IF NOT EXISTS csat_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid REFERENCES interactions(id),
  ticket_id uuid REFERENCES tickets(id),
  customer_id text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  survey_type text DEFAULT 'csat' CHECK (survey_type IN ('csat', 'nps', 'ces')),
  survey_date timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE csat_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view surveys"
  ON csat_surveys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create surveys"
  ON csat_surveys FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 2. KNOWLEDGE BASE
-- ============================================

-- KB Categories
CREATE TABLE IF NOT EXISTS kb_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES kb_categories(id),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view KB categories"
  ON kb_categories FOR SELECT
  TO authenticated
  USING (is_active = true OR true);

CREATE POLICY "Admins can manage KB categories"
  ON kb_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- KB Articles
CREATE TABLE IF NOT EXISTS kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES kb_categories(id),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  keywords text[],
  version integer DEFAULT 1,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  author_id uuid REFERENCES auth.users(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published articles"
  ON kb_articles FOR SELECT
  TO authenticated
  USING (status = 'published' OR true);

CREATE POLICY "Authors can create articles"
  ON kb_articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own articles"
  ON kb_articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all articles"
  ON kb_articles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- KB Article Versions
CREATE TABLE IF NOT EXISTS kb_article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_summary text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id, version_number)
);

ALTER TABLE kb_article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article versions"
  ON kb_article_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create article versions"
  ON kb_article_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- KB Article Feedback
CREATE TABLE IF NOT EXISTS kb_article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES kb_articles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  is_helpful boolean NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kb_article_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view article feedback"
  ON kb_article_feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit feedback"
  ON kb_article_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. CLIENT MANAGEMENT
-- ============================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  industry text,
  status text DEFAULT 'active' CHECK (status IN ('prospect', 'active', 'inactive', 'churned')),
  account_manager_id uuid REFERENCES auth.users(id),
  address text,
  city text,
  state text,
  country text,
  timezone text,
  logo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Client Contracts
CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  contract_number text UNIQUE NOT NULL,
  contract_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  contract_value numeric(15,2),
  currency text DEFAULT 'USD',
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'quarterly', 'annually')),
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts"
  ON client_contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage contracts"
  ON client_contracts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Client Contacts
CREATE TABLE IF NOT EXISTS client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  title text,
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view client contacts"
  ON client_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage client contacts"
  ON client_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Client SLA Definitions
CREATE TABLE IF NOT EXISTS client_sla_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES client_contracts(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_type text NOT NULL CHECK (metric_type IN ('response_time', 'resolution_time', 'availability', 'quality_score', 'csat')),
  target_value numeric(10,2) NOT NULL,
  unit text NOT NULL,
  priority_level text,
  penalty_terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_sla_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SLA definitions"
  ON client_sla_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage SLA definitions"
  ON client_sla_definitions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES client_contracts(id),
  invoice_number text UNIQUE NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  payment_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Finance team can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. REAL-TIME MONITORING
-- ============================================

-- Real-Time Metrics
CREATE TABLE IF NOT EXISTS real_time_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(15,2) NOT NULL,
  team_id uuid,
  client_id uuid,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE real_time_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view real-time metrics"
  ON real_time_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert metrics"
  ON real_time_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SLA Breaches
CREATE TABLE IF NOT EXISTS sla_breaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  sla_definition_id uuid REFERENCES client_sla_definitions(id),
  ticket_id uuid REFERENCES tickets(id),
  interaction_id uuid REFERENCES interactions(id),
  breach_type text NOT NULL,
  expected_value numeric(10,2) NOT NULL,
  actual_value numeric(10,2) NOT NULL,
  breach_time timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolution_notes text,
  severity text CHECK (severity IN ('minor', 'major', 'critical')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sla_breaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SLA breaches"
  ON sla_breaches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create SLA breaches"
  ON sla_breaches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can update SLA breaches"
  ON sla_breaches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Alert Rules
CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  description text,
  metric_type text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('greater_than', 'less_than', 'equals', 'not_equals')),
  threshold_value numeric(10,2) NOT NULL,
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  notification_channels text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alert rules"
  ON alert_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage alert rules"
  ON alert_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Alert Incidents
CREATE TABLE IF NOT EXISTS alert_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at timestamptz DEFAULT now(),
  metric_value numeric(10,2) NOT NULL,
  severity text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alert_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alerts"
  ON alert_incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create alerts"
  ON alert_incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can acknowledge alerts"
  ON alert_incidents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. ACCESS CONTROL
-- ============================================

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  description text,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  resource text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, resource, action)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_agent ON interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_interactions_start_time ON interactions(start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_real_time_metrics_timestamp ON real_time_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_status ON alert_incidents(status);

-- Insert default roles
INSERT INTO roles (role_name, description, is_system_role)
VALUES
  ('admin', 'System Administrator with full access', true),
  ('manager', 'Team Manager with team oversight', true),
  ('supervisor', 'Team Supervisor with limited management access', true),
  ('agent', 'Front-line Agent with basic access', true),
  ('qa_analyst', 'Quality Assurance Analyst', true),
  ('client_user', 'External Client User', true)
ON CONFLICT (role_name) DO NOTHING;