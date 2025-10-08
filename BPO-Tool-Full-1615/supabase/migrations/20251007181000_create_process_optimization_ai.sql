/*
  # Process Optimization AI System

  This migration creates an AI-powered process optimization system that:
  - Automatically identifies process improvement opportunities
  - Recommends automation candidates
  - Identifies redundant steps and inefficiencies
  - Predicts cycle time improvements
  - Calculates ROI for optimization initiatives

  ## New Tables

  1. `optimization_opportunities`
     - AI-identified improvement opportunities
     - Impact analysis and prioritization
     - Implementation tracking

  2. `automation_candidates`
     - Activities suitable for automation
     - Automation feasibility scoring
     - Cost-benefit analysis

  3. `redundancy_analysis`
     - Identified redundant or unnecessary steps
     - Elimination recommendations
     - Impact assessment

  4. `process_improvement_initiatives`
     - Tracked improvement projects
     - Before/after metrics
     - ROI tracking

  5. `optimization_rules`
     - Configurable optimization rules
     - Pattern matching criteria
     - Scoring algorithms

  6. `continuous_improvement_metrics`
     - Tracks improvement trends over time
     - Benchmark comparisons
     - Success rates

  ## Security
  - RLS enabled on all tables
  - Users can view all optimization data
  - Only authorized users can approve initiatives
*/

-- Optimization Opportunities
CREATE TABLE IF NOT EXISTS optimization_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  opportunity_type text NOT NULL, -- 'automation', 'elimination', 'simplification', 'parallelization', 'reordering'
  title text NOT NULL,
  description text NOT NULL,
  detected_by text DEFAULT 'ai', -- 'ai', 'user', 'system'
  detection_method text, -- 'pattern_matching', 'ml_model', 'statistical_analysis'
  confidence_score numeric(5,2), -- 0-100
  -- Current state
  current_activity text[],
  current_avg_duration_seconds integer,
  current_cost numeric(10,2),
  current_quality_score numeric(5,2),
  issues_identified text[],
  -- Proposed state
  proposed_changes text NOT NULL,
  proposed_activity text[],
  estimated_duration_seconds integer,
  estimated_cost numeric(10,2),
  estimated_quality_score numeric(5,2),
  -- Impact analysis
  impact_category text, -- 'time', 'cost', 'quality', 'compliance', 'customer_satisfaction'
  time_savings_seconds integer,
  time_savings_percentage numeric(5,2),
  cost_savings numeric(10,2),
  cost_savings_percentage numeric(5,2),
  quality_improvement_percentage numeric(5,2),
  affected_instances_per_month integer,
  annual_savings numeric(12,2),
  -- Implementation
  implementation_complexity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'very_high'
  implementation_cost numeric(10,2),
  implementation_time_weeks integer,
  required_resources text[],
  prerequisites text[],
  risks text[],
  roi_months integer, -- Payback period
  -- Supporting evidence
  supporting_data jsonb DEFAULT '{}'::jsonb,
  sample_instances uuid[],
  -- Status tracking
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status text DEFAULT 'identified', -- 'identified', 'under_review', 'approved', 'in_progress', 'implemented', 'rejected'
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  implemented_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Automation Candidates
CREATE TABLE IF NOT EXISTS automation_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  activity_name text NOT NULL,
  activity_description text,
  current_execution_type text DEFAULT 'manual', -- 'manual', 'semi_automated', 'automated'
  -- Feasibility analysis
  automation_feasibility_score numeric(5,2), -- 0-100
  technical_feasibility text, -- 'easy', 'moderate', 'difficult', 'very_difficult'
  rule_based boolean DEFAULT false, -- Can be rule-based automation
  ai_suitable boolean DEFAULT false, -- Suitable for AI/ML automation
  rpa_suitable boolean DEFAULT false, -- Suitable for RPA
  -- Frequency and volume
  executions_per_day integer,
  executions_per_month integer,
  avg_duration_seconds integer,
  total_monthly_hours numeric(10,2),
  -- Cost analysis
  current_labor_cost_per_execution numeric(10,2),
  current_monthly_cost numeric(10,2),
  estimated_automation_cost numeric(10,2),
  estimated_cost_per_execution numeric(10,2),
  estimated_monthly_savings numeric(10,2),
  payback_period_months integer,
  -- Complexity factors
  number_of_steps integer,
  decision_points integer,
  external_dependencies text[],
  data_inputs_required text[],
  exception_handling_complexity text, -- 'low', 'medium', 'high'
  -- Benefits
  error_reduction_potential numeric(5,2), -- Percentage
  speed_improvement_potential numeric(5,2), -- Percentage
  consistency_improvement text,
  compliance_benefits text[],
  -- Implementation approach
  recommended_technology text, -- 'RPA', 'API', 'AI', 'Workflow_Engine', 'Custom'
  implementation_steps text[],
  estimated_implementation_weeks integer,
  required_skills text[],
  vendor_solutions text[],
  -- Status
  priority text DEFAULT 'medium',
  status text DEFAULT 'candidate', -- 'candidate', 'approved', 'in_development', 'implemented', 'rejected'
  assigned_to uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Redundancy Analysis
CREATE TABLE IF NOT EXISTS redundancy_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  redundancy_type text NOT NULL, -- 'duplicate_activity', 'unnecessary_approval', 'redundant_check', 'over_processing'
  title text NOT NULL,
  description text,
  -- Identified redundancy
  redundant_activities text[] NOT NULL,
  reason_for_redundancy text,
  historical_reason text, -- Why it was added originally
  -- Impact of redundancy
  time_wasted_per_execution_seconds integer,
  monthly_executions integer,
  total_monthly_time_wasted_hours numeric(10,2),
  monthly_cost_of_redundancy numeric(10,2),
  annual_cost_impact numeric(12,2),
  quality_impact text, -- 'none', 'positive', 'negative'
  compliance_impact text, -- 'none', 'required', 'optional'
  -- Removal recommendation
  can_be_eliminated boolean DEFAULT true,
  elimination_recommendation text,
  alternative_approach text,
  risks_of_elimination text[],
  mitigation_strategies text[],
  -- Testing requirements
  testing_required boolean DEFAULT true,
  testing_approach text,
  rollback_plan text,
  -- Status
  confidence_level numeric(5,2), -- 0-100
  priority text DEFAULT 'medium',
  status text DEFAULT 'identified', -- 'identified', 'validated', 'approved', 'eliminated', 'rejected'
  validated_by uuid REFERENCES users_profile(id),
  validated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process Improvement Initiatives
CREATE TABLE IF NOT EXISTS process_improvement_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  initiative_type text NOT NULL, -- 'optimization', 'automation', 'elimination', 'technology_upgrade'
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  related_opportunity_id uuid REFERENCES optimization_opportunities(id),
  -- Baseline metrics (before)
  baseline_cycle_time_seconds integer,
  baseline_cost_per_execution numeric(10,2),
  baseline_quality_score numeric(5,2),
  baseline_customer_satisfaction numeric(5,2),
  baseline_error_rate numeric(5,2),
  baseline_measured_at timestamptz,
  -- Target metrics
  target_cycle_time_seconds integer,
  target_cost_per_execution numeric(10,2),
  target_quality_score numeric(5,2),
  target_customer_satisfaction numeric(5,2),
  target_error_rate numeric(5,2),
  -- Actual results (after)
  actual_cycle_time_seconds integer,
  actual_cost_per_execution numeric(10,2),
  actual_quality_score numeric(5,2),
  actual_customer_satisfaction numeric(5,2),
  actual_error_rate numeric(5,2),
  results_measured_at timestamptz,
  -- ROI tracking
  investment_amount numeric(12,2),
  monthly_savings numeric(10,2),
  actual_monthly_savings numeric(10,2),
  break_even_date date,
  total_savings_to_date numeric(12,2),
  roi_percentage numeric(5,2),
  -- Project tracking
  owner_id uuid REFERENCES users_profile(id),
  team_members uuid[],
  start_date date,
  planned_completion_date date,
  actual_completion_date date,
  status text DEFAULT 'planning', -- 'planning', 'approved', 'in_progress', 'completed', 'on_hold', 'cancelled'
  progress_percentage integer DEFAULT 0,
  milestones jsonb DEFAULT '[]'::jsonb,
  blockers text[],
  lessons_learned text,
  -- Documentation
  business_case text,
  stakeholders text[],
  change_management_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optimization Rules (configurable)
CREATE TABLE IF NOT EXISTS optimization_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rule_type text NOT NULL, -- 'pattern_detection', 'threshold_based', 'ml_model', 'heuristic'
  category text, -- 'time', 'cost', 'quality', 'compliance'
  -- Rule definition
  detection_criteria jsonb NOT NULL,
  evaluation_logic text NOT NULL,
  threshold_values jsonb DEFAULT '{}'::jsonb,
  -- Scoring
  opportunity_score_weight numeric(5,2) DEFAULT 1.00,
  confidence_adjustment numeric(5,2) DEFAULT 1.00,
  -- Application
  applies_to_process_types text[],
  applies_to_activities text[],
  minimum_frequency_required integer DEFAULT 10,
  -- Status
  is_active boolean DEFAULT true,
  priority integer DEFAULT 50,
  created_by uuid REFERENCES users_profile(id),
  last_applied_at timestamptz,
  total_opportunities_found integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Continuous Improvement Metrics
CREATE TABLE IF NOT EXISTS continuous_improvement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  -- Opportunities
  opportunities_identified integer DEFAULT 0,
  opportunities_approved integer DEFAULT 0,
  opportunities_implemented integer DEFAULT 0,
  opportunities_rejected integer DEFAULT 0,
  -- Impact realized
  total_time_saved_hours numeric(10,2) DEFAULT 0,
  total_cost_saved numeric(12,2) DEFAULT 0,
  total_quality_improvement numeric(5,2) DEFAULT 0,
  -- Automation progress
  activities_automated integer DEFAULT 0,
  automation_success_rate numeric(5,2) DEFAULT 0,
  -- Process health
  avg_process_efficiency_score numeric(5,2),
  avg_process_maturity_level numeric(5,2),
  processes_optimized integer DEFAULT 0,
  -- Benchmarks
  industry_benchmark_comparison jsonb DEFAULT '{}'::jsonb,
  best_in_class_gaps jsonb DEFAULT '{}'::jsonb,
  -- Trends
  improvement_velocity numeric(5,2), -- Rate of improvement
  roi_achieved numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_optimization_process ON optimization_opportunities(process_id);
CREATE INDEX IF NOT EXISTS idx_optimization_status ON optimization_opportunities(status, priority);
CREATE INDEX IF NOT EXISTS idx_automation_process ON automation_candidates(process_id);
CREATE INDEX IF NOT EXISTS idx_automation_status ON automation_candidates(status);
CREATE INDEX IF NOT EXISTS idx_automation_feasibility ON automation_candidates(automation_feasibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_redundancy_process ON redundancy_analysis(process_id);
CREATE INDEX IF NOT EXISTS idx_redundancy_status ON redundancy_analysis(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_process ON process_improvement_initiatives(process_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON process_improvement_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_optimization_rules_active ON optimization_rules(is_active, priority);

-- Enable RLS
ALTER TABLE optimization_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE redundancy_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_improvement_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuous_improvement_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view optimization opportunities"
  ON optimization_opportunities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage optimization opportunities"
  ON optimization_opportunities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view automation candidates"
  ON automation_candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage automation candidates"
  ON automation_candidates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view redundancy analysis"
  ON redundancy_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage redundancy analysis"
  ON redundancy_analysis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view improvement initiatives"
  ON process_improvement_initiatives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their initiatives"
  ON process_improvement_initiatives FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view optimization rules"
  ON optimization_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage optimization rules"
  ON optimization_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view improvement metrics"
  ON continuous_improvement_metrics FOR SELECT
  TO authenticated
  USING (true);
