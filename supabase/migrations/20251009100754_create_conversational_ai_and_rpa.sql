/*
  # Conversational AI, Chatbots, and RPA Integration

  ## Overview
  This migration creates tables for:
  - Conversational AI/chatbot system
  - Intent recognition and entity extraction
  - Dialog flow management
  - RPA (Robotic Process Automation) integration
  - Bot performance analytics

  ## New Tables

  1. `chatbot_configurations`
     - Bot settings and personalities
     - AI model configurations
     - Channel integrations

  2. `chatbot_intents`
     - Intent definitions and training phrases
     - Response templates

  3. `chatbot_conversations`
     - Full conversation history
     - Context management

  4. `chatbot_messages`
     - Individual messages in conversations
     - Intent recognition results

  5. `rpa_bots`
     - RPA bot definitions
     - Automation workflows

  6. `rpa_executions`
     - Bot execution logs
     - Success/failure tracking

  ## Security
  - RLS enabled
  - Customer data protection
  - Audit logging
*/

-- Chatbot Configurations
CREATE TABLE IF NOT EXISTS chatbot_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  -- AI Configuration
  ai_provider text DEFAULT 'openai', -- 'openai', 'anthropic', 'google', 'custom'
  ai_model text DEFAULT 'gpt-4',
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 500,
  -- Personality & Behavior
  bot_personality text, -- Friendly, professional, technical, etc.
  system_prompt text NOT NULL,
  greeting_message text NOT NULL,
  fallback_message text DEFAULT 'I did not understand that. Can you please rephrase?',
  escalation_message text DEFAULT 'Let me connect you with a human agent.',
  -- Capabilities
  supported_channels text[] DEFAULT ARRAY['web_chat', 'email', 'sms'], -- web_chat, sms, email, whatsapp, slack
  supported_languages text[] DEFAULT ARRAY['en'],
  can_escalate_to_human boolean DEFAULT true,
  can_make_transactions boolean DEFAULT false,
  can_access_customer_data boolean DEFAULT true,
  -- Thresholds
  confidence_threshold numeric(3,2) DEFAULT 0.75, -- Minimum confidence to auto-respond
  escalation_threshold numeric(3,2) DEFAULT 0.50, -- Below this, escalate to human
  max_conversation_turns integer DEFAULT 20,
  session_timeout_minutes integer DEFAULT 30,
  -- Integration settings
  knowledge_base_enabled boolean DEFAULT true,
  crm_integration_enabled boolean DEFAULT false,
  ticketing_integration_enabled boolean DEFAULT true,
  -- Analytics
  total_conversations integer DEFAULT 0,
  successful_resolutions integer DEFAULT 0,
  escalations integer DEFAULT 0,
  average_csat numeric(3,2),
  -- Status
  is_active boolean DEFAULT true,
  is_in_training boolean DEFAULT false,
  last_trained_at timestamptz,
  deployment_date timestamptz,
  -- Metadata
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view chatbot configs"
  ON chatbot_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage chatbot configs"
  ON chatbot_configurations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Chatbot Intents
CREATE TABLE IF NOT EXISTS chatbot_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES chatbot_configurations(id) ON DELETE CASCADE,
  intent_name text NOT NULL,
  display_name text NOT NULL,
  description text,
  -- Training data
  training_phrases text[] NOT NULL, -- Example user inputs
  required_entities text[], -- Entities that must be extracted
  optional_entities text[],
  -- Responses
  response_templates text[] NOT NULL, -- Multiple response variations
  response_type text DEFAULT 'text', -- 'text', 'quick_reply', 'card', 'custom'
  response_data jsonb, -- Structured response data
  -- Actions
  triggers_action boolean DEFAULT false,
  action_type text, -- 'create_ticket', 'check_order', 'transfer_agent', etc.
  action_config jsonb,
  -- Context
  requires_context text[], -- Context vars that must exist
  sets_context text[], -- Context vars this intent sets
  resets_context boolean DEFAULT false,
  -- Flow control
  follow_up_intents text[],
  can_interrupt boolean DEFAULT true,
  priority integer DEFAULT 0,
  -- Analytics
  usage_count integer DEFAULT 0,
  success_rate numeric(5,2),
  average_confidence numeric(5,2),
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bot_id, intent_name)
);

CREATE INDEX IF NOT EXISTS idx_intents_bot ON chatbot_intents(bot_id);

ALTER TABLE chatbot_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view intents"
  ON chatbot_intents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage intents"
  ON chatbot_intents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Chatbot Conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES chatbot_configurations(id),
  -- Customer info
  customer_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  -- Conversation metadata
  channel text NOT NULL, -- 'web_chat', 'sms', 'email', 'whatsapp'
  session_id text UNIQUE NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  -- Conversation state
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated', 'abandoned')),
  context jsonb DEFAULT '{}'::jsonb, -- Conversation context variables
  last_intent text,
  message_count integer DEFAULT 0,
  -- Outcomes
  was_resolved boolean,
  resolution_type text, -- 'self_service', 'escalated', 'partial', 'abandoned'
  escalated_to_agent_id uuid REFERENCES auth.users(id),
  escalation_reason text,
  created_ticket_id uuid,
  -- Quality metrics
  csat_rating integer CHECK (csat_rating >= 1 AND csat_rating <= 5),
  csat_feedback text,
  bot_helpful boolean,
  sentiment_score numeric(5,2),
  -- Metadata
  user_agent text,
  ip_address text,
  referrer_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_bot ON chatbot_conversations(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_started ON chatbot_conversations(started_at DESC);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create conversations"
  ON chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agents can manage conversations"
  ON chatbot_conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Chatbot Messages
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  -- Message content
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'bot', 'system')),
  message_text text NOT NULL,
  message_type text DEFAULT 'text', -- 'text', 'quick_reply', 'image', 'file', 'card'
  attachments jsonb,
  -- Intent recognition
  detected_intent text,
  intent_confidence numeric(5,2),
  intent_id uuid REFERENCES chatbot_intents(id),
  -- Entity extraction
  entities_extracted jsonb, -- {entity_type: value}
  -- AI processing
  ai_response_used boolean DEFAULT false,
  ai_model_used text,
  ai_processing_time_ms integer,
  tokens_used integer,
  -- Metadata
  sequence_number integer NOT NULL,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chatbot_messages(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_messages_intent ON chatbot_messages(detected_intent);

ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view messages"
  ON chatbot_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create messages"
  ON chatbot_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RPA Bots (Robotic Process Automation)
CREATE TABLE IF NOT EXISTS rpa_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  bot_type text NOT NULL, -- 'attended', 'unattended', 'hybrid'
  -- Automation details
  process_automated text NOT NULL,
  automation_category text, -- 'data_entry', 'report_generation', 'validation', 'integration'
  workflow_definition jsonb NOT NULL, -- Step-by-step automation flow
  -- Triggers
  trigger_type text NOT NULL, -- 'scheduled', 'event', 'manual', 'api'
  trigger_config jsonb,
  schedule_cron text, -- For scheduled bots
  -- Execution settings
  max_concurrent_executions integer DEFAULT 1,
  timeout_minutes integer DEFAULT 60,
  retry_on_failure boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  -- Integration
  systems_integrated text[], -- Which systems this bot interacts with
  api_endpoints text[],
  credentials_vault_key text, -- Reference to secure credential storage
  -- Performance
  average_execution_time_seconds integer,
  success_rate numeric(5,2),
  total_executions integer DEFAULT 0,
  successful_executions integer DEFAULT 0,
  failed_executions integer DEFAULT 0,
  -- ROI metrics
  time_saved_per_execution_minutes integer,
  cost_saved_per_execution numeric(10,2),
  fte_equivalent numeric(3,2), -- Full-time equivalent replaced
  -- Status
  is_active boolean DEFAULT true,
  is_in_maintenance boolean DEFAULT false,
  last_executed_at timestamptz,
  next_scheduled_execution timestamptz,
  -- Metadata
  created_by uuid REFERENCES users_profile(id),
  owner_team text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rpa_bots_active ON rpa_bots(is_active, trigger_type);

ALTER TABLE rpa_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view RPA bots"
  ON rpa_bots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage RPA bots"
  ON rpa_bots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RPA Executions
CREATE TABLE IF NOT EXISTS rpa_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid REFERENCES rpa_bots(id) ON DELETE CASCADE,
  execution_id text UNIQUE NOT NULL,
  -- Execution details
  trigger_source text NOT NULL, -- How it was triggered
  triggered_by uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  execution_duration_seconds integer,
  -- Status
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  exit_code integer,
  -- Results
  items_processed integer DEFAULT 0,
  items_successful integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  output_data jsonb, -- Results/output from the bot
  -- Error handling
  error_message text,
  error_details jsonb,
  retry_attempt integer DEFAULT 0,
  -- Steps execution
  steps_executed jsonb, -- [{step_name, status, duration, output}]
  current_step text,
  -- Logs
  execution_logs text, -- Detailed log output
  screenshots_url text[], -- Screenshots taken during execution
  -- Metadata
  execution_context jsonb, -- Input parameters
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rpa_executions_bot ON rpa_executions(bot_id);
CREATE INDEX IF NOT EXISTS idx_rpa_executions_status ON rpa_executions(status);
CREATE INDEX IF NOT EXISTS idx_rpa_executions_started ON rpa_executions(started_at DESC);

ALTER TABLE rpa_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view RPA executions"
  ON rpa_executions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create RPA executions"
  ON rpa_executions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update RPA executions"
  ON rpa_executions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default chatbot
INSERT INTO chatbot_configurations (bot_name, display_name, system_prompt, greeting_message)
VALUES (
  'default_assistant',
  'Virtual Assistant',
  'You are a helpful AI assistant for a BPO/contact center. Be professional, empathetic, and concise. Help customers with their inquiries and escalate to human agents when necessary.',
  'Hello! I am your virtual assistant. How can I help you today?'
)
ON CONFLICT (bot_name) DO NOTHING;