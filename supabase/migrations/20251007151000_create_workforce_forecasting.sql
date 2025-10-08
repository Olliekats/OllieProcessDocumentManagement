/*
  # Workforce Forecasting Tables

  1. New Tables
    - `demand_forecasts` - Stores predicted call/interaction volumes
    - `forecast_actuals` - Actual volumes for comparison
    - `seasonality_patterns` - Identified seasonal trends
    - `schedule_templates` - Reusable shift templates
    - `agent_schedules` - Individual agent schedules

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users

  3. Functions
    - Calculate forecast accuracy
    - Identify peak periods
*/

-- Demand Forecasts Table
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date date NOT NULL,
  interval_start time NOT NULL,
  interval_end time NOT NULL,
  channel text NOT NULL CHECK (channel IN ('voice', 'chat', 'email', 'all')),
  predicted_volume integer NOT NULL,
  predicted_aht numeric(10,2) NOT NULL,
  confidence_level numeric(5,2) DEFAULT 80,
  model_version text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(forecast_date, interval_start, channel)
);

-- Forecast Actuals Table
CREATE TABLE IF NOT EXISTS forecast_actuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id uuid REFERENCES demand_forecasts(id) ON DELETE CASCADE,
  actual_volume integer NOT NULL,
  actual_aht numeric(10,2) NOT NULL,
  variance_volume integer GENERATED ALWAYS AS (actual_volume - (SELECT predicted_volume FROM demand_forecasts WHERE id = forecast_id)) STORED,
  variance_percent numeric(10,2),
  recorded_at timestamptz DEFAULT now()
);

-- Seasonality Patterns Table
CREATE TABLE IF NOT EXISTS seasonality_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name text NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('daily', 'weekly', 'monthly', 'yearly', 'holiday')),
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month integer CHECK (day_of_month BETWEEN 1 AND 31),
  month integer CHECK (month BETWEEN 1 AND 12),
  hour_of_day integer CHECK (hour_of_day BETWEEN 0 AND 23),
  multiplier numeric(5,2) NOT NULL DEFAULT 1.0,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Schedule Templates Table
CREATE TABLE IF NOT EXISTS schedule_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  description text,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  break_duration_minutes integer DEFAULT 30,
  lunch_duration_minutes integer DEFAULT 30,
  days_of_week integer[] DEFAULT ARRAY[1,2,3,4,5],
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent Schedules Table
CREATE TABLE IF NOT EXISTS agent_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id),
  schedule_date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  template_id uuid REFERENCES schedule_templates(id),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'absent', 'late')),
  actual_start time,
  actual_end time,
  break_minutes integer DEFAULT 30,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, schedule_date, shift_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON demand_forecasts(forecast_date, interval_start);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_channel ON demand_forecasts(channel);
CREATE INDEX IF NOT EXISTS idx_forecast_actuals_forecast ON forecast_actuals(forecast_id);
CREATE INDEX IF NOT EXISTS idx_seasonality_patterns_type ON seasonality_patterns(pattern_type, is_active);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_active ON schedule_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_schedules_agent_date ON agent_schedules(agent_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_agent_schedules_date ON agent_schedules(schedule_date);

-- Enable Row Level Security
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonality_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view forecasts"
  ON demand_forecasts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create forecasts"
  ON demand_forecasts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own forecasts"
  ON demand_forecasts FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can view actuals"
  ON forecast_actuals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert actuals"
  ON forecast_actuals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view seasonality patterns"
  ON seasonality_patterns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage seasonality patterns"
  ON seasonality_patterns FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can view schedule templates"
  ON schedule_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage schedule templates"
  ON schedule_templates FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can view all schedules"
  ON agent_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage schedules"
  ON agent_schedules FOR ALL
  TO authenticated
  USING (true);

-- Function to calculate forecast accuracy
CREATE OR REPLACE FUNCTION calculate_forecast_accuracy(
  start_date date,
  end_date date
)
RETURNS TABLE (
  channel text,
  total_forecasts bigint,
  avg_variance_percent numeric,
  accuracy_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    df.channel,
    COUNT(*) as total_forecasts,
    AVG(ABS(fa.variance_percent)) as avg_variance_percent,
    100 - AVG(ABS(fa.variance_percent)) as accuracy_rate
  FROM demand_forecasts df
  INNER JOIN forecast_actuals fa ON df.id = fa.forecast_id
  WHERE df.forecast_date BETWEEN start_date AND end_date
  GROUP BY df.channel;
END;
$$ LANGUAGE plpgsql;

-- Function to identify peak periods
CREATE OR REPLACE FUNCTION identify_peak_periods(
  target_date date,
  threshold_multiplier numeric DEFAULT 1.5
)
RETURNS TABLE (
  interval_start time,
  interval_end time,
  predicted_volume integer,
  is_peak boolean
) AS $$
DECLARE
  avg_volume numeric;
BEGIN
  SELECT AVG(predicted_volume) INTO avg_volume
  FROM demand_forecasts
  WHERE forecast_date = target_date;

  RETURN QUERY
  SELECT
    df.interval_start,
    df.interval_end,
    df.predicted_volume,
    (df.predicted_volume > avg_volume * threshold_multiplier) as is_peak
  FROM demand_forecasts df
  WHERE df.forecast_date = target_date
  ORDER BY df.interval_start;
END;
$$ LANGUAGE plpgsql;

-- Function to generate schedule recommendations
CREATE OR REPLACE FUNCTION generate_schedule_recommendations(
  target_date date,
  target_service_level numeric DEFAULT 80
)
RETURNS TABLE (
  interval_start time,
  interval_end time,
  predicted_volume integer,
  recommended_agents integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    df.interval_start,
    df.interval_end,
    df.predicted_volume,
    CEIL((df.predicted_volume * df.predicted_aht / 30.0) * 1.2)::integer as recommended_agents
  FROM demand_forecasts df
  WHERE df.forecast_date = target_date
  ORDER BY df.interval_start;
END;
$$ LANGUAGE plpgsql;
