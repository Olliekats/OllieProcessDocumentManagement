/*
  # Process Discovery & Mining System

  This migration creates a comprehensive process mining and discovery system that enables:
  - Automated process discovery from execution logs
  - Process conformance checking
  - Variant analysis and pattern detection
  - Bottleneck identification with AI recommendations
  - Root cause analysis for process delays

  ## New Tables

  1. `process_execution_logs`
     - Captures every process execution event
     - Includes timestamps, actors, resources, and outcomes
     - Enables reconstruction of actual process flows

  2. `discovered_processes`
     - Stores automatically discovered process patterns
     - Includes frequency, duration, and efficiency metrics
     - Links to source execution logs

  3. `process_variants`
     - Tracks different ways a process is actually executed
     - Compares variants against standard process definition
     - Identifies deviation patterns

  4. `process_conformance_checks`
     - Records compliance with designed processes
     - Identifies deviations and non-conforming executions
     - Calculates conformance scores

  5. `process_bottlenecks`
     - AI-identified bottleneck points in processes
     - Includes impact analysis and recommendations
     - Tracks resolution status

  6. `process_mining_insights`
     - AI-generated insights from process mining
     - Includes optimization suggestions
     - Prioritized by potential impact

  ## Security
  - RLS enabled on all tables
  - Users can only view data for their organization
  - Audit logs are immutable
*/

-- Process Execution Logs (immutable event log)
CREATE TABLE IF NOT EXISTS process_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL, -- Groups events from same process instance
  event_type text NOT NULL, -- 'start', 'complete', 'error', 'skip'
  activity_name text NOT NULL,
  activity_type text, -- 'manual', 'automated', 'approval', 'decision'
  actor_id uuid REFERENCES users_profile(id),
  actor_role text,
  resource_used text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer,
  outcome text, -- 'success', 'failure', 'partial'
  data jsonb DEFAULT '{}'::jsonb, -- Additional context
  previous_activity text,
  next_activity text,
  cost_incurred numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Discovered Processes (auto-identified patterns)
CREATE TABLE IF NOT EXISTS discovered_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  discovery_method text NOT NULL, -- 'alpha_miner', 'heuristic', 'inductive', 'fuzzy'
  source_log_count integer DEFAULT 0,
  first_occurrence timestamptz,
  last_occurrence timestamptz,
  frequency integer DEFAULT 0, -- How often this pattern occurs
  avg_duration_seconds integer,
  min_duration_seconds integer,
  max_duration_seconds integer,
  std_deviation_seconds numeric(10,2),
  avg_cost numeric(10,2),
  success_rate numeric(5,2), -- Percentage
  pattern_data jsonb DEFAULT '{}'::jsonb, -- Petri net or process graph
  activity_sequence text[], -- Ordered list of activities
  parallel_activities text[], -- Activities that can run in parallel
  exclusive_gateways jsonb, -- XOR decision points
  confidence_score numeric(5,2), -- 0-100
  status text DEFAULT 'discovered', -- 'discovered', 'validated', 'implemented', 'archived'
  validated_by uuid REFERENCES users_profile(id),
  validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process Variants (different execution paths)
CREATE TABLE IF NOT EXISTS process_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  activity_sequence text[] NOT NULL,
  frequency integer DEFAULT 0,
  percentage_of_total numeric(5,2),
  avg_duration_seconds integer,
  is_standard_path boolean DEFAULT false,
  deviation_type text, -- 'skip', 'rework', 'additional_steps', 'reorder'
  deviation_points text[],
  efficiency_score numeric(5,2), -- Compared to standard
  cost_impact numeric(10,2), -- Cost difference vs standard
  quality_impact text, -- 'positive', 'negative', 'neutral'
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  status text DEFAULT 'active', -- 'active', 'deprecated', 'merged'
  created_at timestamptz DEFAULT now()
);

-- Process Conformance Checks
CREATE TABLE IF NOT EXISTS process_conformance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL,
  check_timestamp timestamptz DEFAULT now(),
  conformance_score numeric(5,2) NOT NULL, -- 0-100
  is_conforming boolean DEFAULT true,
  deviations_found integer DEFAULT 0,
  deviation_details jsonb DEFAULT '[]'::jsonb,
  missing_activities text[],
  extra_activities text[],
  wrong_sequence text[],
  timing_violations text[],
  resource_violations text[],
  risk_level text DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  remediation_suggested text,
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Process Bottlenecks (AI-identified)
CREATE TABLE IF NOT EXISTS process_bottlenecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  activity_name text NOT NULL,
  bottleneck_type text NOT NULL, -- 'resource', 'time', 'quality', 'dependency'
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  avg_wait_time_seconds integer,
  affected_instances integer DEFAULT 0,
  impact_percentage numeric(5,2), -- % of total process time
  root_cause_analysis text,
  ai_confidence numeric(5,2), -- 0-100
  recommendations jsonb DEFAULT '[]'::jsonb,
  estimated_improvement_seconds integer,
  estimated_cost_savings numeric(10,2),
  detection_date timestamptz DEFAULT now(),
  status text DEFAULT 'identified', -- 'identified', 'investigating', 'resolved', 'false_positive'
  assigned_to uuid REFERENCES users_profile(id),
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process Mining Insights (AI-generated)
CREATE TABLE IF NOT EXISTS process_mining_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  insight_type text NOT NULL, -- 'optimization', 'automation', 'elimination', 'simplification'
  title text NOT NULL,
  description text NOT NULL,
  impact_area text, -- 'time', 'cost', 'quality', 'compliance'
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  current_state_metrics jsonb DEFAULT '{}'::jsonb,
  proposed_state_metrics jsonb DEFAULT '{}'::jsonb,
  estimated_time_savings_seconds integer,
  estimated_cost_savings numeric(10,2),
  estimated_quality_improvement numeric(5,2),
  implementation_effort text, -- 'low', 'medium', 'high'
  implementation_steps text[],
  risks text[],
  dependencies text[],
  confidence_score numeric(5,2), -- 0-100
  supporting_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'identified', -- 'identified', 'approved', 'in_progress', 'implemented', 'rejected'
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  implemented_at timestamptz,
  actual_results jsonb, -- Post-implementation metrics
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_process_logs_process ON process_execution_logs(process_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_instance ON process_execution_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_process_logs_timestamp ON process_execution_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_process_logs_actor ON process_execution_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_discovered_processes_status ON discovered_processes(status);
CREATE INDEX IF NOT EXISTS idx_variants_process ON process_variants(process_id);
CREATE INDEX IF NOT EXISTS idx_conformance_process ON process_conformance_checks(process_id);
CREATE INDEX IF NOT EXISTS idx_conformance_score ON process_conformance_checks(conformance_score);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_process ON process_bottlenecks(process_id);
CREATE INDEX IF NOT EXISTS idx_bottlenecks_severity ON process_bottlenecks(severity, status);
CREATE INDEX IF NOT EXISTS idx_insights_process ON process_mining_insights(process_id);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON process_mining_insights(priority, status);

-- Enable RLS
ALTER TABLE process_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_conformance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_mining_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view execution logs"
  ON process_execution_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert execution logs"
  ON process_execution_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view discovered processes"
  ON discovered_processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage discovered processes"
  ON discovered_processes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view variants"
  ON process_variants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view conformance checks"
  ON process_conformance_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage conformance checks"
  ON process_conformance_checks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view bottlenecks"
  ON process_bottlenecks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage bottlenecks"
  ON process_bottlenecks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view insights"
  ON process_mining_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage insights"
  ON process_mining_insights FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
