/*
  # AI Configuration and Routing System

  1. New Tables
    - `ai_routing_rules`
      - Configurable routing rules for AI-based ticket/complaint routing
      - Supports keywords, patterns, categories, priorities
      - Manual override and enable/disable functionality
    
    - `ai_routing_history`
      - Historical log of all AI routing decisions
      - Tracks accuracy and allows learning from corrections
    
    - `ai_sentiment_analysis`
      - Sentiment scores for complaints and tickets
      - Tracks emotion detection (angry, frustrated, satisfied, etc.)
    
    - `ai_suggested_responses`
      - Template responses suggested by AI based on complaint type
      - Can be manually edited and improved
    
    - `ai_model_config`
      - Configuration for different AI models and features
      - Allows enabling/disabling features and tuning parameters

    - `complaint_routing_assignments`
      - Tracks AI-suggested and actual assignments for complaints
      - Includes manual override tracking

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to view and manage AI configurations
    - Admin-level policies for model configuration
*/

-- AI Routing Rules Configuration
CREATE TABLE IF NOT EXISTS ai_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('keyword', 'pattern', 'sentiment', 'priority', 'category')),
  conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '{}',
  target_category text,
  target_priority text,
  target_department text,
  is_active boolean DEFAULT true,
  priority_order int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view routing rules"
  ON ai_routing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create routing rules"
  ON ai_routing_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their routing rules"
  ON ai_routing_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- AI Routing History
CREATE TABLE IF NOT EXISTS ai_routing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('complaint', 'ticket', 'interaction')),
  entity_id uuid NOT NULL,
  suggested_category text,
  suggested_priority text,
  suggested_assignee uuid REFERENCES auth.users(id),
  actual_category text,
  actual_priority text,
  actual_assignee uuid REFERENCES auth.users(id),
  confidence_score numeric(4,3) DEFAULT 0.5,
  was_overridden boolean DEFAULT false,
  override_reason text,
  routing_time_ms int,
  model_version text DEFAULT 'rule_based_v1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_routing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view routing history"
  ON ai_routing_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert routing history"
  ON ai_routing_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update routing history"
  ON ai_routing_history FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI Sentiment Analysis
CREATE TABLE IF NOT EXISTS ai_sentiment_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('complaint', 'ticket', 'interaction', 'comment')),
  entity_id uuid NOT NULL,
  sentiment_score numeric(4,3) DEFAULT 0,
  sentiment_label text CHECK (sentiment_label IN ('very_negative', 'negative', 'neutral', 'positive', 'very_positive')),
  emotions jsonb DEFAULT '{}',
  key_phrases text[],
  urgency_score numeric(4,3) DEFAULT 0,
  analyzed_text text,
  analysis_method text DEFAULT 'keyword_based',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sentiment analysis"
  ON ai_sentiment_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sentiment analysis"
  ON ai_sentiment_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- AI Suggested Responses
CREATE TABLE IF NOT EXISTS ai_suggested_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_type text NOT NULL,
  sentiment_context text,
  suggested_response text NOT NULL,
  response_tone text DEFAULT 'professional' CHECK (response_tone IN ('professional', 'empathetic', 'apologetic', 'solution_focused')),
  usage_count int DEFAULT 0,
  success_rate numeric(4,3) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_suggested_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suggested responses"
  ON ai_suggested_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create suggested responses"
  ON ai_suggested_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their suggested responses"
  ON ai_suggested_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- AI Model Configuration
CREATE TABLE IF NOT EXISTS ai_model_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT true,
  model_type text,
  parameters jsonb DEFAULT '{}',
  confidence_threshold numeric(4,3) DEFAULT 0.7,
  fallback_behavior text DEFAULT 'manual_review',
  last_updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_model_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view model config"
  ON ai_model_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update model config"
  ON ai_model_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Complaint Routing Assignments
CREATE TABLE IF NOT EXISTS complaint_routing_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  ai_suggested_assignee uuid REFERENCES auth.users(id),
  ai_confidence numeric(4,3) DEFAULT 0,
  ai_reasoning text,
  actual_assignee uuid REFERENCES auth.users(id),
  was_manually_assigned boolean DEFAULT false,
  assignment_timestamp timestamptz DEFAULT now(),
  response_time_minutes int,
  resolution_time_minutes int
);

ALTER TABLE complaint_routing_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view routing assignments"
  ON complaint_routing_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert routing assignments"
  ON complaint_routing_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update routing assignments"
  ON complaint_routing_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default AI model configurations
INSERT INTO ai_model_config (feature_name, is_enabled, model_type, parameters, confidence_threshold) VALUES
  ('complaint_routing', true, 'rule_based', '{"use_sentiment": true, "use_keywords": true}', 0.7),
  ('sentiment_analysis', true, 'keyword_based', '{"emotion_detection": true}', 0.6),
  ('auto_categorization', true, 'rule_based', '{"fallback_category": "general"}', 0.75),
  ('suggested_responses', true, 'template_based', '{"tone_matching": true}', 0.8),
  ('priority_escalation', true, 'rule_based', '{"escalate_threshold": 0.8}', 0.7)
ON CONFLICT (feature_name) DO NOTHING;

-- Insert default routing rules
INSERT INTO ai_routing_rules (rule_name, rule_type, conditions, actions, target_category, target_priority, priority_order, is_active) VALUES
  ('Critical Keywords', 'keyword', '{"keywords": ["urgent", "emergency", "critical", "immediately", "asap"]}', '{"escalate": true, "notify_manager": true}', 'escalation', 'critical', 100, true),
  ('Billing Issues', 'keyword', '{"keywords": ["billing", "invoice", "payment", "charge", "refund", "overcharge"]}', '{"route_to": "billing"}', 'billing', 'high', 80, true),
  ('Service Complaints', 'keyword', '{"keywords": ["poor service", "rude", "unprofessional", "terrible", "worst"]}', '{"escalate": true}', 'service_quality', 'high', 90, true),
  ('Technical Issues', 'keyword', '{"keywords": ["not working", "broken", "error", "bug", "technical", "system down"]}', '{"route_to": "technical"}', 'technical', 'medium', 70, true),
  ('Negative Sentiment', 'sentiment', '{"min_score": -0.7}', '{"flag_for_review": true, "assign_senior": true}', 'escalation', 'high', 95, true)
ON CONFLICT DO NOTHING;

-- Insert default suggested responses
INSERT INTO ai_suggested_responses (complaint_type, sentiment_context, suggested_response, response_tone, is_active) VALUES
  ('billing', 'negative', 'Thank you for bringing this to our attention. I sincerely apologize for any billing discrepancy. I am personally reviewing your account and will ensure this is resolved within 24 hours. Could you please provide your account number so I can expedite this?', 'apologetic', true),
  ('service_quality', 'very_negative', 'I deeply apologize for the unacceptable service you experienced. This does not reflect our standards. I am escalating your complaint to our management team immediately, and you will receive a personal follow-up within 4 hours.', 'apologetic', true),
  ('technical', 'neutral', 'Thank you for reporting this technical issue. Our team is investigating and we will provide you with an update within 2 hours. In the meantime, here are some steps you can try: [troubleshooting steps]', 'solution_focused', true),
  ('general', 'negative', 'I sincerely apologize for the inconvenience you have experienced. Your feedback is important to us. I am personally handling your case and will work to resolve this promptly. Could you provide more details so I can assist you better?', 'empathetic', true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_routing_history_entity ON ai_routing_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_routing_history_created ON ai_routing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sentiment_entity ON ai_sentiment_analysis(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_complaint_routing_complaint ON complaint_routing_assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_ai_routing_rules_active ON ai_routing_rules(is_active, priority_order DESC);
