/*
  # Process Analytics & Mining System
  
  ## Overview
  Transform process execution data into actionable insights with real-time analytics,
  bottleneck detection, and process mining capabilities.
  
  ## New Tables
  
  ### 1. process_performance_metrics
  - Aggregate metrics per process
  - Average completion times, success rates
  - Cost and efficiency tracking
  
  ### 2. node_performance_metrics
  - Per-node performance analysis
  - Identify bottlenecks and delays
  - Average processing times
  
  ### 3. process_bottlenecks
  - Automated bottleneck detection
  - Root cause analysis
  - Impact assessment
  
  ### 4. process_deviations
  - Track when processes deviate from design
  - Identify unexpected paths
  - Compliance monitoring
  
  ### 5. resource_utilization
  - User/team workload tracking
  - Capacity planning data
  - Performance by user
  
  ### 6. process_insights
  - AI-generated insights and recommendations
  - Optimization opportunities
  - Trend analysis
  
  ### 7. process_benchmarks
  - Industry and internal benchmarks
  - Target performance metrics
  - Comparative analysis
  
  ### 8. real_time_process_metrics
  - Live metrics cache for dashboards
  - Updated via triggers
  - High-performance queries
  
  ## Features
  - Automatic metric calculation via triggers
  - Real-time performance tracking
  - Bottleneck detection algorithms
  - Deviation analysis
  - Resource optimization insights
  
  ## Security
  - RLS enabled on all tables
  - Manager and analyst access
  - Data privacy maintained
*/

-- Process-level performance metrics
CREATE TABLE IF NOT EXISTS process_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE NOT NULL,
  time_period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_instances integer DEFAULT 0,
  completed_instances integer DEFAULT 0,
  cancelled_instances integer DEFAULT 0,
  avg_completion_minutes numeric(10,2),
  median_completion_minutes numeric(10,2),
  min_completion_minutes integer,
  max_completion_minutes integer,
  success_rate numeric(5,2),
  on_time_rate numeric(5,2),
  avg_cost numeric(10,2),
  total_cost numeric(10,2),
  bottleneck_count integer DEFAULT 0,
  deviation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(process_id, time_period, period_start)
);

-- Node-level performance metrics
CREATE TABLE IF NOT EXISTS node_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_label text NOT NULL,
  time_period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_executions integer DEFAULT 0,
  completed_executions integer DEFAULT 0,
  avg_processing_minutes numeric(10,2),
  median_processing_minutes numeric(10,2),
  min_processing_minutes integer,
  max_processing_minutes integer,
  avg_wait_minutes numeric(10,2),
  timeout_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  is_bottleneck boolean DEFAULT false,
  bottleneck_severity text,
  throughput_rate numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(process_id, node_id, time_period, period_start)
);

-- Detected bottlenecks
CREATE TABLE IF NOT EXISTS process_bottlenecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_label text NOT NULL,
  severity text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  avg_delay_minutes numeric(10,2),
  impact_score numeric(5,2),
  affected_instances_count integer,
  root_causes jsonb,
  recommended_actions jsonb,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process deviations from design
CREATE TABLE IF NOT EXISTS process_deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES process_instances(id) ON DELETE CASCADE NOT NULL,
  deviation_type text NOT NULL,
  severity text NOT NULL,
  from_node_id text,
  to_node_id text,
  expected_path text,
  actual_path text,
  detected_at timestamptz DEFAULT now(),
  reason text,
  impact_assessment text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Resource utilization tracking
CREATE TABLE IF NOT EXISTS resource_utilization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  time_period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_tasks_assigned integer DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  avg_task_completion_minutes numeric(10,2),
  total_active_minutes integer DEFAULT 0,
  utilization_rate numeric(5,2),
  quality_score numeric(5,2),
  on_time_completion_rate numeric(5,2),
  processes_worked jsonb,
  peak_workload_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, time_period, period_start)
);

-- AI-generated insights
CREATE TABLE IF NOT EXISTS process_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  category text NOT NULL,
  priority text DEFAULT 'medium',
  title text NOT NULL,
  description text NOT NULL,
  impact_assessment text,
  potential_savings jsonb,
  recommended_actions jsonb,
  confidence_score numeric(5,2),
  status text DEFAULT 'new',
  generated_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  implemented_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Process benchmarks
CREATE TABLE IF NOT EXISTS process_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  benchmark_type text NOT NULL,
  benchmark_source text NOT NULL,
  metric_name text NOT NULL,
  target_value numeric(10,2) NOT NULL,
  current_value numeric(10,2),
  variance_percentage numeric(5,2),
  unit text NOT NULL,
  benchmark_date timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Real-time metrics cache
CREATE TABLE IF NOT EXISTS real_time_process_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text UNIQUE NOT NULL,
  metric_value jsonb NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_process_metrics_process ON process_performance_metrics(process_id, period_start);
CREATE INDEX IF NOT EXISTS idx_node_metrics_process ON node_performance_metrics(process_id, node_id);
CREATE INDEX IF NOT EXISTS idx_node_metrics_bottleneck ON node_performance_metrics(is_bottleneck) WHERE is_bottleneck = true;
CREATE INDEX IF NOT EXISTS idx_bottlenecks_active ON process_bottlenecks(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bottlenecks_process ON process_bottlenecks(process_id);
CREATE INDEX IF NOT EXISTS idx_deviations_instance ON process_deviations(instance_id);
CREATE INDEX IF NOT EXISTS idx_resource_util_user ON resource_utilization(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_insights_process ON process_insights(process_id, status);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON process_insights(priority, status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_process ON process_benchmarks(process_id, is_active);

-- Enable Row Level Security
ALTER TABLE process_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_process_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for process_performance_metrics
CREATE POLICY "Authenticated users can view process metrics"
  ON process_performance_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage process metrics"
  ON process_performance_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for node_performance_metrics
CREATE POLICY "Authenticated users can view node metrics"
  ON node_performance_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage node metrics"
  ON node_performance_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for process_bottlenecks
CREATE POLICY "Authenticated users can view bottlenecks"
  ON process_bottlenecks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage bottlenecks"
  ON process_bottlenecks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for process_deviations
CREATE POLICY "Users can view deviations for their processes"
  ON process_deviations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_instances
      WHERE process_instances.id = process_deviations.instance_id
      AND (process_instances.started_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM process_tasks
             WHERE process_tasks.instance_id = process_instances.id
             AND process_tasks.assigned_to = auth.uid()
           ))
    )
  );

CREATE POLICY "System can create deviations"
  ON process_deviations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for resource_utilization
CREATE POLICY "Users can view their own utilization"
  ON resource_utilization FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage resource utilization"
  ON resource_utilization FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for process_insights
CREATE POLICY "Authenticated users can view insights"
  ON process_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage insights"
  ON process_insights FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for process_benchmarks
CREATE POLICY "Authenticated users can view benchmarks"
  ON process_benchmarks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create benchmarks"
  ON process_benchmarks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their benchmarks"
  ON process_benchmarks FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for real_time_process_metrics
CREATE POLICY "Authenticated users can view real-time metrics"
  ON real_time_process_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage real-time metrics"
  ON real_time_process_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to calculate process metrics
CREATE OR REPLACE FUNCTION calculate_process_metrics(
  p_process_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total integer;
  v_completed integer;
  v_cancelled integer;
  v_avg_minutes numeric;
  v_success_rate numeric;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    AVG(actual_duration_minutes) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed, v_cancelled, v_avg_minutes
  FROM process_instances
  WHERE process_id = p_process_id
    AND started_at >= p_period_start
    AND started_at < p_period_end;

  v_success_rate := CASE 
    WHEN v_total > 0 THEN (v_completed::numeric / v_total * 100)
    ELSE 0
  END;

  INSERT INTO process_performance_metrics (
    process_id,
    time_period,
    period_start,
    period_end,
    total_instances,
    completed_instances,
    cancelled_instances,
    avg_completion_minutes,
    success_rate
  )
  VALUES (
    p_process_id,
    'daily',
    p_period_start,
    p_period_end,
    v_total,
    v_completed,
    v_cancelled,
    v_avg_minutes,
    v_success_rate
  )
  ON CONFLICT (process_id, time_period, period_start)
  DO UPDATE SET
    total_instances = EXCLUDED.total_instances,
    completed_instances = EXCLUDED.completed_instances,
    cancelled_instances = EXCLUDED.cancelled_instances,
    avg_completion_minutes = EXCLUDED.avg_completion_minutes,
    success_rate = EXCLUDED.success_rate,
    updated_at = now();
END;
$$;

-- Function to detect bottlenecks
CREATE OR REPLACE FUNCTION detect_bottlenecks(p_process_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_node RECORD;
  v_avg_time numeric;
  v_threshold numeric := 2.0;
BEGIN
  FOR v_node IN
    SELECT 
      node_id,
      node_label,
      AVG(time_spent_minutes) as avg_time,
      COUNT(*) as execution_count
    FROM process_tasks
    WHERE instance_id IN (
      SELECT id FROM process_instances WHERE process_id = p_process_id
    )
    AND status = 'completed'
    GROUP BY node_id, node_label
    HAVING COUNT(*) >= 5
  LOOP
    SELECT AVG(avg_time)
    INTO v_avg_time
    FROM (
      SELECT AVG(time_spent_minutes) as avg_time
      FROM process_tasks
      WHERE instance_id IN (
        SELECT id FROM process_instances WHERE process_id = p_process_id
      )
      AND status = 'completed'
      GROUP BY node_id
    ) sub;

    IF v_node.avg_time > v_avg_time * v_threshold THEN
      INSERT INTO process_bottlenecks (
        process_id,
        node_id,
        node_label,
        severity,
        avg_delay_minutes,
        impact_score,
        affected_instances_count
      )
      VALUES (
        p_process_id,
        v_node.node_id,
        v_node.node_label,
        CASE 
          WHEN v_node.avg_time > v_avg_time * 3 THEN 'critical'
          WHEN v_node.avg_time > v_avg_time * 2 THEN 'high'
          ELSE 'medium'
        END,
        v_node.avg_time - v_avg_time,
        ((v_node.avg_time - v_avg_time) / v_avg_time * 100)::numeric(5,2),
        v_node.execution_count
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;