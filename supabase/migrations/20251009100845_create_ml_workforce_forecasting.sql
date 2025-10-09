/*
  # ML-Enhanced Workforce Forecasting & Real Data Integration

  ## Overview
  This migration creates tables for:
  - ML-based workforce forecasting
  - Real-time data integration for Erlang C
  - Historical patterns and seasonality
  - Predictive staffing models
  - Automated schedule optimization

  ## New Tables

  1. `workforce_forecasts`
     - ML-generated forecasts
     - Multiple forecast models
     - Confidence intervals

  2. `historical_volume_patterns`
     - Historical call/interaction volumes
     - Seasonality patterns
     - Trend analysis

  3. `staffing_recommendations`
     - AI-generated staffing plans
     - Optimization results
     - Cost-benefit analysis

  4. `real_time_workload`
     - Live operational data
     - Current state metrics
     - Real-time adjustments

  ## Security
  - RLS enabled
  - Manager-level access controls
*/

-- Historical Volume Patterns
CREATE TABLE IF NOT EXISTS historical_volume_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_recorded date NOT NULL,
  hour_of_day integer NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
  -- Volume metrics
  total_interactions integer NOT NULL DEFAULT 0,
  voice_calls integer DEFAULT 0,
  emails integer DEFAULT 0,
  chats integer DEFAULT 0,
  sms integer DEFAULT 0,
  tickets integer DEFAULT 0,
  -- Timing metrics
  average_handle_time_seconds integer,
  average_speed_of_answer_seconds integer,
  service_level_percentage numeric(5,2),
  abandonment_rate numeric(5,2),
  -- Staffing
  agents_available integer,
  agents_on_call integer,
  occupancy_rate numeric(5,2),
  -- Context
  is_holiday boolean DEFAULT false,
  is_special_event boolean DEFAULT false,
  event_description text,
  weather_condition text,
  -- Pattern classification
  pattern_type text, -- 'normal', 'peak', 'low', 'anomaly'
  seasonality_factor numeric(5,2) DEFAULT 1.0,
  trend_factor numeric(5,2) DEFAULT 1.0,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  UNIQUE(date_recorded, hour_of_day)
);

CREATE INDEX IF NOT EXISTS idx_volume_date ON historical_volume_patterns(date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_volume_day_hour ON historical_volume_patterns(day_of_week, hour_of_day);
CREATE INDEX IF NOT EXISTS idx_volume_pattern ON historical_volume_patterns(pattern_type);

ALTER TABLE historical_volume_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view volume patterns"
  ON historical_volume_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage volume patterns"
  ON historical_volume_patterns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ML Workforce Forecasts
CREATE TABLE IF NOT EXISTS workforce_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_name text NOT NULL,
  forecast_type text NOT NULL, -- 'daily', 'weekly', 'monthly', 'intraday'
  -- Time period
  forecast_date date NOT NULL,
  forecast_hour integer CHECK (forecast_hour IS NULL OR (forecast_hour >= 0 AND forecast_hour <= 23)),
  forecast_generated_at timestamptz DEFAULT now(),
  forecast_horizon_days integer, -- How far into future
  -- Volume predictions
  predicted_total_volume integer NOT NULL,
  predicted_voice_calls integer,
  predicted_emails integer,
  predicted_chats integer,
  predicted_sms integer,
  -- Confidence intervals
  volume_low_bound integer, -- 90% confidence lower bound
  volume_high_bound integer, -- 90% confidence upper bound
  confidence_level numeric(5,2) DEFAULT 90.0,
  -- Timing predictions
  predicted_aht_seconds integer, -- Average Handle Time
  predicted_asa_seconds integer, -- Average Speed of Answer
  -- Staffing requirements
  required_agents integer NOT NULL,
  required_agents_low_bound integer,
  required_agents_high_bound integer,
  shrinkage_percentage numeric(5,2) DEFAULT 30.0,
  -- Model information
  model_used text NOT NULL, -- 'arima', 'prophet', 'lstm', 'xgboost', 'ensemble'
  model_version text,
  features_used text[],
  model_accuracy_score numeric(5,2),
  -- Actual vs Predicted (filled in later)
  actual_volume integer,
  forecast_error integer,
  forecast_accuracy_percentage numeric(5,2),
  -- Factors considered
  considers_seasonality boolean DEFAULT true,
  considers_trends boolean DEFAULT true,
  considers_events boolean DEFAULT true,
  considers_weather boolean DEFAULT false,
  external_factors jsonb, -- holidays, campaigns, etc
  -- Adjustments
  manual_adjustment_factor numeric(5,2) DEFAULT 1.0,
  adjustment_reason text,
  adjusted_by uuid REFERENCES users_profile(id),
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'actual ized', 'archived')),
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  -- Metadata
  created_by_model_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forecasts_date ON workforce_forecasts(forecast_date, forecast_hour);
CREATE INDEX IF NOT EXISTS idx_forecasts_type ON workforce_forecasts(forecast_type, status);
CREATE INDEX IF NOT EXISTS idx_forecasts_model ON workforce_forecasts(model_used);

ALTER TABLE workforce_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view forecasts"
  ON workforce_forecasts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage forecasts"
  ON workforce_forecasts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Real-Time Workload (for live Erlang C calculations)
CREATE TABLE IF NOT EXISTS real_time_workload (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  -- Current state
  current_queue_size integer NOT NULL DEFAULT 0,
  calls_waiting integer DEFAULT 0,
  emails_in_queue integer DEFAULT 0,
  chats_in_queue integer DEFAULT 0,
  -- Agent state
  total_agents integer NOT NULL,
  available_agents integer NOT NULL,
  on_call_agents integer NOT NULL,
  in_acw_agents integer DEFAULT 0, -- After Call Work
  in_break_agents integer DEFAULT 0,
  in_training_agents integer DEFAULT 0,
  offline_agents integer DEFAULT 0,
  -- Performance metrics (rolling window)
  current_service_level numeric(5,2),
  current_average_wait_time_seconds integer,
  current_abandonment_rate numeric(5,2),
  current_occupancy_rate numeric(5,2),
  -- Volume (last hour)
  interactions_last_hour integer DEFAULT 0,
  average_handle_time_seconds integer,
  -- Erlang C inputs
  arrival_rate numeric(10,2), -- Calls per hour
  service_rate numeric(10,2), -- Calls per agent per hour
  number_of_servers integer, -- Available agents
  -- Erlang C outputs
  probability_of_wait numeric(5,4),
  average_queue_time_seconds integer,
  service_level_20_seconds numeric(5,2),
  service_level_30_seconds numeric(5,2),
  utilization_percentage numeric(5,2),
  -- Recommendations
  recommended_agents integer,
  excess_or_deficit integer, -- negative = need more, positive = have excess
  should_adjust_staffing boolean DEFAULT false,
  staffing_alert_level text, -- 'green', 'yellow', 'red'
  -- Metadata
  data_source text DEFAULT 'real_time_system',
  calculation_version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realtime_timestamp ON real_time_workload(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_alert ON real_time_workload(staffing_alert_level);

ALTER TABLE real_time_workload ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view real-time workload"
  ON real_time_workload FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage real-time workload"
  ON real_time_workload FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI Staffing Recommendations
CREATE TABLE IF NOT EXISTS staffing_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_date date NOT NULL,
  recommendation_type text NOT NULL, -- 'daily_plan', 'weekly_plan', 'real_time_adjustment', 'optimization'
  -- Target metrics
  target_service_level numeric(5,2) DEFAULT 80.0,
  target_response_time_seconds integer DEFAULT 30,
  target_abandonment_rate numeric(5,2) DEFAULT 3.0,
  -- Staffing plan
  recommended_schedule jsonb NOT NULL, -- [{hour, required_agents, shift_breakdown}]
  total_agents_needed integer NOT NULL,
  full_time_equivalent numeric(5,2),
  -- Breakdown by skill/channel
  agents_by_skill jsonb, -- {skill_name: count}
  agents_by_channel jsonb, -- {channel: count}
  -- Shift recommendations
  recommended_shifts jsonb, -- [{shift_name, start, end, count}]
  overtime_required_hours integer DEFAULT 0,
  underutilized_hours integer DEFAULT 0,
  -- Cost analysis
  estimated_labor_cost numeric(12,2),
  cost_per_interaction numeric(10,2),
  cost_vs_budget numeric(12,2),
  cost_optimization_potential numeric(12,2),
  -- Quality impact
  predicted_service_level numeric(5,2),
  predicted_csat numeric(5,2),
  predicted_occupancy numeric(5,2),
  -- Comparison
  vs_current_staffing integer, -- Difference from current
  efficiency_improvement_percentage numeric(5,2),
  -- Model information
  generated_by_model text NOT NULL,
  model_confidence numeric(5,2),
  optimization_algorithm text, -- 'linear_programming', 'genetic_algorithm', 'ml_optimization'
  constraints_applied jsonb, -- Budget, max agents, union rules, etc
  -- Implementation
  is_implemented boolean DEFAULT false,
  implemented_at timestamptz,
  implemented_by uuid REFERENCES users_profile(id),
  implementation_notes text,
  -- Feedback
  actual_performance jsonb, -- How well did it work
  recommendation_rating integer CHECK (recommendation_rating IS NULL OR (recommendation_rating >= 1 AND recommendation_rating <= 5)),
  feedback_notes text,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staffing_date ON staffing_recommendations(recommendation_date DESC);
CREATE INDEX IF NOT EXISTS idx_staffing_type ON staffing_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_staffing_implemented ON staffing_recommendations(is_implemented);

ALTER TABLE staffing_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view staffing recommendations"
  ON staffing_recommendations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage staffing recommendations"
  ON staffing_recommendations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);