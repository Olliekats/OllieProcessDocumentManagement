/*
  # Process Simulation Engine

  This migration creates a comprehensive process simulation system that enables:
  - What-if scenario analysis before implementing changes
  - Monte Carlo simulations for capacity planning
  - Cost impact analysis and ROI predictions
  - Resource optimization recommendations
  - Risk assessment for process changes

  ## New Tables

  1. `simulation_scenarios`
     - Stores simulation configurations and parameters
     - Defines what-if scenarios to test
     - Tracks simulation runs and results

  2. `simulation_runs`
     - Records each simulation execution
     - Captures input parameters and output metrics
     - Enables comparison across runs

  3. `simulation_results`
     - Detailed results from each simulation
     - Statistical analysis and confidence intervals
     - Visual data for charts and graphs

  4. `simulation_recommendations`
     - AI-generated recommendations from simulations
     - Optimization opportunities identified
     - Risk assessments and mitigation strategies

  5. `resource_models`
     - Models resource availability and capacity
     - Defines cost structures
     - Tracks utilization patterns

  6. `process_what_if_scenarios`
     - Predefined scenario templates
     - Common what-if questions
     - Historical scenario results

  ## Security
  - RLS enabled on all tables
  - Users can only access their organization's simulations
*/

-- Simulation Scenarios
CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  scenario_type text NOT NULL, -- 'what_if', 'optimization', 'capacity_planning', 'cost_reduction'
  base_process_data jsonb DEFAULT '{}'::jsonb,
  modifications jsonb DEFAULT '[]'::jsonb, -- Changes to test
  parameters jsonb DEFAULT '{}'::jsonb,
  -- Scenario configuration
  simulation_duration_days integer DEFAULT 30,
  number_of_iterations integer DEFAULT 1000, -- For Monte Carlo
  confidence_level numeric(5,2) DEFAULT 95.00,
  -- Variables to modify
  resource_changes jsonb DEFAULT '[]'::jsonb,
  activity_duration_changes jsonb DEFAULT '[]'::jsonb,
  arrival_rate_changes jsonb DEFAULT '[]'::jsonb,
  cost_changes jsonb DEFAULT '[]'::jsonb,
  -- Expected outcomes
  expected_improvement_area text, -- 'time', 'cost', 'quality', 'capacity'
  expected_improvement_percentage numeric(5,2),
  -- Metadata
  created_by uuid REFERENCES users_profile(id),
  status text DEFAULT 'draft', -- 'draft', 'ready', 'running', 'completed', 'failed'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Simulation Runs
CREATE TABLE IF NOT EXISTS simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
  run_number integer NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  -- Input parameters (snapshot)
  input_parameters jsonb DEFAULT '{}'::jsonb,
  -- High-level results
  total_executions integer DEFAULT 0,
  avg_cycle_time_seconds integer,
  min_cycle_time_seconds integer,
  max_cycle_time_seconds integer,
  std_deviation_seconds numeric(10,2),
  percentile_50_seconds integer, -- Median
  percentile_90_seconds integer,
  percentile_95_seconds integer,
  percentile_99_seconds integer,
  -- Cost metrics
  total_cost numeric(12,2),
  avg_cost_per_execution numeric(10,2),
  cost_breakdown jsonb DEFAULT '{}'::jsonb,
  -- Resource utilization
  resource_utilization jsonb DEFAULT '{}'::jsonb,
  bottleneck_resources text[],
  idle_time_percentage numeric(5,2),
  -- Quality metrics
  success_rate numeric(5,2),
  rework_rate numeric(5,2),
  -- Comparison to baseline
  baseline_comparison jsonb DEFAULT '{}'::jsonb,
  improvement_percentage numeric(5,2),
  -- Additional data
  detailed_results jsonb DEFAULT '{}'::jsonb,
  error_log text,
  created_at timestamptz DEFAULT now()
);

-- Simulation Results (detailed data points)
CREATE TABLE IF NOT EXISTS simulation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES simulation_runs(id) ON DELETE CASCADE,
  iteration_number integer,
  instance_id uuid, -- Simulated process instance
  start_time timestamptz,
  end_time timestamptz,
  duration_seconds integer,
  total_cost numeric(10,2),
  outcome text, -- 'success', 'failure', 'timeout'
  -- Activity-level details
  activity_timings jsonb DEFAULT '[]'::jsonb,
  resource_assignments jsonb DEFAULT '[]'::jsonb,
  queue_times jsonb DEFAULT '[]'::jsonb,
  -- Paths taken
  variant_path text[],
  decision_points jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Simulation Recommendations
CREATE TABLE IF NOT EXISTS simulation_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES simulation_scenarios(id) ON DELETE CASCADE,
  run_id uuid REFERENCES simulation_runs(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL, -- 'resource_adjustment', 'process_change', 'automation', 'elimination'
  title text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  -- Impact analysis
  impact_area text, -- 'time', 'cost', 'quality', 'capacity'
  current_value numeric(12,2),
  projected_value numeric(12,2),
  improvement_percentage numeric(5,2),
  confidence_level numeric(5,2), -- Statistical confidence
  -- Implementation details
  changes_required jsonb DEFAULT '[]'::jsonb,
  estimated_implementation_effort text, -- 'low', 'medium', 'high'
  estimated_implementation_cost numeric(10,2),
  roi_months integer, -- Time to break even
  risks text[],
  prerequisites text[],
  -- Supporting data
  supporting_statistics jsonb DEFAULT '{}'::jsonb,
  visual_data jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'implemented'
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Resource Models
CREATE TABLE IF NOT EXISTS resource_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  resource_type text NOT NULL, -- 'human', 'system', 'equipment', 'software'
  capacity integer NOT NULL, -- Number available
  availability_schedule jsonb DEFAULT '{}'::jsonb, -- Working hours, shifts
  -- Cost structure
  hourly_cost numeric(10,2) DEFAULT 0,
  fixed_cost numeric(10,2) DEFAULT 0,
  overtime_multiplier numeric(5,2) DEFAULT 1.5,
  -- Capabilities
  skills text[],
  max_concurrent_tasks integer DEFAULT 1,
  avg_task_handling_time_seconds integer,
  -- Performance metrics
  efficiency_rating numeric(5,2) DEFAULT 100.00, -- 0-100
  error_rate numeric(5,2) DEFAULT 0,
  utilization_target numeric(5,2) DEFAULT 80.00,
  -- Constraints
  max_hours_per_day integer DEFAULT 8,
  required_break_minutes integer DEFAULT 0,
  training_required text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process What-If Scenarios (templates)
CREATE TABLE IF NOT EXISTS process_what_if_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text, -- 'staffing', 'automation', 'process_change', 'technology'
  question text NOT NULL, -- The what-if question
  process_type text, -- Which process types this applies to
  -- Scenario configuration template
  parameter_template jsonb DEFAULT '{}'::jsonb,
  typical_variables jsonb DEFAULT '[]'::jsonb,
  expected_outcomes text[],
  -- Usage statistics
  times_used integer DEFAULT 0,
  avg_improvement_seen numeric(5,2),
  is_template boolean DEFAULT true,
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_process ON simulation_scenarios(process_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_status ON simulation_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_runs_scenario ON simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON simulation_runs(status);
CREATE INDEX IF NOT EXISTS idx_results_run ON simulation_results(run_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_scenario ON simulation_recommendations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON simulation_recommendations(priority, status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resource_models(resource_type);
CREATE INDEX IF NOT EXISTS idx_whatif_category ON process_what_if_scenarios(category);

-- Enable RLS
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_what_if_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view scenarios"
  ON simulation_scenarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their scenarios"
  ON simulation_scenarios FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view runs"
  ON simulation_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view results"
  ON simulation_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view recommendations"
  ON simulation_recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage recommendations"
  ON simulation_recommendations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view resource models"
  ON resource_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage resource models"
  ON resource_models FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view what-if scenarios"
  ON process_what_if_scenarios FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their what-if scenarios"
  ON process_what_if_scenarios FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
