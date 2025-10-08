/*
  # AI Support Assistant System - Create Required Tables

  ## Overview
  Creates the database tables needed for the AI Assistant chat feature
  
  ## Tables Created
  1. **support_conversations** - Stores chat conversation sessions
     - Links to authenticated users
     - Tracks conversation type and status
     - Records last message timestamp
  
  2. **support_messages** - Stores individual chat messages
     - Links to conversations
     - Stores user queries and AI responses
     - Tracks message metadata and referenced items
  
  3. **support_suggestions** - Stores AI-generated suggestions
     - Links to users
     - Tracks suggestion relevance and usage
  
  4. **support_context** - Tracks user context (what screen they're on)
     - Links to users
     - Stores context data for better AI responses
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Proper foreign key constraints
  
  ## Functions
  - search_all_content() - Searches processes, SOPs, knowledge articles
  - get_contextual_help() - Provides context-aware help
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
  context_module text,
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user ON support_conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON support_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON support_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON support_suggestions(user_id, was_used);
CREATE INDEX IF NOT EXISTS idx_context_user ON support_context(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_conversations
CREATE POLICY "Users can view own conversations"
  ON support_conversations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON support_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON support_conversations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON support_conversations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for support_messages
CREATE POLICY "Users can view messages in own conversations"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in own conversations"
  ON support_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update messages in own conversations"
  ON support_messages
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages in own conversations"
  ON support_messages
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  ));

-- RLS Policies for support_suggestions
CREATE POLICY "Users can view own suggestions"
  ON support_suggestions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own suggestions"
  ON support_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions"
  ON support_suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own suggestions"
  ON support_suggestions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for support_context
CREATE POLICY "Users can view own context"
  ON support_context
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own context"
  ON support_context
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own context"
  ON support_context
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own context"
  ON support_context
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());