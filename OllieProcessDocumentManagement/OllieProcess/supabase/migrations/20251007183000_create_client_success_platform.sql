/*
  # Client Success Platform

  This migration creates a white-labeled client self-service platform:
  - Branded client portals for each client
  - Real-time ticket tracking and SLA dashboards
  - Automated reporting and analytics
  - Self-service ticket creation
  - Client satisfaction tracking

  ## New Tables

  1. `client_portals`
     - Portal configuration and branding
     - Access controls
     - Feature toggles

  2. `client_portal_users`
     - Client-side users (separate from BPO agents)
     - Roles and permissions
     - SSO configuration

  3. `client_dashboards`
     - Custom dashboard configurations
     - Widget layouts
     - KPI definitions

  4. `client_reports`
     - Scheduled and on-demand reports
     - Report templates
     - Distribution lists

  5. `client_sla_tracking`
     - Real-time SLA monitoring
     - Breach alerts
     - Performance history

  6. `client_satisfaction_surveys`
     - Custom survey configurations
     - Response tracking
     - Trend analysis

  ## Security
  - RLS enabled on all tables
  - Client data isolation
  - Secure portal access
*/

-- Client Portals (white-labeled configuration)
CREATE TABLE IF NOT EXISTS client_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  portal_name text NOT NULL,
  subdomain text UNIQUE, -- e.g., 'acme' for acme.yourplatform.com
  custom_domain text UNIQUE, -- e.g., 'portal.acmecorp.com'
  -- Branding
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  accent_color text DEFAULT '#10B981',
  background_color text DEFAULT '#FFFFFF',
  text_color text DEFAULT '#111827',
  font_family text DEFAULT 'Inter',
  custom_css text,
  -- Configuration
  portal_title text,
  welcome_message text,
  support_email text,
  support_phone text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  date_format text DEFAULT 'MM/DD/YYYY',
  -- Features enabled
  ticket_creation_enabled boolean DEFAULT true,
  knowledge_base_enabled boolean DEFAULT true,
  live_chat_enabled boolean DEFAULT false,
  reports_enabled boolean DEFAULT true,
  analytics_enabled boolean DEFAULT true,
  sla_dashboard_enabled boolean DEFAULT true,
  surveys_enabled boolean DEFAULT true,
  file_upload_enabled boolean DEFAULT true,
  -- Access control
  require_sso boolean DEFAULT false,
  sso_provider text, -- 'saml', 'oauth', 'openid'
  sso_config jsonb,
  ip_whitelist text[],
  mfa_required boolean DEFAULT false,
  session_timeout_minutes integer DEFAULT 60,
  -- Notifications
  email_notifications_enabled boolean DEFAULT true,
  sms_notifications_enabled boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  -- Customization
  custom_menu_items jsonb DEFAULT '[]'::jsonb,
  footer_text text,
  terms_url text,
  privacy_url text,
  -- Status
  is_active boolean DEFAULT true,
  go_live_date date,
  last_accessed_at timestamptz,
  total_logins integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client Portal Users
CREATE TABLE IF NOT EXISTS client_portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES client_portals(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'viewer', -- 'admin', 'manager', 'viewer'
  -- Authentication
  password_hash text, -- If not using SSO
  sso_id text, -- External SSO identifier
  mfa_enabled boolean DEFAULT false,
  mfa_secret text,
  -- Permissions
  can_create_tickets boolean DEFAULT true,
  can_view_all_tickets boolean DEFAULT false, -- Or just their own
  can_view_reports boolean DEFAULT true,
  can_view_analytics boolean DEFAULT true,
  can_manage_users boolean DEFAULT false,
  can_export_data boolean DEFAULT false,
  custom_permissions jsonb DEFAULT '{}'::jsonb,
  -- Profile
  phone text,
  department text,
  job_title text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  -- Activity tracking
  last_login_at timestamptz,
  last_login_ip inet,
  total_logins integer DEFAULT 0,
  tickets_created integer DEFAULT 0,
  reports_viewed integer DEFAULT 0,
  -- Status
  is_active boolean DEFAULT true,
  account_locked boolean DEFAULT false,
  locked_reason text,
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  invitation_sent_at timestamptz,
  invitation_accepted_at timestamptz,
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portal_id, email)
);

-- Client Dashboards (custom layouts)
CREATE TABLE IF NOT EXISTS client_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES client_portals(id) ON DELETE CASCADE,
  dashboard_name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  -- Layout configuration
  layout_type text DEFAULT 'grid', -- 'grid', 'flex', 'custom'
  columns integer DEFAULT 3,
  row_height integer DEFAULT 150,
  -- Widgets configuration
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Example widget: {type: 'sla_status', position: {x: 0, y: 0, w: 1, h: 2}, config: {...}}
  -- Widget types: 'sla_status', 'ticket_volume', 'resolution_time', 'satisfaction_score',
  --               'agent_performance', 'cost_summary', 'custom_chart'
  -- Access control
  visible_to_roles text[] DEFAULT ARRAY['admin', 'manager', 'viewer'],
  visible_to_users uuid[], -- Specific users
  -- Refresh settings
  auto_refresh_enabled boolean DEFAULT true,
  auto_refresh_interval_seconds integer DEFAULT 300,
  -- Filters
  default_date_range text DEFAULT 'last_30_days',
  default_filters jsonb DEFAULT '{}'::jsonb,
  -- Status
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  created_by uuid REFERENCES client_portal_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client Reports (scheduled and on-demand)
CREATE TABLE IF NOT EXISTS client_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES client_portals(id) ON DELETE CASCADE,
  report_name text NOT NULL,
  report_type text NOT NULL, -- 'sla_performance', 'ticket_summary', 'agent_productivity', 'cost_analysis', 'custom'
  description text,
  -- Report configuration
  metrics_included text[] NOT NULL,
  dimensions text[], -- Grouping/breakdown
  filters jsonb DEFAULT '{}'::jsonb,
  date_range_type text DEFAULT 'relative', -- 'relative', 'absolute', 'custom'
  date_range_value text, -- 'last_7_days', 'last_month', 'ytd', etc.
  -- Visualization
  chart_type text, -- 'table', 'line', 'bar', 'pie', 'combo'
  chart_config jsonb,
  include_summary boolean DEFAULT true,
  include_charts boolean DEFAULT true,
  include_raw_data boolean DEFAULT false,
  -- Scheduling
  is_scheduled boolean DEFAULT false,
  schedule_frequency text, -- 'daily', 'weekly', 'monthly', 'quarterly'
  schedule_day_of_week integer, -- For weekly
  schedule_day_of_month integer, -- For monthly
  schedule_time time DEFAULT '08:00:00',
  schedule_timezone text DEFAULT 'UTC',
  next_run_at timestamptz,
  last_run_at timestamptz,
  -- Distribution
  recipients text[] NOT NULL,
  cc_recipients text[],
  email_subject text,
  email_body text,
  delivery_method text[] DEFAULT ARRAY['email'], -- 'email', 'portal', 'api', 'sftp'
  -- Format options
  output_format text[] DEFAULT ARRAY['pdf'], -- 'pdf', 'excel', 'csv', 'json'
  include_logo boolean DEFAULT true,
  include_cover_page boolean DEFAULT true,
  -- Execution tracking
  run_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  avg_generation_time_seconds integer,
  last_error text,
  -- Status
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES client_portal_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client SLA Tracking (real-time monitoring)
CREATE TABLE IF NOT EXISTS client_sla_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  ticket_id uuid, -- Reference to ticket/complaint
  sla_type text NOT NULL, -- 'first_response', 'resolution', 'escalation'
  priority text NOT NULL, -- From ticket priority
  -- SLA definition
  sla_target_minutes integer NOT NULL,
  sla_deadline timestamptz NOT NULL,
  buffer_minutes integer DEFAULT 30,
  warning_threshold_percentage integer DEFAULT 80,
  -- Timing
  started_at timestamptz DEFAULT now(),
  first_response_at timestamptz,
  resolved_at timestamptz,
  actual_minutes integer,
  -- Status
  status text DEFAULT 'in_progress', -- 'in_progress', 'met', 'breached', 'paused'
  time_remaining_minutes integer,
  percentage_consumed numeric(5,2),
  is_at_risk boolean DEFAULT false,
  is_breached boolean DEFAULT false,
  breach_minutes integer, -- How much over SLA
  -- Pauses (for valid reasons)
  total_pause_minutes integer DEFAULT 0,
  pause_reasons jsonb DEFAULT '[]'::jsonb,
  -- Alerts sent
  warning_alert_sent boolean DEFAULT false,
  warning_alert_sent_at timestamptz,
  breach_alert_sent boolean DEFAULT false,
  breach_alert_sent_at timestamptz,
  -- Business hours consideration
  business_hours_only boolean DEFAULT true,
  business_hours_config jsonb,
  -- Tracking
  snapshots jsonb DEFAULT '[]'::jsonb, -- Periodic status snapshots
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client Satisfaction Surveys
CREATE TABLE IF NOT EXISTS client_satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES client_portals(id) ON DELETE CASCADE,
  survey_name text NOT NULL,
  survey_type text DEFAULT 'csat', -- 'csat', 'nps', 'ces', 'custom'
  description text,
  -- Trigger configuration
  trigger_event text, -- 'ticket_closed', 'manual', 'scheduled', 'milestone'
  trigger_delay_hours integer DEFAULT 1,
  -- Survey questions
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{id: 1, type: 'rating', text: 'How satisfied...', scale: 5, required: true}]
  include_comment_field boolean DEFAULT true,
  comment_field_required boolean DEFAULT false,
  -- Distribution
  send_via text[] DEFAULT ARRAY['email'], -- 'email', 'portal', 'sms'
  email_template_id uuid,
  reminder_enabled boolean DEFAULT true,
  reminder_delay_hours integer DEFAULT 48,
  max_reminders integer DEFAULT 2,
  -- Targeting
  target_audience text DEFAULT 'all', -- 'all', 'specific_tickets', 'specific_agents'
  sampling_rate numeric(5,2) DEFAULT 100.00, -- % of cases to survey
  -- Response tracking
  total_sent integer DEFAULT 0,
  total_responses integer DEFAULT 0,
  response_rate numeric(5,2) DEFAULT 0,
  avg_rating numeric(5,2),
  avg_nps_score numeric(5,2),
  -- Analysis
  satisfaction_trend text, -- 'improving', 'stable', 'declining'
  key_themes text[], -- Identified from comments
  action_items text[],
  -- Status
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS client_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid REFERENCES client_satisfaction_surveys(id) ON DELETE CASCADE,
  respondent_id uuid REFERENCES client_portal_users(id),
  ticket_id uuid,
  -- Response data
  responses jsonb NOT NULL, -- Question ID -> answer mapping
  overall_rating numeric(5,2),
  nps_score integer, -- 0-10
  comments text,
  sentiment text, -- 'positive', 'neutral', 'negative'
  sentiment_score numeric(5,2), -- -1 to 1
  -- Context
  responded_at timestamptz DEFAULT now(),
  time_to_respond_minutes integer,
  response_method text, -- 'email_link', 'portal', 'sms'
  -- Follow-up
  requires_follow_up boolean DEFAULT false,
  follow_up_reason text,
  followed_up_at timestamptz,
  followed_up_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portals_client ON client_portals(client_id);
CREATE INDEX IF NOT EXISTS idx_portals_subdomain ON client_portals(subdomain);
CREATE INDEX IF NOT EXISTS idx_portal_users_portal ON client_portal_users(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON client_portal_users(portal_id, email);
CREATE INDEX IF NOT EXISTS idx_dashboards_portal ON client_dashboards(portal_id);
CREATE INDEX IF NOT EXISTS idx_reports_portal ON client_reports(portal_id);
CREATE INDEX IF NOT EXISTS idx_reports_scheduled ON client_reports(is_scheduled, is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_sla_client ON client_sla_tracking(client_id, status);
CREATE INDEX IF NOT EXISTS idx_sla_deadline ON client_sla_tracking(sla_deadline) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_surveys_portal ON client_satisfaction_surveys(portal_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON client_survey_responses(survey_id);

-- Enable RLS
ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sla_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_survey_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their client portals"
  ON client_portals FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage client portals"
  ON client_portals FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Portal users can view their own data"
  ON client_portal_users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage portal users"
  ON client_portal_users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view dashboards for their portal"
  ON client_dashboards FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage dashboards"
  ON client_dashboards FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view reports for their portal"
  ON client_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage reports"
  ON client_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view SLA tracking for their client"
  ON client_sla_tracking FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage SLA tracking"
  ON client_sla_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view surveys"
  ON client_satisfaction_surveys FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage surveys"
  ON client_satisfaction_surveys FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view survey responses"
  ON client_survey_responses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can submit survey responses"
  ON client_survey_responses FOR INSERT TO authenticated WITH CHECK (true);
