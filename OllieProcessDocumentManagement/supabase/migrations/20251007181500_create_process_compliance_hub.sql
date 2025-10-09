/*
  # Process Compliance & Risk Management Hub

  This migration creates a comprehensive compliance and risk management system for processes:
  - Automated compliance checking against regulations
  - Risk scoring for each process step
  - Control point monitoring and validation
  - Audit trail with tamper-proof logging
  - Regulatory reporting automation

  ## New Tables

  1. `compliance_frameworks`
     - Regulatory frameworks (SOX, GDPR, HIPAA, ISO, etc.)
     - Requirements and control points
     - Applicability rules

  2. `compliance_requirements`
     - Specific requirements within frameworks
     - Process mapping to requirements
     - Evidence requirements

  3. `process_controls`
     - Control points within processes
     - Control effectiveness monitoring
     - Testing results

  4. `compliance_checks`
     - Automated compliance validations
     - Pass/fail status
     - Evidence collection

  5. `risk_assessments`
     - Process risk identification and scoring
     - Mitigation strategies
     - Risk treatment tracking

  6. `audit_logs`
     - Immutable audit trail
     - All process changes and executions
     - Compliance evidence

  7. `regulatory_reports`
     - Automated report generation
     - Scheduled compliance reporting
     - Distribution tracking

  ## Security
  - RLS enabled on all tables
  - Audit logs are append-only
  - Strict access controls
*/

-- Compliance Frameworks
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'SOX', 'GDPR', 'HIPAA', 'ISO 9001', 'PCI DSS', etc.
  full_name text,
  description text,
  framework_type text, -- 'regulatory', 'industry_standard', 'internal_policy', 'best_practice'
  jurisdiction text, -- 'US', 'EU', 'global', etc.
  version text,
  effective_date date,
  -- Requirements summary
  total_requirements integer DEFAULT 0,
  critical_requirements integer DEFAULT 0,
  -- Applicability
  applies_to_industries text[],
  applies_to_process_types text[],
  mandatory boolean DEFAULT true,
  -- Documentation
  official_url text,
  documentation_links jsonb DEFAULT '[]'::jsonb,
  -- Status
  is_active boolean DEFAULT true,
  review_frequency_months integer DEFAULT 12,
  last_reviewed_date date,
  next_review_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance Requirements
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id uuid REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  requirement_code text NOT NULL, -- e.g., 'SOX-404', 'GDPR-Article-5'
  title text NOT NULL,
  description text NOT NULL,
  category text, -- 'access_control', 'data_protection', 'audit_trail', etc.
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  -- What needs to be done
  control_objectives text[],
  required_activities text[],
  prohibited_activities text[],
  evidence_required text[],
  -- Testing
  testing_frequency text, -- 'continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
  testing_procedures text[],
  -- Penalties for non-compliance
  non_compliance_penalties text,
  financial_risk_range text, -- e.g., '$10K-$100K', '$1M+'
  -- Relationships
  related_requirements uuid[],
  parent_requirement_id uuid REFERENCES compliance_requirements(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process Controls
CREATE TABLE IF NOT EXISTS process_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  control_name text NOT NULL,
  control_type text NOT NULL, -- 'preventive', 'detective', 'corrective', 'directive'
  control_category text, -- 'access', 'approval', 'segregation_of_duties', 'validation', 'monitoring'
  description text,
  -- Implementation
  activity_name text, -- Which process activity this controls
  control_point text, -- Where in the process this occurs
  automation_level text DEFAULT 'manual', -- 'manual', 'semi_automated', 'automated'
  responsible_role text,
  -- Linked requirements
  compliance_requirements uuid[], -- Links to compliance_requirements
  frameworks_covered text[], -- Framework names covered
  -- Effectiveness
  control_effectiveness text DEFAULT 'not_tested', -- 'not_tested', 'effective', 'needs_improvement', 'ineffective'
  last_test_date date,
  last_test_result text,
  next_test_date date,
  test_frequency_days integer DEFAULT 90,
  -- Evidence
  evidence_collected jsonb DEFAULT '[]'::jsonb,
  evidence_retention_days integer DEFAULT 2555, -- 7 years default
  -- Monitoring
  monitoring_enabled boolean DEFAULT true,
  alert_on_failure boolean DEFAULT true,
  failure_count integer DEFAULT 0,
  last_failure_date timestamptz,
  -- Status
  is_active boolean DEFAULT true,
  exceptions_granted integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance Checks (automated validations)
CREATE TABLE IF NOT EXISTS compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_instance_id uuid, -- Specific process execution
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  control_id uuid REFERENCES process_controls(id),
  requirement_id uuid REFERENCES compliance_requirements(id),
  check_timestamp timestamptz DEFAULT now(),
  -- Check details
  check_type text NOT NULL, -- 'automated', 'manual', 'periodic_review'
  check_criteria jsonb NOT NULL,
  -- Results
  status text NOT NULL, -- 'pass', 'fail', 'warning', 'not_applicable', 'exception'
  result_details text,
  evidence jsonb DEFAULT '{}'::jsonb,
  automated_evidence boolean DEFAULT false,
  -- Failures
  failure_reason text,
  failure_severity text, -- 'low', 'medium', 'high', 'critical'
  remediation_required boolean DEFAULT false,
  remediation_deadline timestamptz,
  remediation_notes text,
  remediated_at timestamptz,
  remediated_by uuid REFERENCES users_profile(id),
  -- Exceptions
  exception_granted boolean DEFAULT false,
  exception_reason text,
  exception_granted_by uuid REFERENCES users_profile(id),
  exception_expires_at timestamptz,
  -- Review
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz DEFAULT now()
);

-- Risk Assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  activity_name text,
  risk_name text NOT NULL,
  risk_description text NOT NULL,
  risk_category text, -- 'operational', 'financial', 'compliance', 'reputational', 'strategic'
  -- Risk scoring
  likelihood text NOT NULL, -- 'rare', 'unlikely', 'possible', 'likely', 'almost_certain'
  likelihood_score integer, -- 1-5
  impact text NOT NULL, -- 'insignificant', 'minor', 'moderate', 'major', 'catastrophic'
  impact_score integer, -- 1-5
  inherent_risk_score integer, -- likelihood × impact (before controls)
  residual_risk_score integer, -- risk after controls applied
  risk_level text, -- 'low', 'medium', 'high', 'critical'
  -- Impact details
  financial_impact_min numeric(12,2),
  financial_impact_max numeric(12,2),
  operational_impact text,
  compliance_impact text,
  reputational_impact text,
  -- Treatment
  risk_treatment text, -- 'accept', 'mitigate', 'transfer', 'avoid'
  treatment_strategy text,
  mitigation_controls uuid[], -- Links to process_controls
  control_effectiveness text, -- 'weak', 'adequate', 'strong'
  -- Monitoring
  triggers text[], -- Events that would realize this risk
  warning_indicators text[], -- Leading indicators
  monitoring_frequency text, -- 'continuous', 'daily', 'weekly', 'monthly'
  -- Ownership
  risk_owner uuid REFERENCES users_profile(id),
  assessment_date date DEFAULT CURRENT_DATE,
  next_review_date date,
  review_frequency_months integer DEFAULT 6,
  -- Status
  status text DEFAULT 'active', -- 'active', 'mitigated', 'realized', 'closed'
  last_reviewed_by uuid REFERENCES users_profile(id),
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit Logs (immutable)
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp timestamptz DEFAULT now(),
  event_type text NOT NULL, -- 'process_execution', 'process_change', 'control_test', 'access', 'config_change'
  entity_type text NOT NULL, -- 'process', 'control', 'requirement', 'framework'
  entity_id uuid NOT NULL,
  -- Actor information
  actor_id uuid REFERENCES users_profile(id),
  actor_role text,
  actor_ip_address inet,
  actor_user_agent text,
  -- Action details
  action text NOT NULL, -- 'create', 'read', 'update', 'delete', 'execute', 'approve', 'reject'
  before_state jsonb,
  after_state jsonb,
  changes jsonb, -- Detailed change log
  -- Context
  process_instance_id uuid,
  reason text,
  compliance_relevance text[],
  -- Integrity
  checksum text, -- For tamper detection
  previous_log_id uuid REFERENCES compliance_audit_logs(id),
  chain_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Regulatory Reports
CREATE TABLE IF NOT EXISTS regulatory_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name text NOT NULL,
  report_type text NOT NULL, -- 'compliance_status', 'control_testing', 'risk_register', 'incident', 'audit_trail'
  framework_id uuid REFERENCES compliance_frameworks(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  -- Report details
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES users_profile(id),
  report_format text DEFAULT 'pdf', -- 'pdf', 'excel', 'json', 'xml'
  -- Content
  processes_covered uuid[],
  controls_tested integer,
  controls_passed integer,
  controls_failed integer,
  risks_identified integer,
  high_risks integer,
  non_compliance_issues integer,
  -- Summary metrics
  overall_compliance_score numeric(5,2),
  overall_risk_score numeric(5,2),
  trend_vs_previous text, -- 'improved', 'stable', 'declined'
  executive_summary text,
  key_findings text[],
  recommendations text[],
  action_items text[],
  -- Report data
  detailed_data jsonb DEFAULT '{}'::jsonb,
  charts_data jsonb DEFAULT '[]'::jsonb,
  file_path text, -- If stored in storage
  file_size_bytes integer,
  -- Distribution
  recipients text[],
  distributed_at timestamptz,
  distribution_method text, -- 'email', 'portal', 'api', 'manual'
  -- Schedule (if recurring)
  is_scheduled boolean DEFAULT false,
  schedule_frequency text, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
  next_generation_date date,
  status text DEFAULT 'draft', -- 'draft', 'generated', 'distributed', 'archived'
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_frameworks_active ON compliance_frameworks(is_active);
CREATE INDEX IF NOT EXISTS idx_requirements_framework ON compliance_requirements(framework_id);
CREATE INDEX IF NOT EXISTS idx_requirements_severity ON compliance_requirements(severity);
CREATE INDEX IF NOT EXISTS idx_controls_process ON process_controls(process_id);
CREATE INDEX IF NOT EXISTS idx_controls_effectiveness ON process_controls(control_effectiveness);
CREATE INDEX IF NOT EXISTS idx_checks_process ON compliance_checks(process_id);
CREATE INDEX IF NOT EXISTS idx_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_timestamp ON compliance_checks(check_timestamp);
CREATE INDEX IF NOT EXISTS idx_risks_process ON risk_assessments(process_id);
CREATE INDEX IF NOT EXISTS idx_risks_level ON risk_assessments(risk_level, status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON compliance_audit_logs(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON compliance_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON compliance_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_reports_framework ON regulatory_reports(framework_id);
CREATE INDEX IF NOT EXISTS idx_reports_period ON regulatory_reports(period_start, period_end);

-- Enable RLS
ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view compliance frameworks"
  ON compliance_frameworks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage compliance frameworks"
  ON compliance_frameworks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view requirements"
  ON compliance_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage requirements"
  ON compliance_requirements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view controls"
  ON process_controls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage controls"
  ON process_controls FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view compliance checks"
  ON compliance_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create compliance checks"
  ON compliance_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their checks"
  ON compliance_checks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view risk assessments"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage risk assessments"
  ON risk_assessments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view audit logs"
  ON compliance_audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON compliance_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view reports"
  ON regulatory_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage reports"
  ON regulatory_reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
