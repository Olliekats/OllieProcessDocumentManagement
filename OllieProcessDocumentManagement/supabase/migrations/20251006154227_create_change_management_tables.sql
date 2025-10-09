/*
  # Change Management Tables

  1. New Tables
    - `change_initiatives` - Change management initiatives
    - `stakeholders` - Stakeholder management
    - `communication_plans` - Communication strategies
    - `training_programs` - Training and adoption programs
    - `resistance_items` - Resistance tracking
    - `readiness_assessments` - Organizational readiness
    - `impact_analyses` - Change impact evaluations
    - `raci_matrix` - Responsibility assignments
    - `risks` - Risk analysis and mitigation

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

-- Change Initiatives
CREATE TABLE IF NOT EXISTS change_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  priority text NOT NULL DEFAULT 'medium',
  start_date date,
  end_date date,
  owner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  impact_level text,
  success_metrics text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE change_initiatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view change initiatives"
  ON change_initiatives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage change initiatives"
  ON change_initiatives FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Stakeholders
CREATE TABLE IF NOT EXISTS stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  department text,
  influence text NOT NULL,
  support_level text NOT NULL,
  engagement_strategy text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stakeholders"
  ON stakeholders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage stakeholders"
  ON stakeholders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Communication Plans
CREATE TABLE IF NOT EXISTS communication_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  title text NOT NULL,
  audience text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL,
  frequency text NOT NULL,
  responsible_party text,
  scheduled_date date,
  status text NOT NULL DEFAULT 'planned',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE communication_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view communication plans"
  ON communication_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage communication plans"
  ON communication_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Training Programs
CREATE TABLE IF NOT EXISTS training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_audience text NOT NULL,
  delivery_method text NOT NULL,
  duration_hours numeric,
  scheduled_date date,
  trainer text,
  status text NOT NULL DEFAULT 'planned',
  completion_rate numeric DEFAULT 0,
  materials_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view training programs"
  ON training_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage training programs"
  ON training_programs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Resistance Items
CREATE TABLE IF NOT EXISTS resistance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  source text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'identified',
  mitigation_strategy text,
  assigned_to uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  resolved_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resistance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view resistance items"
  ON resistance_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage resistance items"
  ON resistance_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Readiness Assessments
CREATE TABLE IF NOT EXISTS readiness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  assessment_name text NOT NULL,
  assessment_date date NOT NULL,
  area text NOT NULL,
  score numeric NOT NULL,
  max_score numeric NOT NULL DEFAULT 100,
  findings text,
  recommendations text,
  assessed_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE readiness_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view readiness assessments"
  ON readiness_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage readiness assessments"
  ON readiness_assessments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Impact Analyses
CREATE TABLE IF NOT EXISTS impact_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  area text NOT NULL,
  description text NOT NULL,
  impact_level text NOT NULL,
  affected_stakeholders text,
  mitigation_actions text,
  timeline text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE impact_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view impact analyses"
  ON impact_analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage impact analyses"
  ON impact_analyses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RACI Matrix
CREATE TABLE IF NOT EXISTS raci_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  responsible text,
  accountable text,
  consulted text,
  informed text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE raci_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view RACI matrix"
  ON raci_matrix FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage RACI matrix"
  ON raci_matrix FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Risks
CREATE TABLE IF NOT EXISTS risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  initiative_id uuid REFERENCES change_initiatives(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  probability text NOT NULL,
  impact text NOT NULL,
  risk_score numeric,
  status text NOT NULL DEFAULT 'identified',
  mitigation_plan text,
  owner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view risks"
  ON risks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage risks"
  ON risks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);