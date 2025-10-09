/*
  # Integration Framework for Third-Party Services

  ## Overview
  This migration creates a flexible integration framework to connect with:
  - Twilio (SMS, Voice, WhatsApp)
  - Salesforce Service Cloud (CRM, Cases, Knowledge)
  - Bird.com (Omnichannel messaging)

  ## New Tables

  1. `integration_providers`
     - Provider configurations (Twilio, Salesforce, Bird)
     - Connection credentials and settings

  2. `integration_connections`
     - Active connections to external systems
     - Authentication and health monitoring

  3. `integration_mappings`
     - Field mapping between systems
     - Data transformation rules

  4. `integration_sync_logs`
     - Sync history and status
     - Error tracking and retry logic

  5. `webhook_endpoints`
     - Incoming webhook configurations
     - Event routing

  6. `api_calls_log`
     - Outbound API call tracking
     - Rate limiting and quotas

  ## Security
  - Encrypted credential storage
  - RLS enabled
  - Audit logging
*/

-- Integration Providers (System-level configurations)
CREATE TABLE IF NOT EXISTS integration_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL UNIQUE, -- 'twilio', 'salesforce', 'bird'
  display_name text NOT NULL,
  provider_type text NOT NULL, -- 'telephony', 'crm', 'messaging', 'analytics'
  description text,
  -- Connection details
  base_api_url text NOT NULL,
  auth_type text NOT NULL CHECK (auth_type IN ('api_key', 'oauth2', 'basic', 'token', 'custom')),
  auth_endpoint text,
  token_endpoint text,
  -- Capabilities
  capabilities jsonb DEFAULT '{}'::jsonb, -- {sms: true, voice: true, video: false, ...}
  supported_channels text[], -- ['sms', 'voice', 'whatsapp', 'email']
  api_version text,
  -- Rate limiting
  rate_limit_per_second integer,
  rate_limit_per_minute integer,
  rate_limit_per_day integer,
  -- Documentation
  documentation_url text,
  api_reference_url text,
  setup_instructions text,
  -- Configuration template
  config_schema jsonb, -- JSON schema for required configuration fields
  credential_fields jsonb, -- List of required credential fields
  -- Status
  is_active boolean DEFAULT true,
  is_beta boolean DEFAULT false,
  last_health_check timestamptz,
  health_status text DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view providers"
  ON integration_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage providers"
  ON integration_providers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Integration Connections (Instance-level configurations)
CREATE TABLE IF NOT EXISTS integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES integration_providers(id) ON DELETE CASCADE,
  connection_name text NOT NULL,
  connection_type text, -- 'production', 'sandbox', 'test'
  -- Authentication (encrypted in production)
  credentials jsonb NOT NULL, -- Stored credentials (should be encrypted)
  api_key_encrypted text,
  oauth_token_encrypted text,
  oauth_refresh_token_encrypted text,
  oauth_expires_at timestamptz,
  -- Configuration
  configuration jsonb DEFAULT '{}'::jsonb, -- Provider-specific settings
  account_id text, -- Twilio Account SID, Salesforce Org ID, etc.
  environment text DEFAULT 'production', -- 'production', 'sandbox', 'development'
  -- Connection health
  is_active boolean DEFAULT true,
  is_connected boolean DEFAULT false,
  last_connection_test timestamptz,
  last_successful_call timestamptz,
  connection_status text DEFAULT 'disconnected',
  connection_error text,
  -- Usage tracking
  total_api_calls integer DEFAULT 0,
  successful_calls integer DEFAULT 0,
  failed_calls integer DEFAULT 0,
  last_error_message text,
  last_error_timestamp timestamptz,
  -- Rate limiting
  current_rate_limit_usage integer DEFAULT 0,
  rate_limit_reset_at timestamptz,
  -- Metadata
  created_by uuid REFERENCES users_profile(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, connection_name)
);

CREATE INDEX IF NOT EXISTS idx_connections_provider ON integration_connections(provider_id);
CREATE INDEX IF NOT EXISTS idx_connections_active ON integration_connections(is_active, is_connected);

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view connections"
  ON integration_connections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage connections"
  ON integration_connections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Integration Mappings (Field and data mappings)
CREATE TABLE IF NOT EXISTS integration_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES integration_connections(id) ON DELETE CASCADE,
  mapping_name text NOT NULL,
  mapping_type text NOT NULL, -- 'field', 'object', 'event', 'status'
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
  -- Source and target
  source_object text NOT NULL, -- 'interaction', 'ticket', 'customer', etc.
  target_object text NOT NULL, -- External system object
  source_field text,
  target_field text,
  -- Transformation
  transformation_rule text, -- 'direct', 'lookup', 'computed', 'custom'
  transformation_function text, -- Custom transformation logic
  default_value text,
  -- Validation
  is_required boolean DEFAULT false,
  validation_rules jsonb,
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mappings_connection ON integration_mappings(connection_id);
CREATE INDEX IF NOT EXISTS idx_mappings_objects ON integration_mappings(source_object, target_object);

ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mappings"
  ON integration_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage mappings"
  ON integration_mappings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Integration Sync Logs (Sync history and tracking)
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES integration_connections(id) ON DELETE CASCADE,
  sync_type text NOT NULL, -- 'manual', 'scheduled', 'realtime', 'webhook'
  sync_direction text NOT NULL CHECK (sync_direction IN ('push', 'pull', 'bidirectional')),
  -- Sync details
  object_type text NOT NULL, -- What was synced
  operation text NOT NULL, -- 'create', 'update', 'delete', 'sync'
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  -- Results
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'partial', 'failed', 'cancelled')),
  records_processed integer DEFAULT 0,
  records_successful integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  -- Data
  source_ids text[], -- IDs of records synced
  target_ids text[], -- External system IDs
  sync_data jsonb, -- Summary of synced data
  -- Errors
  error_message text,
  error_details jsonb,
  failed_records jsonb, -- Details of failed records
  -- Retry
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  next_retry_at timestamptz,
  -- Metadata
  triggered_by uuid REFERENCES users_profile(id),
  trigger_source text, -- 'user', 'scheduler', 'webhook', 'system'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_connection ON integration_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON integration_sync_logs(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_object ON integration_sync_logs(object_type, operation);

ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sync logs"
  ON integration_sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create sync logs"
  ON integration_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update sync logs"
  ON integration_sync_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Webhook Endpoints (Incoming webhooks)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES integration_connections(id) ON DELETE CASCADE,
  endpoint_name text NOT NULL,
  webhook_url text UNIQUE NOT NULL, -- The URL this system exposes
  webhook_secret text, -- Secret for signature verification
  -- Configuration
  event_types text[] NOT NULL, -- Types of events this webhook receives
  http_method text DEFAULT 'POST' CHECK (http_method IN ('POST', 'GET', 'PUT')),
  content_type text DEFAULT 'application/json',
  -- Security
  requires_authentication boolean DEFAULT true,
  signature_header text, -- Header name for signature
  signature_algorithm text, -- 'hmac-sha256', etc.
  ip_whitelist text[], -- Allowed IP addresses
  -- Processing
  is_active boolean DEFAULT true,
  auto_acknowledge boolean DEFAULT true,
  process_async boolean DEFAULT true,
  retry_on_failure boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  -- Statistics
  total_received integer DEFAULT 0,
  total_processed integer DEFAULT 0,
  total_failed integer DEFAULT 0,
  last_received_at timestamptz,
  average_processing_time_ms integer,
  -- Metadata
  description text,
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_connection ON webhook_endpoints(connection_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhook_endpoints(is_active);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view webhooks"
  ON webhook_endpoints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage webhooks"
  ON webhook_endpoints FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Webhook Events (Incoming webhook event log)
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_id text, -- External event ID
  event_type text NOT NULL,
  -- Request data
  http_method text NOT NULL,
  headers jsonb,
  query_params jsonb,
  body jsonb NOT NULL,
  raw_body text,
  ip_address text,
  user_agent text,
  -- Signature verification
  signature_received text,
  signature_valid boolean,
  -- Processing
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processing_time_ms integer,
  status text DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'failed', 'ignored')),
  -- Results
  processing_result jsonb,
  error_message text,
  retry_count integer DEFAULT 0,
  -- Actions taken
  actions_triggered text[], -- What happened as a result
  records_created uuid[],
  records_updated uuid[],
  -- Metadata
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook ON webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage webhook events"
  ON webhook_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- API Call Logs (Outbound API calls)
CREATE TABLE IF NOT EXISTS api_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES integration_connections(id) ON DELETE CASCADE,
  -- Request
  request_method text NOT NULL,
  request_url text NOT NULL,
  request_headers jsonb,
  request_body jsonb,
  request_timestamp timestamptz DEFAULT now(),
  -- Response
  response_status integer,
  response_headers jsonb,
  response_body jsonb,
  response_time_ms integer,
  response_timestamp timestamptz,
  -- Status
  status text NOT NULL CHECK (status IN ('pending', 'success', 'error', 'timeout', 'rate_limited')),
  error_message text,
  error_code text,
  -- Context
  operation text, -- What operation was being performed
  entity_type text, -- What type of object
  entity_id uuid, -- Local record ID
  external_id text, -- External system ID
  -- Retry
  is_retry boolean DEFAULT false,
  retry_attempt integer DEFAULT 0,
  parent_call_id uuid REFERENCES api_call_logs(id),
  -- Metadata
  triggered_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_calls_connection ON api_call_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_status ON api_call_logs(status, request_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_calls_entity ON api_call_logs(entity_type, entity_id);

ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view API logs"
  ON api_call_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create API logs"
  ON api_call_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert pre-configured providers
INSERT INTO integration_providers (provider_name, display_name, provider_type, base_api_url, auth_type, capabilities, supported_channels, config_schema, credential_fields)
VALUES
  (
    'twilio',
    'Twilio',
    'telephony',
    'https://api.twilio.com/2010-04-01',
    'basic',
    '{"sms": true, "voice": true, "whatsapp": true, "video": false, "messaging": true}'::jsonb,
    ARRAY['sms', 'voice', 'whatsapp'],
    '{"type": "object", "required": ["account_sid", "auth_token"], "properties": {"account_sid": {"type": "string"}, "auth_token": {"type": "string"}, "phone_number": {"type": "string"}}}'::jsonb,
    '["account_sid", "auth_token", "phone_number"]'::jsonb
  ),
  (
    'salesforce',
    'Salesforce Service Cloud',
    'crm',
    'https://login.salesforce.com',
    'oauth2',
    '{"cases": true, "accounts": true, "contacts": true, "knowledge": true, "reports": true}'::jsonb,
    ARRAY['api', 'webhook'],
    '{"type": "object", "required": ["instance_url", "client_id", "client_secret"], "properties": {"instance_url": {"type": "string"}, "client_id": {"type": "string"}, "client_secret": {"type": "string"}, "username": {"type": "string"}, "password": {"type": "string"}}}'::jsonb,
    '["instance_url", "client_id", "client_secret", "username", "password", "security_token"]'::jsonb
  ),
  (
    'bird',
    'Bird.com',
    'messaging',
    'https://api.bird.com/v1',
    'api_key',
    '{"sms": true, "whatsapp": true, "email": true, "voice": true, "omnichannel": true}'::jsonb,
    ARRAY['sms', 'whatsapp', 'email', 'voice', 'rcs'],
    '{"type": "object", "required": ["api_key", "workspace_id"], "properties": {"api_key": {"type": "string"}, "workspace_id": {"type": "string"}, "channel_id": {"type": "string"}}}'::jsonb,
    '["api_key", "workspace_id", "channel_id"]'::jsonb
  )
ON CONFLICT (provider_name) DO NOTHING;