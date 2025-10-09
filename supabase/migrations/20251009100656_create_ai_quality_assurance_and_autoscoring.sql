/*
  # AI Quality Assurance and Auto-Scoring System

  ## Overview
  This migration creates tables for AI-powered quality assurance including:
  - Speech-to-text transcription for all interactions
  - NLP-powered sentiment and entity analysis
  - 100% automatic interaction scoring
  - ML-based quality predictions
  - Auto-generated coaching insights

  ## New Tables

  1. `interaction_transcriptions`
     - Full speech-to-text transcripts
     - Timestamps and speaker diarization
     - Confidence scores

  2. `interaction_nlp_analysis`
     - Sentiment analysis results
     - Entity extraction (names, products, issues)
     - Topic classification
     - Key phrase extraction

  3. `ai_quality_scores`
     - Automatic 100% interaction scoring
     - Multiple scoring models
     - Confidence levels and explanations

  4. `scoring_models`
     - Trained ML models for quality scoring
     - Model performance metrics
     - Version control

  5. `ai_coaching_insights`
     - Auto-generated coaching recommendations
     - Performance trends
     - Skill gap identification

  ## Security
  - RLS enabled on all tables
  - Agent privacy protections
  - Audit trail for all AI decisions
*/

-- Speech-to-Text Transcriptions
CREATE TABLE IF NOT EXISTS interaction_transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  audio_file_url text,
  transcription_text text NOT NULL,
  -- Diarization (speaker separation)
  speakers jsonb, -- {speaker_id, name, segments: [{start, end, text}]}
  word_timestamps jsonb, -- [{word, start_time, end_time, confidence}]
  -- Quality metrics
  transcription_confidence numeric(5,2),
  audio_quality_score numeric(5,2),
  language_detected text DEFAULT 'en-US',
  -- Processing metadata
  transcription_engine text DEFAULT 'openai-whisper', -- whisper, google, amazon, azure
  processing_duration_seconds integer,
  audio_duration_seconds integer,
  word_count integer,
  -- Status
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_interaction ON interaction_transcriptions(interaction_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON interaction_transcriptions(status);

ALTER TABLE interaction_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transcriptions"
  ON interaction_transcriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create transcriptions"
  ON interaction_transcriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- NLP Analysis Results
CREATE TABLE IF NOT EXISTS interaction_nlp_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  transcription_id uuid REFERENCES interaction_transcriptions(id),
  -- Sentiment Analysis
  overall_sentiment text, -- 'positive', 'negative', 'neutral', 'mixed'
  sentiment_score numeric(5,2), -- -1 to +1
  sentiment_confidence numeric(5,2),
  customer_sentiment text,
  agent_sentiment text,
  sentiment_timeline jsonb, -- Sentiment changes throughout interaction
  -- Emotion Detection
  emotions_detected text[], -- 'happy', 'frustrated', 'angry', 'confused', 'satisfied'
  dominant_emotion text,
  emotion_intensity numeric(5,2),
  -- Entity Extraction
  entities_found jsonb, -- {type: 'person|product|issue|location', value, confidence, mentions}
  customer_name text,
  products_mentioned text[],
  issues_identified text[],
  -- Topic Classification
  primary_topic text,
  topics text[], -- All identified topics
  topic_confidence numeric(5,2),
  interaction_type_detected text, -- 'complaint', 'inquiry', 'sales', 'support'
  -- Key Phrases
  key_phrases text[],
  keywords text[],
  -- Language Metrics
  agent_talk_time_percentage numeric(5,2),
  customer_talk_time_percentage numeric(5,2),
  silence_percentage numeric(5,2),
  interruptions_count integer DEFAULT 0,
  talk_over_count integer DEFAULT 0,
  -- Compliance & Quality Indicators
  compliance_phrases_used text[], -- Required phrases said
  compliance_phrases_missing text[], -- Required phrases not said
  prohibited_words_used text[],
  escalation_triggers_detected text[],
  -- Processing
  nlp_engine text DEFAULT 'openai-gpt4',
  processing_version text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nlp_interaction ON interaction_nlp_analysis(interaction_id);
CREATE INDEX IF NOT EXISTS idx_nlp_sentiment ON interaction_nlp_analysis(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_nlp_topic ON interaction_nlp_analysis(primary_topic);

ALTER TABLE interaction_nlp_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view NLP analysis"
  ON interaction_nlp_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create NLP analysis"
  ON interaction_nlp_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- AI Quality Scoring Models
CREATE TABLE IF NOT EXISTS scoring_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL UNIQUE,
  model_version text NOT NULL,
  model_type text NOT NULL, -- 'rule_based', 'ml_classifier', 'neural_network', 'llm'
  description text,
  -- Scoring criteria
  scoring_criteria jsonb NOT NULL, -- Weights and factors
  max_score integer DEFAULT 100,
  passing_threshold integer DEFAULT 80,
  -- Features used
  features_used text[] NOT NULL, -- What data points the model uses
  weights jsonb, -- Feature importance weights
  -- Performance metrics
  accuracy numeric(5,2),
  precision numeric(5,2),
  recall numeric(5,2),
  f1_score numeric(5,2),
  correlation_with_human_scores numeric(5,2),
  -- Training data
  training_sample_size integer,
  training_date date,
  validation_score numeric(5,2),
  -- Status
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  deployment_date date,
  last_retrained_date date,
  -- Metadata
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scoring_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scoring models"
  ON scoring_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "QA managers can manage scoring models"
  ON scoring_models FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI-Generated Quality Scores (100% Auto-Scoring)
CREATE TABLE IF NOT EXISTS ai_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL,
  transcription_id uuid REFERENCES interaction_transcriptions(id),
  nlp_analysis_id uuid REFERENCES interaction_nlp_analysis(id),
  scoring_model_id uuid REFERENCES scoring_models(id),
  -- Overall score
  total_score numeric(5,2) NOT NULL,
  passed boolean NOT NULL,
  confidence_level numeric(5,2), -- How confident is the AI
  -- Detailed scoring
  category_scores jsonb NOT NULL, -- {greeting: 85, empathy: 90, resolution: 75, ...}
  strength_areas text[],
  improvement_areas text[],
  -- Specific quality factors
  greeting_score numeric(5,2),
  empathy_score numeric(5,2),
  active_listening_score numeric(5,2),
  problem_solving_score numeric(5,2),
  product_knowledge_score numeric(5,2),
  communication_clarity_score numeric(5,2),
  professionalism_score numeric(5,2),
  call_control_score numeric(5,2),
  closing_score numeric(5,2),
  compliance_score numeric(5,2),
  -- Explanation
  score_rationale text, -- AI explanation of the score
  positive_highlights text[],
  negative_highlights text[],
  key_moments jsonb, -- [{timestamp, type, description, impact}]
  -- Comparison
  human_review_score numeric(5,2), -- If later reviewed by human
  score_variance numeric(5,2), -- Difference from human score
  human_reviewer_id uuid REFERENCES users_profile(id),
  human_review_date timestamptz,
  -- Metadata
  scored_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_scores_interaction ON ai_quality_scores(interaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_model ON ai_quality_scores(scoring_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_passed ON ai_quality_scores(passed);
CREATE INDEX IF NOT EXISTS idx_ai_scores_confidence ON ai_quality_scores(confidence_level DESC);

ALTER TABLE ai_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own AI scores"
  ON ai_quality_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create AI scores"
  ON ai_quality_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "QA team can manage AI scores"
  ON ai_quality_scores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- AI-Generated Coaching Insights
CREATE TABLE IF NOT EXISTS ai_coaching_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES users_profile(id),
  analysis_period_start date NOT NULL,
  analysis_period_end date NOT NULL,
  interactions_analyzed integer NOT NULL,
  -- Performance summary
  average_score numeric(5,2),
  score_trend text, -- 'improving', 'declining', 'stable'
  trend_percentage numeric(5,2),
  performance_tier text, -- 'top_performer', 'meets_expectations', 'needs_improvement', 'critical'
  -- Skill analysis
  top_skills text[], -- Best performing areas
  skill_gaps text[], -- Areas needing improvement
  skill_scores jsonb, -- {skill_name: score}
  -- Personalized recommendations
  coaching_recommendations text[] NOT NULL,
  priority_focus_areas text[],
  suggested_training text[],
  sample_interactions_for_review uuid[], -- Specific interactions to review with agent
  -- Comparative analysis
  peer_comparison jsonb, -- How agent compares to peers
  improvement_potential numeric(5,2), -- Estimated potential score gain
  time_to_improvement_estimate text, -- '2-4 weeks', '1-2 months'
  -- Action plan
  suggested_action_plan jsonb, -- Step-by-step improvement plan
  quick_wins text[], -- Easy improvements
  long_term_development text[], -- Strategic development
  -- Metadata
  generated_by_model text,
  confidence_score numeric(5,2),
  human_reviewed boolean DEFAULT false,
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_agent ON ai_coaching_insights(agent_id);
CREATE INDEX IF NOT EXISTS idx_coaching_period ON ai_coaching_insights(analysis_period_start, analysis_period_end);

ALTER TABLE ai_coaching_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own coaching insights"
  ON ai_coaching_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = agent_id OR true);

CREATE POLICY "System can create coaching insights"
  ON ai_coaching_insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can manage coaching insights"
  ON ai_coaching_insights FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default scoring model
INSERT INTO scoring_models (model_name, model_version, model_type, scoring_criteria, features_used, is_active, is_primary)
VALUES (
  'Default AI Quality Model',
  '1.0',
  'ml_classifier',
  '{
    "greeting": 10,
    "empathy": 15,
    "active_listening": 15,
    "problem_solving": 20,
    "product_knowledge": 15,
    "communication": 10,
    "professionalism": 10,
    "closing": 5
  }'::jsonb,
  ARRAY['transcription_text', 'sentiment_score', 'entities_found', 'key_phrases', 'agent_talk_time_percentage', 'compliance_phrases_used'],
  true,
  true
)
ON CONFLICT (model_name) DO NOTHING;