/*
  # Compliance & Governance System
  
  ## Tables
  1. compliance_reqs - Compliance requirements tracking
  2. compliance_checkpoints - Process validation checkpoints
  3. compliance_validations - Checkpoint validation results
  4. compliance_audits - Comprehensive audit log
  5. compliance_risks - Risk register
  6. compliance_policies - Policy acknowledgements
*/

-- Compliance Requirements
CREATE TABLE IF NOT EXISTS compliance_reqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_name text NOT NULL,
  regulation text NOT NULL,
  description text NOT NULL,
  requirement_level text NOT NULL,
  process_ref_id text,
  responsible_party uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending',
  evidence_url text,
  due_date timestamptz,
  last_audit_date timestamptz,
  next_audit_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process Compliance Checkpoints
CREATE TABLE IF NOT EXISTS compliance_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_process_id text NOT NULL,
  node_id text NOT NULL,
  checkpoint_type text NOT NULL,
  checkpoint_name text NOT NULL,
  validation_rules jsonb NOT NULL,
  is_mandatory boolean DEFAULT true,
  failure_action text DEFAULT 'block',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Checkpoint Validation Results
CREATE TABLE IF NOT EXISTS compliance_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id uuid REFERENCES compliance_checkpoints(id) ON DELETE CASCADE NOT NULL,
  instance_id text NOT NULL,
  task_id text NOT NULL,
  validation_result boolean NOT NULL,
  validation_data jsonb,
  failure_reason text,
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Comprehensive Audit Trail
CREATE TABLE IF NOT EXISTS compliance_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  changes jsonb,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Risk Register
CREATE TABLE IF NOT EXISTS compliance_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_title text NOT NULL,
  risk_description text NOT NULL,
  risk_category text NOT NULL,
  process_ref_id text,
  probability text NOT NULL,
  impact text NOT NULL,
  risk_score integer NOT NULL,
  mitigation_plan text,
  owner_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'identified',
  review_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Policy Acknowledgements
CREATE TABLE IF NOT EXISTS compliance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_ref_id text NOT NULL,
  policy_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version text NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  ip_address text,
  UNIQUE(policy_ref_id, user_id, version)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creqs_status ON compliance_reqs(status);
CREATE INDEX IF NOT EXISTS idx_creqs_process ON compliance_reqs(process_ref_id);
CREATE INDEX IF NOT EXISTS idx_ccheckpoints_process ON compliance_checkpoints(checkpoint_process_id);
CREATE INDEX IF NOT EXISTS idx_cvalidations_checkpoint ON compliance_validations(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_cvalidations_instance ON compliance_validations(instance_id);
CREATE INDEX IF NOT EXISTS idx_caudits_entity ON compliance_audits(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_caudits_actor ON compliance_audits(actor_id);
CREATE INDEX IF NOT EXISTS idx_caudits_created ON compliance_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisks_process ON compliance_risks(process_ref_id);
CREATE INDEX IF NOT EXISTS idx_crisks_status ON compliance_risks(status);
CREATE INDEX IF NOT EXISTS idx_cpolicies_user ON compliance_policies(user_id);

-- Enable RLS
ALTER TABLE compliance_reqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View compliance reqs" ON compliance_reqs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage compliance reqs" ON compliance_reqs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View checkpoints" ON compliance_checkpoints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage checkpoints" ON compliance_checkpoints FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View validations" ON compliance_validations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage validations" ON compliance_validations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View audit log" ON compliance_audits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage audit log" ON compliance_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View risks" ON compliance_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage risks" ON compliance_risks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View own policies" ON compliance_policies FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Manage own policies" ON compliance_policies FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_changes jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id uuid;
  v_user_id uuid;
  v_user_email text;
BEGIN
  v_user_id := auth.uid();
  
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  INSERT INTO compliance_audits (
    entity_type,
    entity_id,
    action,
    actor_id,
    actor_email,
    changes,
    metadata
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    v_user_id,
    v_user_email,
    p_changes,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
  p_probability text,
  p_impact text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_prob_score integer;
  v_impact_score integer;
BEGIN
  v_prob_score := CASE p_probability
    WHEN 'very_low' THEN 1
    WHEN 'low' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'high' THEN 4
    WHEN 'very_high' THEN 5
    ELSE 3
  END;

  v_impact_score := CASE p_impact
    WHEN 'very_low' THEN 1
    WHEN 'low' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'high' THEN 4
    WHEN 'critical' THEN 5
    ELSE 3
  END;

  RETURN v_prob_score * v_impact_score;
END;
$$;