/*
  # Advanced Analytics & Business Intelligence

  This migration creates a comprehensive analytics and BI system:
  - Custom drag-and-drop dashboard builder
  - Predictive analytics for business metrics
  - Cost-per-contact optimization
  - Revenue per agent tracking
  - Client profitability analysis
  - Benchmarking against industry standards

  ## New Tables

  1. `custom_dashboards`
     - User-created dashboard configurations
     - Widget library and layouts
     - Sharing and permissions

  2. `analytics_widgets`
     - Reusable widget definitions
     - Data source configurations
     - Visualization settings

  3. `business_metrics`
     - Core business KPIs
     - Historical tracking
     - Trend analysis

  4. `cost_analysis`
     - Cost-per-contact calculations
     - Cost breakdown by dimension
     - Optimization opportunities

  5. `revenue_tracking`
     - Revenue per agent/client/process
     - Profitability analysis
     - Growth metrics

  6. `benchmarking_data`
     - Industry benchmark comparisons
     - Best-in-class metrics
     - Gap analysis

  7. `predictive_business_models`
     - ML models for business predictions
     - Forecast accuracy tracking
     - What-if scenario analysis

  ## Security
  - RLS enabled on all tables
  - Dashboard sharing controls
  - Sensitive financial data protection
*/

-- Custom Dashboards (user-built)
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  dashboard_type text DEFAULT 'operational',
  layout_config jsonb NOT NULL DEFAULT '{"type": "grid", "columns": 12, "rowHeight": 100}'::jsonb,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  global_filters jsonb DEFAULT '{}'::jsonb,
  date_range_default text DEFAULT 'last_30_days',
  refresh_interval_seconds integer DEFAULT 300,
  auto_refresh_enabled boolean DEFAULT true,
  owner_id uuid REFERENCES users_profile(id),
  visibility text DEFAULT 'private',
  shared_with_users uuid[],
  shared_with_roles text[],
  shared_with_clients uuid[],
  is_template boolean DEFAULT false,
  view_count integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  last_viewed_at timestamptz,
  avg_time_spent_seconds integer,
  is_active boolean DEFAULT true,
  is_favorite boolean DEFAULT false,
  tags text[],
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Analytics Widgets (reusable components)
CREATE TABLE IF NOT EXISTS analytics_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_name text NOT NULL,
  widget_type text NOT NULL,
  description text,
  category text,
  data_source_type text NOT NULL,
  data_source_config jsonb NOT NULL,
  data_refresh_frequency text DEFAULT 'realtime',
  chart_type text,
  visualization_config jsonb DEFAULT '{}'::jsonb,
  color_scheme text DEFAULT 'default',
  aggregation_method text,
  calculation_formula text,
  dimensions text[],
  measures text[],
  default_filters jsonb DEFAULT '{}'::jsonb,
  required_filters text[],
  optional_filters text[],
  is_drilldownable boolean DEFAULT false,
  drilldown_levels jsonb,
  click_actions jsonb,
  cache_enabled boolean DEFAULT true,
  cache_duration_seconds integer DEFAULT 300,
  max_data_points integer DEFAULT 1000,
  is_public boolean DEFAULT false,
  requires_permissions text[],
  min_role_required text,
  times_used integer DEFAULT 0,
  avg_load_time_ms integer,
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Business Metrics (core KPIs)
CREATE TABLE IF NOT EXISTS business_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(15,2) NOT NULL,
  client_id uuid,
  department text,
  team text,
  agent_id uuid REFERENCES users_profile(id),
  process_id uuid,
  channel text,
  period_type text DEFAULT 'daily',
  fiscal_period text,
  target_value numeric(15,2),
  variance numeric(15,2),
  variance_percentage numeric(5,2),
  vs_target text,
  benchmark_value numeric(15,2),
  vs_benchmark text,
  previous_period_value numeric(15,2),
  period_over_period_change numeric(15,2),
  period_over_period_percentage numeric(5,2),
  trend_direction text,
  confidence_level numeric(5,2),
  data_quality_score numeric(5,2),
  sample_size integer,
  calculation_method text,
  data_sources text[],
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Cost Analysis
CREATE TABLE IF NOT EXISTS cost_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_date date NOT NULL,
  analysis_period text DEFAULT 'daily',
  client_id uuid,
  department text,
  team text,
  agent_id uuid REFERENCES users_profile(id),
  process_id uuid,
  channel text,
  total_contacts integer DEFAULT 0,
  total_tickets integer DEFAULT 0,
  total_transactions integer DEFAULT 0,
  labor_cost numeric(12,2) DEFAULT 0,
  technology_cost numeric(12,2) DEFAULT 0,
  infrastructure_cost numeric(12,2) DEFAULT 0,
  training_cost numeric(12,2) DEFAULT 0,
  overhead_cost numeric(12,2) DEFAULT 0,
  total_cost numeric(12,2) DEFAULT 0,
  cost_per_contact numeric(10,2),
  cost_per_ticket numeric(10,2),
  cost_per_minute numeric(10,2),
  cost_per_transaction numeric(10,2),
  cost_per_resolution numeric(10,2),
  contacts_per_agent_hour numeric(10,2),
  revenue_per_cost_dollar numeric(10,2),
  efficiency_score numeric(5,2),
  vs_previous_period_cost numeric(12,2),
  cost_trend_percentage numeric(5,2),
  vs_budget numeric(12,2),
  budget_variance_percentage numeric(5,2),
  vs_industry_benchmark numeric(10,2),
  potential_savings numeric(12,2),
  optimization_recommendations jsonb DEFAULT '[]'::jsonb,
  waste_identified numeric(12,2),
  efficiency_opportunities text[],
  revenue_generated numeric(12,2),
  gross_profit numeric(12,2),
  gross_margin_percentage numeric(5,2),
  net_profit numeric(12,2),
  net_margin_percentage numeric(5,2),
  quality_cost numeric(12,2),
  rework_cost numeric(12,2),
  escalation_cost numeric(12,2),
  calculation_notes text,
  data_quality_score numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Revenue Tracking
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_date date NOT NULL,
  period_type text DEFAULT 'daily',
  client_id uuid,
  department text,
  agent_id uuid REFERENCES users_profile(id),
  process_id uuid,
  service_type text,
  service_revenue numeric(12,2) DEFAULT 0,
  transaction_revenue numeric(12,2) DEFAULT 0,
  performance_bonus_revenue numeric(12,2) DEFAULT 0,
  additional_services_revenue numeric(12,2) DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  revenue_per_agent numeric(10,2),
  revenue_per_contact numeric(10,2),
  revenue_per_transaction numeric(10,2),
  revenue_per_hour numeric(10,2),
  contacts_handled integer DEFAULT 0,
  transactions_processed integer DEFAULT 0,
  agent_hours numeric(10,2) DEFAULT 0,
  vs_previous_period numeric(12,2),
  growth_percentage numeric(5,2),
  vs_target numeric(12,2),
  attainment_percentage numeric(5,2),
  associated_costs numeric(12,2),
  gross_profit numeric(12,2),
  gross_margin_percentage numeric(5,2),
  contribution_margin numeric(12,2),
  contribution_margin_percentage numeric(5,2),
  client_lifetime_value numeric(12,2),
  customer_acquisition_cost numeric(10,2),
  ltv_to_cac_ratio numeric(5,2),
  revenue_at_risk numeric(12,2),
  revenue_retention_rate numeric(5,2),
  upsell_revenue numeric(12,2),
  cross_sell_revenue numeric(12,2),
  forecasted_revenue numeric(12,2),
  forecast_confidence numeric(5,2),
  forecast_variance numeric(12,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Benchmarking Data
CREATE TABLE IF NOT EXISTS benchmarking_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_date date NOT NULL,
  benchmark_category text NOT NULL,
  metric_name text NOT NULL,
  benchmark_value numeric(15,2) NOT NULL,
  benchmark_range_min numeric(15,2),
  benchmark_range_max numeric(15,2),
  percentile_25 numeric(15,2),
  percentile_50 numeric(15,2),
  percentile_75 numeric(15,2),
  percentile_90 numeric(15,2),
  industry text,
  geography text,
  company_size text,
  specialization text,
  source text NOT NULL,
  source_organization text,
  data_collection_date date,
  sample_size integer,
  confidence_level numeric(5,2),
  our_value numeric(15,2),
  gap_to_benchmark numeric(15,2),
  gap_percentage numeric(5,2),
  performance_tier text,
  gap_analysis text,
  improvement_potential numeric(15,2),
  improvement_recommendations text[],
  time_to_close_gap_months integer,
  notes text,
  is_current boolean DEFAULT true,
  superseded_by_id uuid REFERENCES benchmarking_data(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Predictive Business Models
CREATE TABLE IF NOT EXISTS predictive_business_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_type text NOT NULL,
  prediction_target text NOT NULL,
  prediction_category text,
  algorithm text,
  features_used text[] NOT NULL,
  hyperparameters jsonb,
  training_data_start_date date,
  training_data_end_date date,
  training_sample_size integer,
  training_completed_at timestamptz,
  training_duration_minutes integer,
  accuracy_score numeric(5,2),
  precision_score numeric(5,2),
  recall_score numeric(5,2),
  f1_score numeric(5,2),
  mae numeric(15,2),
  rmse numeric(15,2),
  r_squared numeric(5,2),
  validation_method text,
  validation_score numeric(5,2),
  overfitting_check jsonb,
  predictions_made integer DEFAULT 0,
  predictions_accurate integer DEFAULT 0,
  production_accuracy numeric(5,2),
  avg_prediction_error numeric(15,2),
  model_drift_detected boolean DEFAULT false,
  last_drift_check_date date,
  needs_retraining boolean DEFAULT false,
  retraining_threshold numeric(5,2),
  is_active boolean DEFAULT true,
  version text NOT NULL,
  replaced_by_model_id uuid REFERENCES predictive_business_models(id),
  deployment_date date,
  retirement_date date,
  created_by uuid REFERENCES users_profile(id),
  description text,
  business_justification text,
  expected_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prediction Results (from business models)
CREATE TABLE IF NOT EXISTS prediction_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES predictive_business_models(id) ON DELETE CASCADE,
  prediction_date date NOT NULL,
  prediction_for_date date NOT NULL,
  predicted_value numeric(15,2) NOT NULL,
  prediction_confidence numeric(5,2),
  prediction_range_min numeric(15,2),
  prediction_range_max numeric(15,2),
  input_features jsonb NOT NULL,
  prediction_factors jsonb,
  assumptions jsonb,
  scenario_type text DEFAULT 'baseline',
  scenario_adjustments jsonb,
  actual_value numeric(15,2),
  prediction_error numeric(15,2),
  error_percentage numeric(5,2),
  was_accurate boolean,
  used_for_decision text,
  decision_impact text,
  business_value_generated numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboards_owner ON custom_dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_type ON custom_dashboards(dashboard_type, is_active);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON analytics_widgets(widget_type, category);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON business_metrics(metric_date, metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON business_metrics(metric_name, client_id);
CREATE INDEX IF NOT EXISTS idx_cost_date ON cost_analysis(analysis_date, client_id);
CREATE INDEX IF NOT EXISTS idx_cost_efficiency ON cost_analysis(cost_per_contact, efficiency_score DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_tracking(revenue_date, client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_agent ON revenue_tracking(agent_id, revenue_date);
CREATE INDEX IF NOT EXISTS idx_benchmarking_metric ON benchmarking_data(metric_name, benchmark_category);
CREATE INDEX IF NOT EXISTS idx_models_active ON predictive_business_models(is_active, prediction_category);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON prediction_results(model_id, prediction_date);

-- Enable RLS
ALTER TABLE custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarking_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_business_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their dashboards"
  ON custom_dashboards FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR visibility = 'organization' OR auth.uid() = ANY(shared_with_users));

CREATE POLICY "Users can manage their dashboards"
  ON custom_dashboards FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view widgets"
  ON analytics_widgets FOR SELECT TO authenticated USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can manage their widgets"
  ON analytics_widgets FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view business metrics"
  ON business_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view cost analysis"
  ON cost_analysis FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view revenue tracking"
  ON revenue_tracking FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view benchmarking data"
  ON benchmarking_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage benchmarking data"
  ON benchmarking_data FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view models"
  ON predictive_business_models FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage models"
  ON predictive_business_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view predictions"
  ON prediction_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can create predictions"
  ON prediction_results FOR INSERT TO authenticated WITH CHECK (true);