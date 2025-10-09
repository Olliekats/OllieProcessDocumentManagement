/*
  # Process AI Intelligence System
  
  ## Overview
  AI-powered intelligence for process management including predictions,
  smart task assignment, performance scoring, and optimization.
  
  ## New Tables
  1. ai_process_predictions - Outcome predictions
  2. process_smart_routing - Task assignment rules  
  3. user_skills_matrix - Skills inventory
  4. task_assignment_history - Learning data
  5. sla_breach_predictions - Breach warnings
  6. process_recommendations - AI suggestions
  7. user_performance_matrix - Performance tracking
  8. auto_escalations - Escalation tracking
*/

-- AI Process Outcome Predictions
CREATE TABLE IF NOT EXISTS ai_process_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  prediction_type text NOT NULL,
  predicted_outcome text NOT NULL,
  confidence_score numeric(5,2) NOT NULL,
  estimated_duration_minutes integer,
  success_probability numeric(5,2),
  risk_score numeric(5,2),
  risk_factors jsonb,
  predicted_at timestamptz DEFAULT now(),
  actual_outcome text,
  created_at timestamptz DEFAULT now()
);

-- Smart Task Routing
CREATE TABLE IF NOT EXISTS process_smart_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_ref_id text,
  node_id text NOT NULL,
  rule_name text NOT NULL,
  rule_type text NOT NULL,
  conditions jsonb NOT NULL,
  scoring_algorithm text NOT NULL,
  is_active boolean DEFAULT true,
  success_rate numeric(5,2),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- User Skills Matrix
CREATE TABLE IF NOT EXISTS user_skills_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name text NOT NULL,
  skill_category text NOT NULL,
  proficiency_level text NOT NULL,
  years_experience numeric(4,2),
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Task Assignment History
CREATE TABLE IF NOT EXISTS task_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  assigned_by text NOT NULL,
  assignment_score numeric(5,2),
  workload_at_assignment integer,
  skills_match_score numeric(5,2),
  assignment_timestamp timestamptz DEFAULT now(),
  completion_timestamp timestamptz,
  was_successful boolean,
  created_at timestamptz DEFAULT now()
);

-- SLA Breach Predictions  
CREATE TABLE IF NOT EXISTS sla_breach_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  breach_probability numeric(5,2) NOT NULL,
  estimated_delay_minutes integer,
  recommended_actions jsonb,
  urgency_level text NOT NULL,
  prediction_timestamp timestamptz DEFAULT now(),
  was_accurate boolean,
  created_at timestamptz DEFAULT now()
);

-- Process Optimization Recommendations
CREATE TABLE IF NOT EXISTS process_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_ref_id text,
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  expected_impact jsonb,
  estimated_savings jsonb,
  confidence_score numeric(5,2),
  priority text DEFAULT 'medium',
  status text DEFAULT 'suggested',
  generated_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User Performance Matrix
CREATE TABLE IF NOT EXISTS user_performance_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time_period text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  overall_score numeric(5,2),
  quality_score numeric(5,2),
  speed_score numeric(5,2),
  tasks_completed integer DEFAULT 0,
  on_time_percentage numeric(5,2),
  trend_direction text,
  strengths jsonb,
  improvement_areas jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, time_period, period_start)
);

-- Automated Escalations
CREATE TABLE IF NOT EXISTS auto_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  instance_id uuid NOT NULL,
  escalation_reason text NOT NULL,
  severity text NOT NULL,
  triggered_by text NOT NULL,
  escalated_from uuid REFERENCES auth.users(id),
  escalated_to uuid REFERENCES auth.users(id),
  escalation_timestamp timestamptz DEFAULT now(),
  resolution_timestamp timestamptz,
  was_effective boolean,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_process_pred_instance ON ai_process_predictions(instance_id);
CREATE INDEX IF NOT EXISTS idx_smart_routing_process ON process_smart_routing(process_ref_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON user_skills_matrix(user_id);
CREATE INDEX IF NOT EXISTS idx_assign_history_task ON task_assignment_history(task_id);
CREATE INDEX IF NOT EXISTS idx_sla_pred_task ON sla_breach_predictions(task_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_process ON process_recommendations(process_ref_id);
CREATE INDEX IF NOT EXISTS idx_perf_matrix_user ON user_performance_matrix(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_task ON auto_escalations(task_id);

-- Enable RLS
ALTER TABLE ai_process_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_smart_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_breach_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_performance_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View predictions" ON ai_process_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage predictions" ON ai_process_predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View routing" ON process_smart_routing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create routing" ON process_smart_routing FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "View skills" ON user_skills_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage own skills" ON user_skills_matrix FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "View history" ON task_assignment_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage history" ON task_assignment_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View SLA predictions" ON sla_breach_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage SLA predictions" ON sla_breach_predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View recommendations" ON process_recommendations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage recommendations" ON process_recommendations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View performance" ON user_performance_matrix FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage performance" ON user_performance_matrix FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View escalations" ON auto_escalations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage escalations" ON auto_escalations FOR ALL TO authenticated USING (true) WITH CHECK (true);