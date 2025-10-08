/*
  # Smart Knowledge Management System

  This migration creates an intelligent, self-learning knowledge base:
  - Auto-generate articles from resolved tickets
  - AI suggests KB articles to agents in real-time
  - Version control and effectiveness tracking
  - Intelligent search with semantic understanding
  - Continuous learning and improvement

  ## New Tables

  1. `knowledge_articles`
     - Article content and metadata
     - Version history
     - Usage analytics

  2. `article_suggestions`
     - AI-powered article recommendations
     - Context-aware suggestions
     - Effectiveness tracking

  3. `article_effectiveness_metrics`
     - Usage statistics
     - Resolution impact
     - Quality scores

  4. `knowledge_gaps`
     - Identified missing knowledge
     - Gap analysis
     - Priority queue

  5. `semantic_search_index`
     - Vector embeddings for semantic search
     - Related article mapping
     - Search optimization

  6. `auto_generated_content`
     - AI-drafted articles from tickets
     - Review queue
     - Approval workflow

  ## Security
  - RLS enabled on all tables
  - Draft articles protected
  - Version control audit trail
*/

-- Knowledge Articles (enhanced)
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  category text NOT NULL,
  subcategory text,
  tags text[] DEFAULT ARRAY[]::text[],
  -- Content metadata
  content_type text DEFAULT 'article', -- 'article', 'howto', 'troubleshooting', 'faq', 'policy'
  difficulty_level text DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  estimated_reading_time_minutes integer,
  word_count integer,
  -- Relationships
  related_articles uuid[],
  prerequisite_articles uuid[],
  superseded_by_article_id uuid REFERENCES knowledge_articles(id),
  source_ticket_ids uuid[], -- Tickets this was created from
  -- Search and discovery
  keywords text[] DEFAULT ARRAY[]::text[],
  search_terms text[] DEFAULT ARRAY[]::text[],
  semantic_embedding vector(1536), -- For semantic search (OpenAI embeddings)
  -- Version control
  version integer DEFAULT 1,
  parent_version_id uuid REFERENCES knowledge_articles(id),
  is_latest_version boolean DEFAULT true,
  version_notes text,
  -- Effectiveness tracking
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  effectiveness_score numeric(5,2) DEFAULT 0,
  avg_time_on_page_seconds integer,
  -- Resolution impact
  times_used_in_resolution integer DEFAULT 0,
  avg_resolution_time_when_used_minutes integer,
  tickets_resolved_with_article integer DEFAULT 0,
  -- Quality metrics
  completeness_score numeric(5,2), -- AI-assessed
  accuracy_score numeric(5,2),
  clarity_score numeric(5,2),
  last_accuracy_check_date date,
  -- Content freshness
  last_reviewed_date date,
  next_review_date date,
  review_frequency_months integer DEFAULT 6,
  is_outdated boolean DEFAULT false,
  outdated_reason text,
  -- Permissions
  visibility text DEFAULT 'internal', -- 'internal', 'client_portal', 'public'
  restricted_to_roles text[],
  restricted_to_clients uuid[],
  -- Status and workflow
  status text DEFAULT 'draft', -- 'draft', 'review', 'published', 'archived'
  requires_approval boolean DEFAULT true,
  approved_by uuid REFERENCES users_profile(id),
  approved_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  archive_reason text,
  -- Authorship
  author_id uuid REFERENCES users_profile(id),
  contributors uuid[] DEFAULT ARRAY[]::uuid[],
  last_updated_by uuid REFERENCES users_profile(id),
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Article Suggestions (AI-powered)
CREATE TABLE IF NOT EXISTS article_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  -- Suggestion context
  suggested_for_ticket_id uuid,
  suggested_for_complaint_id uuid,
  suggested_for_query text, -- The question/issue
  suggestion_context jsonb, -- Full context data
  -- AI analysis
  relevance_score numeric(5,2) NOT NULL, -- 0-100
  confidence_score numeric(5,2) NOT NULL, -- 0-100
  matching_keywords text[],
  semantic_similarity_score numeric(5,2),
  reasoning text, -- Why this was suggested
  -- Alternative suggestions
  alternative_article_ids uuid[], -- Other relevant articles
  related_suggestions jsonb, -- Related suggestions with scores
  -- Suggestion metadata
  suggested_at timestamptz DEFAULT now(),
  suggested_by text DEFAULT 'ai', -- 'ai', 'manual', 'rule_based'
  suggestion_method text, -- 'semantic_search', 'keyword_match', 'ml_model', 'collaborative_filtering'
  model_version text,
  -- User interaction
  was_viewed boolean DEFAULT false,
  viewed_at timestamptz,
  view_duration_seconds integer,
  was_helpful boolean,
  feedback_provided text,
  was_used_in_resolution boolean DEFAULT false,
  resolution_time_impact_seconds integer, -- Positive = faster
  -- Agent context
  agent_id uuid REFERENCES users_profile(id),
  agent_experience_level text,
  agent_department text,
  -- Effectiveness
  suggestion_quality_score numeric(5,2),
  improved_resolution boolean,
  -- Learning feedback
  feedback_for_model jsonb, -- Data to improve future suggestions
  created_at timestamptz DEFAULT now()
);

-- Article Effectiveness Metrics
CREATE TABLE IF NOT EXISTS article_effectiveness_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  metric_date date DEFAULT CURRENT_DATE,
  -- Usage metrics
  total_views integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  avg_time_spent_seconds integer,
  bounce_rate numeric(5,2), -- % who left immediately
  -- Feedback metrics
  helpful_votes integer DEFAULT 0,
  not_helpful_votes integer DEFAULT 0,
  helpfulness_ratio numeric(5,2),
  comments_count integer DEFAULT 0,
  avg_rating numeric(5,2),
  -- Resolution impact
  times_suggested integer DEFAULT 0,
  times_accepted integer DEFAULT 0,
  acceptance_rate numeric(5,2),
  times_used_in_resolution integer DEFAULT 0,
  resolution_success_rate numeric(5,2),
  -- Performance comparison
  avg_resolution_time_with_article_minutes integer,
  avg_resolution_time_without_article_minutes integer,
  time_savings_minutes integer,
  estimated_cost_savings numeric(10,2),
  -- Quality indicators
  accuracy_reports integer DEFAULT 0,
  outdated_reports integer DEFAULT 0,
  incomplete_reports integer DEFAULT 0,
  improvement_suggestions integer DEFAULT 0,
  -- Search performance
  appeared_in_search_results integer DEFAULT 0,
  clicked_from_search integer DEFAULT 0,
  search_ctr numeric(5,2), -- Click-through rate
  avg_search_position numeric(5,2),
  -- Trends
  trend_direction text, -- 'rising', 'stable', 'declining'
  week_over_week_change numeric(5,2),
  month_over_month_change numeric(5,2),
  -- Overall score
  overall_effectiveness_score numeric(5,2), -- 0-100 composite score
  effectiveness_grade text, -- 'A', 'B', 'C', 'D', 'F'
  needs_attention boolean DEFAULT false,
  attention_reason text,
  created_at timestamptz DEFAULT now()
);

-- Knowledge Gaps (identified missing knowledge)
CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_type text NOT NULL, -- 'missing_article', 'outdated_content', 'insufficient_detail', 'conflicting_info'
  title text NOT NULL,
  description text NOT NULL,
  -- Detection
  detected_by text, -- 'ai_analysis', 'agent_feedback', 'search_analytics', 'ticket_analysis', 'manual'
  detection_date timestamptz DEFAULT now(),
  detection_confidence numeric(5,2),
  -- Context
  related_queries text[], -- Searches that found nothing
  related_tickets uuid[], -- Tickets without good KB matches
  affected_category text,
  affected_processes text[],
  -- Impact analysis
  frequency_score integer, -- How often this gap is encountered
  impact_level text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  affected_agents_count integer DEFAULT 0,
  estimated_resolution_time_impact_minutes integer,
  estimated_monthly_cost_impact numeric(10,2),
  -- Priority
  priority_score numeric(5,2), -- Calculated from frequency + impact
  priority_level text DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  business_justification text,
  -- Resolution
  status text DEFAULT 'identified', -- 'identified', 'assigned', 'in_progress', 'resolved', 'deferred'
  assigned_to uuid REFERENCES users_profile(id),
  assigned_at timestamptz,
  target_resolution_date date,
  resolution_notes text,
  resolved_at timestamptz,
  created_article_id uuid REFERENCES knowledge_articles(id),
  -- Review
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  review_notes text,
  is_valid_gap boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Semantic Search Index (for vector search optimization)
CREATE TABLE IF NOT EXISTS semantic_search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  -- Content chunks (for long articles)
  chunk_index integer DEFAULT 0,
  chunk_text text NOT NULL,
  chunk_embedding vector(1536),
  -- Metadata for relevance
  chunk_type text, -- 'title', 'summary', 'introduction', 'body', 'conclusion', 'example'
  keywords text[],
  entities text[], -- Named entities extracted
  concepts text[], -- Key concepts
  -- Relationships
  similar_chunks uuid[], -- Other chunks with high similarity
  similarity_scores numeric(5,2)[],
  -- Search optimization
  search_weight numeric(5,2) DEFAULT 1.0, -- Boost factor
  is_indexable boolean DEFAULT true,
  -- Updates
  last_indexed_at timestamptz DEFAULT now(),
  needs_reindexing boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Auto-Generated Content (AI drafts)
CREATE TABLE IF NOT EXISTS auto_generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'article', 'faq', 'troubleshooting_guide'
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  -- Source information
  generated_from_tickets uuid[] NOT NULL,
  ticket_count integer,
  common_issue_pattern text,
  resolution_pattern text,
  -- AI generation details
  generation_method text, -- 'ticket_analysis', 'pattern_recognition', 'template_based'
  model_used text,
  model_version text,
  generation_confidence numeric(5,2),
  quality_score numeric(5,2), -- AI self-assessment
  -- Suggested metadata
  suggested_category text,
  suggested_tags text[],
  suggested_keywords text[],
  suggested_related_articles uuid[],
  -- Quality checks
  completeness_check jsonb,
  accuracy_check jsonb,
  clarity_check jsonb,
  needs_improvement text[],
  -- Review workflow
  status text DEFAULT 'pending_review', -- 'pending_review', 'in_review', 'approved', 'rejected', 'needs_revision'
  assigned_reviewer uuid REFERENCES users_profile(id),
  assigned_at timestamptz,
  reviewed_by uuid REFERENCES users_profile(id),
  reviewed_at timestamptz,
  reviewer_feedback text,
  revision_notes text,
  -- Publication
  published_as_article_id uuid REFERENCES knowledge_articles(id),
  published_at timestamptz,
  -- Metadata
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Article Feedback (detailed user feedback)
CREATE TABLE IF NOT EXISTS article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  feedback_type text NOT NULL, -- 'helpful', 'not_helpful', 'outdated', 'incorrect', 'incomplete', 'suggestion'
  rating integer, -- 1-5 stars
  comment text,
  -- Specific issues
  accuracy_issue boolean DEFAULT false,
  clarity_issue boolean DEFAULT false,
  completeness_issue boolean DEFAULT false,
  outdated_issue boolean DEFAULT false,
  formatting_issue boolean DEFAULT false,
  -- Suggestions
  suggested_improvement text,
  suggested_additional_info text,
  related_question text,
  -- Context
  user_role text,
  user_experience_level text,
  was_helpful_for_resolution boolean,
  ticket_context_id uuid,
  -- Feedback metadata
  submitted_by uuid REFERENCES users_profile(id),
  submitted_at timestamptz DEFAULT now(),
  -- Response
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES users_profile(id),
  acknowledged_at timestamptz,
  action_taken text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category, status);
CREATE INDEX IF NOT EXISTS idx_articles_status ON knowledge_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_effectiveness ON knowledge_articles(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_suggestions_ticket ON article_suggestions(suggested_for_ticket_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_relevance ON article_suggestions(relevance_score DESC, confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_effectiveness_article ON article_effectiveness_metrics(article_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_effectiveness_score ON article_effectiveness_metrics(overall_effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_gaps_priority ON knowledge_gaps(priority_level, status);
CREATE INDEX IF NOT EXISTS idx_gaps_status ON knowledge_gaps(status, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_index_article ON semantic_search_index(article_id);
CREATE INDEX IF NOT EXISTS idx_auto_content_status ON auto_generated_content(status, generation_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_article ON article_feedback(article_id, submitted_at DESC);

-- Enable RLS
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_effectiveness_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view published articles"
  ON knowledge_articles FOR SELECT TO authenticated
  USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Authors can manage their articles"
  ON knowledge_articles FOR ALL TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can view suggestions"
  ON article_suggestions FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can create suggestions"
  ON article_suggestions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update suggestion feedback"
  ON article_suggestions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view effectiveness metrics"
  ON article_effectiveness_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view knowledge gaps"
  ON knowledge_gaps FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage knowledge gaps"
  ON knowledge_gaps FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view search index"
  ON semantic_search_index FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view auto-generated content"
  ON auto_generated_content FOR SELECT TO authenticated USING (true);

CREATE POLICY "Reviewers can manage auto-generated content"
  ON auto_generated_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can submit feedback"
  ON article_feedback FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view feedback"
  ON article_feedback FOR SELECT TO authenticated USING (true);
