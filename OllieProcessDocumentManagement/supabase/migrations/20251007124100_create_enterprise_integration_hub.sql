/*
  # Enterprise Integration Hub
  
  ## Tables
  1. integration_connections - API/System connections
  2. integration_webhooks - Webhook configurations
  3. integration_logs - Integration activity log
  4. integration_mappings - Data mapping configurations
  5. integration_schedules - Scheduled integrations
*/

-- Integration Connections
CREATE TABLE IF NOT EXISTS integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_name text NOT NULL,
  connection_type text NOT NULL,
  base_url text,
  auth_type text NOT NULL,
  auth_config jsonb,
  headers jsonb,
  is_active boolean DEFAULT true,
  last_test_at timestamptz,
  last_test_status text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Webhook Configurations
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name text NOT NULL,
  webhook_url text NOT NULL,
  trigger_event text NOT NULL,
  webhook_method text DEFAULT 'POST',
  headers jsonb,
  payload_template jsonb,
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  last_triggered_at timestamptz,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Integration Activity Log
CREATE TABLE IF NOT EXISTS integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type text NOT NULL,
  integration_id uuid,
  direction text NOT NULL,
  status text NOT NULL,
  request_data jsonb,
  response_data jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Data Mapping Configurations
CREATE TABLE IF NOT EXISTS integration_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_name text NOT NULL,
  source_system text NOT NULL,
  target_system text NOT NULL,
  entity_type text NOT NULL,
  field_mappings jsonb NOT NULL,
  transformation_rules jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Scheduled Integrations
CREATE TABLE IF NOT EXISTS integration_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name text NOT NULL,
  connection_id uuid REFERENCES integration_connections(id) ON DELETE CASCADE NOT NULL,
  schedule_type text NOT NULL,
  cron_expression text,
  interval_minutes integer,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  last_run_status text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connections_active ON integration_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_event ON integration_webhooks(trigger_event, is_active);
CREATE INDEX IF NOT EXISTS idx_logs_created ON integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_mappings_systems ON integration_mappings(source_system, target_system);
CREATE INDEX IF NOT EXISTS idx_schedules_next_run ON integration_schedules(next_run_at, is_active);

-- Enable RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View connections" ON integration_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage connections" ON integration_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View webhooks" ON integration_webhooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage webhooks" ON integration_webhooks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View logs" ON integration_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage logs" ON integration_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View mappings" ON integration_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage mappings" ON integration_mappings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View schedules" ON integration_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage schedules" ON integration_schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to log integration event
CREATE OR REPLACE FUNCTION log_integration_event(
  p_type text,
  p_integration_id uuid,
  p_direction text,
  p_status text,
  p_request jsonb DEFAULT NULL,
  p_response jsonb DEFAULT NULL,
  p_error text DEFAULT NULL,
  p_duration_ms integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO integration_logs (
    integration_type,
    integration_id,
    direction,
    status,
    request_data,
    response_data,
    error_message,
    duration_ms
  )
  VALUES (
    p_type,
    p_integration_id,
    p_direction,
    p_status,
    p_request,
    p_response,
    p_error,
    p_duration_ms
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to update webhook stats
CREATE OR REPLACE FUNCTION update_webhook_stats(
  p_webhook_id uuid,
  p_success boolean
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE integration_webhooks
  SET 
    last_triggered_at = now(),
    success_count = CASE WHEN p_success THEN success_count + 1 ELSE success_count END,
    failure_count = CASE WHEN NOT p_success THEN failure_count + 1 ELSE failure_count END
  WHERE id = p_webhook_id;
END;
$$;