/*
  # Unified Inbox Database Views

  1. Views Created
    - `unified_conversations` - Combines tickets, chats, emails, complaints into one view
    - `customer_timeline_view` - Shows complete customer interaction history
    - `omnichannel_metrics` - Real-time metrics across all channels

  2. Purpose
    - Single interface to view all customer interactions
    - Cross-channel customer history
    - Unified analytics and reporting

  3. Security
    - Views inherit RLS from underlying tables
    - No additional policies needed
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
  t.updated_at,
  t.first_response_time as first_response_at,
  t.resolution_time as closed_at,
  NULL as rating,
  NULL as sentiment,
  NULL::jsonb as metadata
FROM tickets t

UNION ALL

SELECT
  'chat' as channel_type,
  cs.id,
  cs.session_number as reference_number,
  cs.subject,
  (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at LIMIT 1) as content_preview,
  cs.status,
  cs.priority,
  cs.assigned_agent_id,
  cs.customer_id,
  cs.customer_name,
  cs.customer_email,
  cs.tags,
  cs.created_at,
  cs.updated_at,
  cs.first_response_at,
  cs.closed_at,
  cs.rating,
  cs.sentiment,
  cs.metadata
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
  c.updated_at,
  NULL as first_response_at,
  c.resolved_date as closed_at,
  NULL as rating,
  NULL as sentiment,
  c.metadata
FROM complaints c

;

-- Customer Timeline View
CREATE OR REPLACE VIEW customer_timeline_view AS
WITH customer_interactions AS (
  SELECT
    customer_id,
    channel_type,
    reference_number,
    subject,
    status,
    priority,
    assigned_agent_id,
    rating,
    sentiment,
    created_at,
    closed_at
  FROM unified_conversations
  WHERE customer_id IS NOT NULL
)
SELECT
  ci.customer_id,
  c.name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  ci.channel_type,
  ci.reference_number,
  ci.subject,
  ci.status,
  ci.priority,
  ci.assigned_agent_id,
  ci.rating,
  ci.sentiment,
  ci.created_at,
  ci.closed_at,
  EXTRACT(EPOCH FROM (ci.closed_at - ci.created_at))::integer as duration_seconds,
  ROW_NUMBER() OVER (PARTITION BY ci.customer_id ORDER BY ci.created_at DESC) as interaction_sequence
FROM customer_interactions ci
LEFT JOIN clients c ON ci.customer_id = c.id
ORDER BY ci.customer_id, ci.created_at DESC;

-- Omnichannel Metrics View
CREATE OR REPLACE VIEW omnichannel_metrics AS
SELECT
  channel_type,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE status = 'open' OR status = 'waiting' OR status = 'active') as active_conversations,
  COUNT(*) FILTER (WHERE status = 'closed' OR status = 'resolved') as closed_conversations,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30d,
  AVG(rating) FILTER (WHERE rating IS NOT NULL) as avg_rating,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_sentiment_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_sentiment_count,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_sentiment_count,
  COUNT(DISTINCT customer_id) FILTER (WHERE customer_id IS NOT NULL) as unique_customers,
  COUNT(DISTINCT assigned_agent_id) FILTER (WHERE assigned_agent_id IS NOT NULL) as active_agents
FROM unified_conversations
GROUP BY channel_type;

-- Channel Performance View
CREATE OR REPLACE VIEW channel_performance AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  channel_type,
  COUNT(*) as volume,
  COUNT(*) FILTER (WHERE status IN ('closed', 'resolved')) as resolved_count,
  AVG(
    CASE
      WHEN closed_at IS NOT NULL AND first_response_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (first_response_at - created_at))
    END
  )::integer as avg_first_response_seconds,
  AVG(
    CASE
      WHEN closed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (closed_at - created_at))
    END
  )::integer as avg_resolution_seconds,
  AVG(rating) FILTER (WHERE rating IS NOT NULL) as avg_rating,
  ROUND(
    (COUNT(*) FILTER (WHERE status IN ('closed', 'resolved'))::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as resolution_rate
FROM unified_conversations
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), channel_type
ORDER BY date DESC, channel_type;

-- Agent Workload View (Across All Channels)
CREATE OR REPLACE VIEW agent_omnichannel_workload AS
SELECT
  uc.assigned_agent_id as agent_id,
  up.full_name as agent_name,
  COUNT(*) as total_assigned,
  COUNT(*) FILTER (WHERE uc.status IN ('open', 'waiting', 'active', 'in_progress')) as active_count,
  COUNT(*) FILTER (WHERE uc.channel_type = 'ticket') as tickets_count,
  COUNT(*) FILTER (WHERE uc.channel_type = 'chat') as chats_count,
  COUNT(*) FILTER (WHERE uc.channel_type = 'complaint') as complaints_count,
  AVG(uc.rating) FILTER (WHERE uc.rating IS NOT NULL) as avg_rating,
  COUNT(*) FILTER (WHERE uc.created_at >= NOW() - INTERVAL '24 hours') as last_24h_assigned,
  ROUND(
    (COUNT(*) FILTER (WHERE uc.status IN ('closed', 'resolved'))::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as resolution_rate
FROM unified_conversations uc
LEFT JOIN users_profile up ON uc.assigned_agent_id = up.id
WHERE uc.assigned_agent_id IS NOT NULL
GROUP BY uc.assigned_agent_id, up.full_name;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer_created ON tickets(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_created ON chat_sessions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_customer_created ON complaints(customer_id, created_at DESC);

-- Function to get customer complete history
CREATE OR REPLACE FUNCTION get_customer_complete_history(customer_uuid uuid)
RETURNS TABLE (
  channel_type text,
  reference_number text,
  subject text,
  status text,
  priority text,
  created_at timestamptz,
  closed_at timestamptz,
  rating integer,
  sentiment text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.channel_type,
    uc.reference_number,
    uc.subject,
    uc.status,
    uc.priority,
    uc.created_at,
    uc.closed_at,
    uc.rating,
    uc.sentiment
  FROM unified_conversations uc
  WHERE uc.customer_id = customer_uuid
  ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent current workload
CREATE OR REPLACE FUNCTION get_agent_current_workload(agent_uuid uuid)
RETURNS TABLE (
  channel_type text,
  active_count bigint,
  avg_priority text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.channel_type,
    COUNT(*) as active_count,
    MODE() WITHIN GROUP (ORDER BY uc.priority) as avg_priority
  FROM unified_conversations uc
  WHERE uc.assigned_agent_id = agent_uuid
    AND uc.status IN ('open', 'waiting', 'active', 'in_progress')
  GROUP BY uc.channel_type;
END;
$$ LANGUAGE plpgsql;
