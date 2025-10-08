/*
  # Simplified Unified Inbox Views

  1. Views Created
    - `unified_conversations` - Combines tickets, chats, and complaints
    - `omnichannel_metrics` - Real-time metrics across all channels

  2. Purpose
    - Single interface to view all customer interactions
    - Unified analytics and reporting

  3. Security
    - Views inherit RLS from underlying tables
*/

-- Unified Conversations View
CREATE OR REPLACE VIEW unified_conversations AS
SELECT
  'ticket' as channel_type,
  t.id,
  t.ticket_number as reference_number,
  t.subject,
  t.description as content_preview,
  t.status,
  t.priority,
  t.assigned_to as assigned_agent_id,
  t.client_id as customer_id,
  t.customer_name,
  t.customer_email,
  t.tags,
  t.created_at,
  t.updated_at
FROM tickets t

UNION ALL

SELECT
  'chat' as channel_type,
  cs.id,
  cs.session_number as reference_number,
  COALESCE(cs.subject, 'Chat Session') as subject,
  (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at LIMIT 1) as content_preview,
  cs.status,
  cs.priority,
  cs.assigned_agent_id,
  cs.customer_id,
  cs.customer_name,
  cs.customer_email,
  cs.tags,
  cs.created_at,
  cs.updated_at
FROM chat_sessions cs

UNION ALL

SELECT
  'complaint' as channel_type,
  c.id,
  c.complaint_number as reference_number,
  c.subject,
  c.description as content_preview,
  c.status,
  c.severity as priority,
  c.assigned_to as assigned_agent_id,
  CAST(c.customer_id as uuid) as customer_id,
  c.customer_name,
  c.customer_email,
  c.tags,
  c.created_at,
  c.updated_at
FROM complaints c;

-- Omnichannel Metrics View
CREATE OR REPLACE VIEW omnichannel_metrics AS
SELECT
  channel_type,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE status IN ('open', 'waiting', 'active', 'in_progress')) as active_conversations,
  COUNT(*) FILTER (WHERE status IN ('closed', 'resolved')) as closed_conversations,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
  COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IS NOT NULL) as unique_customers
FROM unified_conversations
GROUP BY channel_type;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status_created ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status_created ON chat_sessions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON complaints(status, created_at DESC);
