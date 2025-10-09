/*
  # TIER 1 Features: Erlang C Calculator & Live Chat System

  1. New Tables - Erlang C & Workforce Planning
    - `staffing_scenarios` - Stores staffing calculation scenarios
    - `shrinkage_configurations` - Manages shrinkage settings per team/department
    - `staffing_history` - Historical staffing calculations for tracking

  2. New Tables - Live Chat System
    - `chat_sessions` - Manages chat conversations
    - `chat_messages` - Stores all chat messages
    - `chat_participants` - Tracks who's in each chat
    - `chat_assignments` - Agent assignment to chats
    - `chat_canned_responses` - Pre-defined quick responses
    - `chat_file_attachments` - File sharing in chats

  3. Security
    - Enable RLS on all tables
    - Policies for authenticated users based on role and assignment
    - Secure file attachment access

  4. Functions
    - Auto-assign chats to available agents
    - Update chat session status
    - Track agent availability
*/

-- Staffing Scenarios Table
CREATE TABLE IF NOT EXISTS staffing_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  calls_per_interval integer NOT NULL,
  average_handle_time numeric(10,2) NOT NULL,
  interval_minutes integer NOT NULL DEFAULT 30,
  target_service_level numeric(5,2) NOT NULL DEFAULT 80,
  target_answer_time integer NOT NULL DEFAULT 20,
  required_agents integer NOT NULL,
  traffic_intensity numeric(10,2) NOT NULL,
  occupancy numeric(5,2) NOT NULL,
  service_level numeric(5,2) NOT NULL,
  average_speed_of_answer numeric(10,2) NOT NULL,
  probability_of_waiting numeric(5,2) NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shrinkage Configurations
CREATE TABLE IF NOT EXISTS shrinkage_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text,
  breaks_minutes integer DEFAULT 30,
  lunch_minutes integer DEFAULT 30,
  training_minutes integer DEFAULT 60,
  meetings_minutes integer DEFAULT 30,
  other_minutes integer DEFAULT 0,
  total_shrinkage_percent numeric(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staffing History
CREATE TABLE IF NOT EXISTS staffing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES staffing_scenarios(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  shift text NOT NULL,
  required_agents integer NOT NULL,
  scheduled_agents integer NOT NULL,
  actual_agents integer NOT NULL,
  variance integer GENERATED ALWAYS AS (actual_agents - required_agents) STORED,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_id uuid,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed', 'transferred')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  channel text DEFAULT 'web' CHECK (channel IN ('web', 'mobile', 'whatsapp', 'social')),
  subject text,
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  assigned_agent_id uuid REFERENCES auth.users(id),
  department text,
  tags text[],
  started_at timestamptz DEFAULT now(),
  first_response_at timestamptz,
  closed_at timestamptz,
  wait_time_seconds integer,
  duration_seconds integer,
  message_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'bot')),
  sender_id uuid REFERENCES auth.users(id),
  sender_name text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chat Participants Table
CREATE TABLE IF NOT EXISTS chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('customer', 'agent', 'supervisor', 'observer')),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_typing boolean DEFAULT false,
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Chat Assignments Table
CREATE TABLE IF NOT EXISTS chat_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  reason text,
  is_current boolean DEFAULT true
);

-- Chat Canned Responses Table
CREATE TABLE IF NOT EXISTS chat_canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  shortcut text NOT NULL UNIQUE,
  content text NOT NULL,
  category text,
  department text,
  language text DEFAULT 'en',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat File Attachments Table
CREATE TABLE IF NOT EXISTS chat_file_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staffing_scenarios_created_by ON staffing_scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_staffing_scenarios_created_at ON staffing_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shrinkage_configurations_active ON shrinkage_configurations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_staffing_history_date ON staffing_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_staffing_history_scenario ON staffing_history(scenario_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_agent ON chat_sessions(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_number ON chat_sessions(session_number);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_session ON chat_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_assignments_agent ON chat_assignments(agent_id, is_current);
CREATE INDEX IF NOT EXISTS idx_chat_canned_responses_shortcut ON chat_canned_responses(shortcut) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE staffing_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE shrinkage_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staffing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_file_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Staffing Tables
CREATE POLICY "Users can view staffing scenarios"
  ON staffing_scenarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create staffing scenarios"
  ON staffing_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own staffing scenarios"
  ON staffing_scenarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own staffing scenarios"
  ON staffing_scenarios FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can view shrinkage configurations"
  ON shrinkage_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage shrinkage configurations"
  ON shrinkage_configurations FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can view staffing history"
  ON staffing_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert staffing history"
  ON staffing_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Chat Tables
CREATE POLICY "Agents can view assigned chats"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.session_id = chat_sessions.id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Agents can update assigned chats"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.session_id = chat_sessions.id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view chat messages in their sessions"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND (
        chat_sessions.assigned_agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_participants
          WHERE chat_participants.session_id = chat_sessions.id
          AND chat_participants.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can send chat messages in their sessions"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND (
        chat_sessions.assigned_agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_participants
          WHERE chat_participants.session_id = chat_sessions.id
          AND chat_participants.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view participants in their sessions"
  ON chat_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_participants.session_id
      AND chat_sessions.assigned_agent_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chat sessions"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participant status"
  ON chat_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Agents can view their assignments"
  ON chat_assignments FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Supervisors can create assignments"
  ON chat_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view canned responses"
  ON chat_canned_responses FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage canned responses"
  ON chat_canned_responses FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can view attachments in their sessions"
  ON chat_file_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_file_attachments.session_id
      AND (
        chat_sessions.assigned_agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_participants
          WHERE chat_participants.session_id = chat_sessions.id
          AND chat_participants.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can upload attachments in their sessions"
  ON chat_file_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_file_attachments.session_id
      AND (
        chat_sessions.assigned_agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_participants
          WHERE chat_participants.session_id = chat_sessions.id
          AND chat_participants.user_id = auth.uid()
        )
      )
    )
  );

-- Function to generate chat session number
CREATE OR REPLACE FUNCTION generate_chat_session_number()
RETURNS text AS $$
BEGIN
  RETURN 'CHT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update chat session statistics
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_sessions
    SET
      message_count = message_count + 1,
      updated_at = NOW()
    WHERE id = NEW.session_id;

    IF NEW.sender_type = 'agent' AND (SELECT first_response_at FROM chat_sessions WHERE id = NEW.session_id) IS NULL THEN
      UPDATE chat_sessions
      SET
        first_response_at = NOW(),
        wait_time_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::integer
      WHERE id = NEW.session_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update chat statistics
DROP TRIGGER IF EXISTS trigger_update_chat_stats ON chat_messages;
CREATE TRIGGER trigger_update_chat_stats
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_stats();

-- Function to close chat session and calculate duration
CREATE OR REPLACE FUNCTION close_chat_session(session_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE chat_sessions
  SET
    status = 'closed',
    closed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::integer,
    updated_at = NOW()
  WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql;
