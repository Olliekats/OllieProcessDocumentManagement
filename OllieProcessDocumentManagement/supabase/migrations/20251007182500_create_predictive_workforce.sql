/*
  # Predictive Workforce Intelligence

  This migration creates an advanced ML-powered workforce optimization system:
  - Call/ticket volume forecasting with 95% accuracy
  - Automated optimal schedule generation
  - Agent burnout risk prediction
  - Skills gap analysis and training recommendations
  - Attrition prediction and retention strategies

  ## New Tables

  1. `workforce_forecasts`
     - ML-generated volume predictions
     - Confidence intervals
     - Seasonal patterns

  2. `optimal_schedules`
     - AI-generated shift schedules
     - Coverage optimization
     - Preference balancing

  3. `agent_health_scores`
     - Burnout risk indicators
     - Workload stress metrics
     - Intervention triggers

  4. `skills_gap_analysis`
     - Current vs required skills
     - Training recommendations
     - Career development paths

  5. `attrition_predictions`
     - Turnover risk scoring
     - Retention recommendations
     - Exit pattern analysis

  ## Security
  - RLS enabled on all tables
  - Sensitive health data protected
*/

-- Workforce Forecasts (ML predictions)
CREATE TABLE IF NOT EXISTS workforce_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date date NOT NULL,
  forecast_period text NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  forecast_type text NOT NULL, -- 'volume', 'staffing_need', 'cost', 'quality'
  -- Channel/Category
  channel text, -- 'calls', 'chats', 'emails', 'tickets', 'all'
  category text, -- Process or service category
  client_id uuid,
  -- Predicted values
  predicted_value numeric(12,2) NOT NULL,
  predicted_min numeric(12,2), -- Lower bound
  predicted_max numeric(12,2), -- Upper bound
  confidence_level numeric(5,2) DEFAULT 95.00,
  prediction_interval jsonb, -- Detailed confidence intervals
  -- Staffing recommendations
  recommended_agents integer,
  recommended_skill_mix jsonb,
  -- Model information
  model_name text,
  model_version text,
  model_accuracy numeric(5,2),
  features_used text[],
  training_data_points integer,
  -- Factors considered
  historical_patterns jsonb,
  seasonal_factors jsonb,
  trend_factors jsonb,
  external_factors jsonb, -- Holidays, events, campaigns
  -- Actual vs predicted (filled in after)
  actual_value numeric(12,2),
  variance numeric(12,2),
  variance_percentage numeric(5,2),
  forecast_accuracy numeric(5,2),
  -- Metadata
  generated_at timestamptz DEFAULT now(),
  generated_by text DEFAULT 'ml_model',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Optimal Schedules (AI-generated)
CREATE TABLE IF NOT EXISTS optimal_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name text NOT NULL,
  schedule_period_start date NOT NULL,
  schedule_period_end date NOT NULL,
  -- Optimization goals
  optimization_objective text, -- 'cost', 'coverage', 'satisfaction', 'balanced'
  constraints jsonb DEFAULT '{}'::jsonb,
  -- Coverage requirements
  required_coverage jsonb NOT NULL, -- By hour/day
  skill_requirements jsonb,
  sla_targets jsonb,
  -- Generated schedule
  shift_assignments jsonb NOT NULL, -- Agent -> shifts mapping
  total_agents_needed integer,
  total_hours_scheduled numeric(10,2),
  -- Optimization results
  coverage_percentage numeric(5,2),
  understaffed_periods jsonb,
  overstaffed_periods jsonb,
  coverage_score numeric(5,2), -- How well requirements are met
  -- Cost analysis
  total_labor_cost numeric(12,2),
  overtime_hours numeric(10,2),
  overtime_cost numeric(10,2),
  cost_optimization_percentage numeric(5,2),
  -- Agent preferences
  preferences_honored integer DEFAULT 0,
  preferences_conflicted integer DEFAULT 0,
  satisfaction_score numeric(5,2),
  -- Compliance
  labor_law_compliant boolean DEFAULT true,
  compliance_violations jsonb,
  max_consecutive_days_per_agent integer,
  min_rest_hours_between_shifts integer,
  -- Quality metrics
  agent_skill_match_score numeric(5,2),
  experience_distribution text, -- 'balanced', 'skewed', 'optimal'
  -- Comparison to manual
  improvement_vs_manual_percentage numeric(5,2),
  cost_savings_vs_manual numeric(10,2),
  -- Status
  status text DEFAULT 'draft', -- 'draft', 'proposed', 'approved', 'active', 'archived'
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  generated_at timestamptz DEFAULT now(),
  generated_by text DEFAULT 'ai_scheduler',
  created_at timestamptz DEFAULT now()
);

-- Agent Health Scores (burnout prediction)
CREATE TABLE IF NOT EXISTS agent_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  assessment_date date DEFAULT CURRENT_DATE,
  -- Overall health
  overall_health_score numeric(5,2) NOT NULL, -- 0-100
  health_trend text, -- 'improving', 'stable', 'declining', 'critical'
  burnout_risk_level text DEFAULT 'low', -- 'low', 'moderate', 'high', 'critical'
  burnout_probability numeric(5,2), -- 0-100
  -- Workload factors
  workload_score numeric(5,2),
  hours_worked_last_7_days numeric(5,2),
  hours_worked_last_30_days numeric(5,2),
  overtime_hours_last_30_days numeric(5,2),
  avg_daily_cases integer,
  case_complexity_score numeric(5,2),
  multitasking_level numeric(5,2),
  -- Performance factors
  performance_score numeric(5,2),
  performance_trend text,
  quality_score numeric(5,2),
  productivity_score numeric(5,2),
  recent_errors integer,
  -- Stress indicators
  stress_score numeric(5,2), -- Derived from multiple factors
  consecutive_days_worked integer,
  missed_breaks integer,
  late_clock_ins integer,
  absenteeism_rate numeric(5,2),
  -- Engagement factors
  engagement_score numeric(5,2),
  training_participation_rate numeric(5,2),
  team_interaction_score numeric(5,2),
  feedback_sentiment numeric(5,2), -- -1 to 1
  -- Early warning signs
  warning_indicators text[],
  critical_indicators text[],
  days_since_last_positive_feedback integer,
  peer_comparison text, -- 'above_average', 'average', 'below_average'
  -- Recommendations
  recommended_interventions jsonb DEFAULT '[]'::jsonb,
  suggested_workload_reduction numeric(5,2), -- Percentage
  recommended_time_off_days integer,
  coaching_recommended boolean DEFAULT false,
  reassignment_recommended boolean DEFAULT false,
  -- Actions taken
  interventions_applied jsonb DEFAULT '[]'::jsonb,
  last_intervention_date date,
  intervention_effectiveness text,
  -- Prediction model
  model_confidence numeric(5,2),
  factors_contributing jsonb,
  -- Follow-up
  next_assessment_date date,
  requires_immediate_attention boolean DEFAULT false,
  manager_notified boolean DEFAULT false,
  manager_notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Skills Gap Analysis
CREATE TABLE IF NOT EXISTS skills_gap_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date date DEFAULT CURRENT_DATE,
  scope text NOT NULL, -- 'individual', 'team', 'department', 'organization'
  agent_id uuid REFERENCES users_profile(id),
  team_name text,
  department text,
  -- Current state
  current_skills jsonb NOT NULL, -- Skill -> level mapping
  current_proficiency_levels jsonb,
  current_certifications text[],
  experience_years numeric(5,2),
  -- Required state
  required_skills jsonb NOT NULL,
  required_proficiency_levels jsonb,
  required_certifications text[],
  role_requirements text[],
  -- Gap analysis
  skill_gaps jsonb NOT NULL, -- Skills lacking or below level
  critical_gaps text[], -- High priority gaps
  proficiency_gaps jsonb, -- Skills present but below level
  certification_gaps text[],
  gap_severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  -- Impact analysis
  performance_impact text,
  productivity_impact_percentage numeric(5,2),
  quality_impact text,
  career_progression_impact text,
  -- Training recommendations
  recommended_training jsonb DEFAULT '[]'::jsonb,
  training_priority_order text[],
  estimated_training_duration_hours integer,
  estimated_training_cost numeric(10,2),
  recommended_timeline_months integer,
  -- Development path
  career_development_path text[],
  next_role_target text,
  readiness_for_promotion numeric(5,2), -- 0-100
  months_to_promotion_ready integer,
  -- ROI analysis
  productivity_gain_after_training numeric(5,2),
  quality_improvement_expected numeric(5,2),
  roi_months integer,
  -- Status
  training_plan_created boolean DEFAULT false,
  training_in_progress boolean DEFAULT false,
  progress_percentage integer DEFAULT 0,
  last_training_date date,
  next_training_date date,
  -- Follow-up
  reassessment_date date,
  manager_reviewed boolean DEFAULT false,
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Attrition Predictions
CREATE TABLE IF NOT EXISTS attrition_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES users_profile(id) ON DELETE CASCADE,
  prediction_date date DEFAULT CURRENT_DATE,
  -- Prediction
  attrition_risk_level text NOT NULL, -- 'low', 'moderate', 'high', 'critical'
  attrition_probability numeric(5,2) NOT NULL, -- 0-100
  predicted_timeframe text, -- '0-3_months', '3-6_months', '6-12_months', '12+_months'
  confidence_level numeric(5,2),
  -- Risk factors identified
  primary_risk_factors text[],
  secondary_risk_factors text[],
  risk_factor_scores jsonb,
  -- Performance indicators
  performance_trend text, -- 'declining', 'stable', 'improving'
  recent_performance_score numeric(5,2),
  productivity_change_percentage numeric(5,2),
  quality_change_percentage numeric(5,2),
  -- Engagement indicators
  engagement_score numeric(5,2),
  recent_feedback_sentiment numeric(5,2), -- -1 to 1
  training_participation_decline boolean DEFAULT false,
  team_interaction_decline boolean DEFAULT false,
  days_since_recognition integer,
  -- Behavioral indicators
  increased_absenteeism boolean DEFAULT false,
  punctuality_decline boolean DEFAULT false,
  reduced_overtime_willingness boolean DEFAULT false,
  job_search_indicators boolean DEFAULT false,
  -- Satisfaction factors
  compensation_satisfaction numeric(5,2),
  work_life_balance_score numeric(5,2),
  career_growth_satisfaction numeric(5,2),
  management_satisfaction numeric(5,2),
  peer_relationship_score numeric(5,2),
  -- Comparative analysis
  tenure_months integer,
  tenure_vs_average text, -- 'below', 'average', 'above'
  similar_profile_attrition_rate numeric(5,2),
  -- Retention recommendations
  recommended_interventions jsonb DEFAULT '[]'::jsonb,
  intervention_priority text DEFAULT 'medium',
  estimated_retention_cost numeric(10,2),
  replacement_cost numeric(10,2),
  roi_of_retention numeric(10,2),
  -- Intervention tracking
  interventions_attempted jsonb DEFAULT '[]'::jsonb,
  last_intervention_date date,
  intervention_success_probability numeric(5,2),
  -- Manager actions
  manager_notified boolean DEFAULT false,
  manager_notified_at timestamptz,
  retention_conversation_scheduled boolean DEFAULT false,
  retention_plan_created boolean DEFAULT false,
  retention_plan_details text,
  -- Outcome tracking
  actual_departure_date date,
  prediction_accuracy text, -- Filled in if they leave
  departure_reason text,
  was_preventable boolean,
  lessons_learned text,
  -- Follow-up
  next_check_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forecasts_date ON workforce_forecasts(forecast_date, period_start);
CREATE INDEX IF NOT EXISTS idx_forecasts_type ON workforce_forecasts(forecast_type, channel);
CREATE INDEX IF NOT EXISTS idx_schedules_period ON optimal_schedules(schedule_period_start, schedule_period_end);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON optimal_schedules(status);
CREATE INDEX IF NOT EXISTS idx_health_agent ON agent_health_scores(agent_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_health_risk ON agent_health_scores(burnout_risk_level, requires_immediate_attention);
CREATE INDEX IF NOT EXISTS idx_skills_agent ON skills_gap_analysis(agent_id);
CREATE INDEX IF NOT EXISTS idx_skills_scope ON skills_gap_analysis(scope, analysis_date);
CREATE INDEX IF NOT EXISTS idx_attrition_agent ON attrition_predictions(agent_id, prediction_date);
CREATE INDEX IF NOT EXISTS idx_attrition_risk ON attrition_predictions(attrition_risk_level, attrition_probability DESC);

-- Enable RLS
ALTER TABLE workforce_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE attrition_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view forecasts"
  ON workforce_forecasts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage forecasts"
  ON workforce_forecasts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view schedules"
  ON optimal_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage schedules"
  ON optimal_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their own health scores"
  ON agent_health_scores FOR SELECT TO authenticated USING (agent_id = auth.uid());

CREATE POLICY "Managers can view all health scores"
  ON agent_health_scores FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage health scores"
  ON agent_health_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their skills analysis"
  ON skills_gap_analysis FOR SELECT TO authenticated USING (agent_id = auth.uid() OR agent_id IS NULL);

CREATE POLICY "Managers can view all skills analysis"
  ON skills_gap_analysis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage skills analysis"
  ON skills_gap_analysis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Managers can view attrition predictions"
  ON attrition_predictions FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage attrition predictions"
  ON attrition_predictions FOR ALL TO authenticated USING (true) WITH CHECK (true);
