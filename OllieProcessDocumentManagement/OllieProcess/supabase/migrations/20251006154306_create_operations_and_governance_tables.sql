/*
  # Operations and Governance Tables

  1. New Tables
    - `improvements` - Continuous improvement initiatives (Kaizen)
    - `workflow_automations` - Automated workflow definitions
    - `process_maps` - Visual process mapping data
    - `analytics_reports` - Saved analytics and reports
    - `dashboards` - Custom executive dashboards
    - `policies` - Policy management
    - `compliance_requirements` - Compliance tracking
    - `audit_logs` - System audit trails
    - `teams` - Team management
    - `capacity_plans` - Capacity planning
    - `budgets` - Budget tracking details
    - `time_entries` - Time tracking
    - `transition_projects` - Various transition projects

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

-- Improvements (Kaizen)
CREATE TABLE IF NOT EXISTS improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  priority text NOT NULL DEFAULT 'medium',
  submitted_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  estimated_savings numeric,
  actual_savings numeric,
  implementation_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view improvements"
  ON improvements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage improvements"
  ON improvements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workflow Automations
CREATE TABLE IF NOT EXISTS workflow_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_config jsonb,
  actions jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  is_active boolean DEFAULT false,
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  created_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflow automations"
  ON workflow_automations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage workflow automations"
  ON workflow_automations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Process Maps
CREATE TABLE IF NOT EXISTS process_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  map_type text NOT NULL,
  diagram_data jsonb NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE process_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view process maps"
  ON process_maps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage process maps"
  ON process_maps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Analytics Reports
CREATE TABLE IF NOT EXISTS analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type text NOT NULL,
  query_config jsonb NOT NULL,
  visualization_config jsonb,
  schedule text,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view public reports"
  ON analytics_reports FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their own reports"
  ON analytics_reports FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  layout jsonb NOT NULL,
  widgets jsonb NOT NULL,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view public dashboards"
  ON dashboards FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their own dashboards"
  ON dashboards FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft',
  effective_date date,
  review_date date,
  owner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view policies"
  ON policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage policies"
  ON policies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Compliance Requirements
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  regulation text NOT NULL,
  requirement_level text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  responsible_party uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  evidence_url text,
  last_assessment_date date,
  next_assessment_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view compliance requirements"
  ON compliance_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage compliance requirements"
  ON compliance_requirements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department text,
  manager_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Team Members Junction Table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  role text,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Capacity Plans
CREATE TABLE IF NOT EXISTS capacity_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_capacity_hours numeric NOT NULL,
  allocated_hours numeric DEFAULT 0,
  available_hours numeric,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE capacity_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view capacity plans"
  ON capacity_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage capacity plans"
  ON capacity_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  allocated_amount numeric NOT NULL,
  spent_amount numeric DEFAULT 0,
  remaining_amount numeric,
  fiscal_year text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_description text NOT NULL,
  hours numeric NOT NULL,
  entry_date date NOT NULL,
  billable boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users_profile
    WHERE users_profile.id = auth.uid()
    AND users_profile.role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can manage own time entries"
  ON time_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transition Projects
CREATE TABLE IF NOT EXISTS transition_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning',
  priority text NOT NULL DEFAULT 'medium',
  start_date date,
  end_date date,
  current_state text,
  target_state text,
  transition_plan text,
  owner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transition_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transition projects"
  ON transition_projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage transition projects"
  ON transition_projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);