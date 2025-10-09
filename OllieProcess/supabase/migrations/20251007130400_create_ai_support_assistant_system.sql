/*
  # AI Support Assistant System
  
  ## Tables
  1. support_conversations - Chat history
  2. support_messages - Individual messages
  3. support_suggestions - AI suggestions and recommendations
  4. support_context - User context tracking
*/

-- Support Conversations
CREATE TABLE IF NOT EXISTS support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_title text,
  conversation_type text DEFAULT 'general',
  status text DEFAULT 'active',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Support Messages
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES support_conversations(id) ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL,
  message_content text NOT NULL,
  sender_type text NOT NULL,
  metadata jsonb,
  referenced_items jsonb,
  helpful_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- AI Suggestions
CREATE TABLE IF NOT EXISTS support_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suggestion_type text NOT NULL,
  suggestion_title text NOT NULL,
  suggestion_content text NOT NULL,
  relevance_score numeric(5,2) DEFAULT 0,
  context_data jsonb,
  was_helpful boolean,
  was_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User Context (what user is viewing/doing)
CREATE TABLE IF NOT EXISTS support_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_type text NOT NULL,
  context_item_id text,
  context_item_type text,
  context_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON support_conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON support_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON support_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON support_suggestions(user_id, was_used);
CREATE INDEX IF NOT EXISTS idx_context_user ON support_context(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View own conversations" ON support_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Manage own conversations" ON support_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "View conversation messages" ON support_messages FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Manage conversation messages" ON support_messages FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM support_conversations WHERE id = conversation_id AND user_id = auth.uid()));

CREATE POLICY "View own suggestions" ON support_suggestions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Manage own suggestions" ON support_suggestions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "View own context" ON support_context FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Manage own context" ON support_context FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Function to search all content
CREATE OR REPLACE FUNCTION search_all_content(
  p_search_term text,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_results jsonb;
  v_processes jsonb;
  v_sops jsonb;
  v_knowledge jsonb;
  v_artifacts jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', 'process',
      'id', id,
      'title', name,
      'description', description,
      'relevance', 'high'
    )
  )
  INTO v_processes
  FROM processes
  WHERE name ILIKE '%' || p_search_term || '%'
     OR description ILIKE '%' || p_search_term || '%'
  LIMIT p_limit / 4;

  SELECT jsonb_agg(
    jsonb_build_object(
      'type', 'sop',
      'id', id,
      'title', title,
      'content', LEFT(content, 200),
      'relevance', 'high'
    )
  )
  INTO v_sops
  FROM sops
  WHERE title ILIKE '%' || p_search_term || '%'
     OR content ILIKE '%' || p_search_term || '%'
  LIMIT p_limit / 4;

  SELECT jsonb_agg(
    jsonb_build_object(
      'type', 'knowledge',
      'id', id,
      'title', title,
      'content', LEFT(content, 200),
      'relevance', 'high'
    )
  )
  INTO v_knowledge
  FROM knowledge_articles
  WHERE title ILIKE '%' || p_search_term || '%'
     OR content ILIKE '%' || p_search_term || '%'
  LIMIT p_limit / 4;

  SELECT jsonb_agg(
    jsonb_build_object(
      'type', artifact_type,
      'id', id,
      'title', artifact_name,
      'data', artifact_data,
      'relevance', 'medium'
    )
  )
  INTO v_artifacts
  FROM generated_artifacts
  WHERE artifact_name ILIKE '%' || p_search_term || '%'
  LIMIT p_limit / 4;

  v_results := jsonb_build_object(
    'processes', COALESCE(v_processes, '[]'::jsonb),
    'sops', COALESCE(v_sops, '[]'::jsonb),
    'knowledge', COALESCE(v_knowledge, '[]'::jsonb),
    'artifacts', COALESCE(v_artifacts, '[]'::jsonb)
  );

  RETURN v_results;
END;
$$;

-- Function to get contextual help
CREATE OR REPLACE FUNCTION get_contextual_help(
  p_context_type text,
  p_context_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_help jsonb;
BEGIN
  CASE p_context_type
    WHEN 'process' THEN
      SELECT jsonb_build_object(
        'type', 'process_help',
        'tips', jsonb_build_array(
          'You can execute this process directly from the BPMN view',
          'Check the Process Analytics tab for performance insights',
          'View generated SOPs and RACI matrices in the artifacts section'
        ),
        'related_sops', (
          SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title))
          FROM sops
          WHERE process_id = p_context_id
          LIMIT 5
        )
      )
      INTO v_help;

    WHEN 'task' THEN
      v_help := jsonb_build_object(
        'type', 'task_help',
        'tips', jsonb_build_array(
          'Complete tasks from your My Tasks dashboard',
          'Check SLA requirements before starting',
          'You can add comments and attach files to tasks'
        )
      );

    WHEN 'knowledge' THEN
      v_help := jsonb_build_object(
        'type', 'knowledge_help',
        'tips', jsonb_build_array(
          'Search the knowledge base using keywords',
          'Vote on helpful articles to improve relevance',
          'Request approval before publishing new articles'
        )
      );

    ELSE
      v_help := jsonb_build_object(
        'type', 'general_help',
        'tips', jsonb_build_array(
          'Use the search bar to find processes and knowledge',
          'Check notifications for pending approvals',
          'View the dashboard for an overview of all activities'
        )
      );
  END CASE;

  RETURN v_help;
END;
$$;

-- Function to generate AI response
CREATE OR REPLACE FUNCTION generate_ai_response(
  p_user_message text,
  p_conversation_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_response jsonb;
  v_search_results jsonb;
  v_response_text text;
BEGIN
  v_search_results := search_all_content(p_user_message, 10);
  
  IF (v_search_results->>'processes')::jsonb != '[]'::jsonb THEN
    v_response_text := 'I found relevant processes for you. ';
  ELSIF (v_search_results->>'sops')::jsonb != '[]'::jsonb THEN
    v_response_text := 'I found relevant SOPs that might help. ';
  ELSIF (v_search_results->>'knowledge')::jsonb != '[]'::jsonb THEN
    v_response_text := 'I found helpful knowledge articles. ';
  ELSE
    v_response_text := 'I can help you find processes, SOPs, and knowledge articles. What specifically are you looking for?';
  END IF;

  v_response := jsonb_build_object(
    'message', v_response_text,
    'results', v_search_results,
    'suggestions', jsonb_build_array(
      'Show me all active processes',
      'Find SOPs related to ' || p_user_message,
      'Search knowledge base'
    )
  );

  RETURN v_response;
END;
$$;