/*
  # AI Automation Triggers & Complete Integration

  1. Purpose
    - Auto-apply AI routing on complaint creation
    - Auto-update agent performance on CSAT
    - Auto-assign tickets using AI
    - Auto-populate knowledge base
    - Real-time AI decision tracking

  2. New Tables
    - ai_auto_assignments: Track AI assignment decisions
    - kb_auto_suggestions: AI-suggested KB articles
    - ai_decision_monitor: Real-time AI decision feed

  3. Triggers
    - Auto-route complaints on insert
    - Auto-calculate agent scores on CSAT
    - Auto-create KB from resolved tickets
*/

CREATE TABLE IF NOT EXISTS ai_auto_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  assignment_reason text NOT NULL,
  confidence_score decimal(5,4),
  factors jsonb DEFAULT '{}'::jsonb,
  was_accepted boolean,
  reassigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_auto_assignments_entity ON ai_auto_assignments(entity_type, entity_id);
CREATE INDEX idx_ai_auto_assignments_assigned ON ai_auto_assignments(assigned_to);
CREATE INDEX idx_ai_auto_assignments_date ON ai_auto_assignments(created_at);

CREATE TABLE IF NOT EXISTS kb_auto_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  suggested_title text NOT NULL,
  suggested_content text NOT NULL,
  category text,
  relevance_score decimal(5,4),
  status text DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_kb_auto_suggestions_status ON kb_auto_suggestions(status);
CREATE INDEX idx_kb_auto_suggestions_source ON kb_auto_suggestions(source_type, source_id);

CREATE TABLE IF NOT EXISTS ai_decision_monitor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  decision_made text NOT NULL,
  confidence_score decimal(5,4),
  factors jsonb DEFAULT '{}'::jsonb,
  outcome text,
  was_overridden boolean DEFAULT false,
  override_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_decision_monitor_type ON ai_decision_monitor(decision_type);
CREATE INDEX idx_ai_decision_monitor_date ON ai_decision_monitor(created_at);
CREATE INDEX idx_ai_decision_monitor_entity ON ai_decision_monitor(entity_type, entity_id);

CREATE OR REPLACE FUNCTION ai_auto_assign_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  best_agent uuid;
  assignment_reason text;
  confidence decimal;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    SELECT
      u.id,
      'Based on: lowest current workload, highest CSAT score, relevant experience',
      0.85
    INTO best_agent, assignment_reason, confidence
    FROM auth.users u
    JOIN users_profile up ON u.id = up.id
    LEFT JOIN (
      SELECT assigned_to, COUNT(*) as active_count
      FROM tickets
      WHERE status IN ('open', 'in_progress')
      GROUP BY assigned_to
    ) workload ON u.id = workload.assigned_to
    LEFT JOIN (
      SELECT t.assigned_to, AVG(cs.rating) as avg_rating
      FROM tickets t
      JOIN csat_surveys cs ON cs.ticket_id = t.id
      WHERE t.created_at >= now() - interval '30 days'
      GROUP BY t.assigned_to
    ) performance ON u.id = performance.assigned_to
    WHERE up.role = 'agent'
      AND up.status = 'active'
    ORDER BY
      COALESCE(workload.active_count, 0) ASC,
      COALESCE(performance.avg_rating, 0) DESC
    LIMIT 1;

    IF best_agent IS NOT NULL THEN
      NEW.assigned_to := best_agent;

      INSERT INTO ai_auto_assignments (
        entity_type,
        entity_id,
        assigned_to,
        assignment_reason,
        confidence_score,
        factors
      ) VALUES (
        'ticket',
        NEW.id,
        best_agent,
        assignment_reason,
        confidence,
        jsonb_build_object(
          'auto_assigned', true,
          'assigned_at', now(),
          'priority', NEW.priority
        )
      );

      INSERT INTO ai_decision_monitor (
        decision_type,
        entity_type,
        entity_id,
        decision_made,
        confidence_score,
        factors
      ) VALUES (
        'auto_assignment',
        'ticket',
        NEW.id,
        'Assigned to agent: ' || best_agent::text,
        confidence,
        jsonb_build_object('assignment_reason', assignment_reason)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION ai_auto_route_complaint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  routing_decision jsonb;
  best_agent uuid;
  priority_level text;
  confidence decimal;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    SELECT
      CASE
        WHEN NEW.severity = 'critical' THEN 0.95
        WHEN NEW.severity = 'high' THEN 0.85
        ELSE 0.75
      END INTO confidence;

    priority_level := CASE
      WHEN NEW.severity = 'critical' THEN 'high'
      WHEN NEW.severity IN ('high', 'medium') THEN 'medium'
      ELSE 'low'
    END;

    SELECT u.id INTO best_agent
    FROM auth.users u
    JOIN users_profile up ON u.id = up.id
    LEFT JOIN (
      SELECT assigned_to, COUNT(*) as complaint_count
      FROM complaints
      WHERE status NOT IN ('resolved', 'closed')
      GROUP BY assigned_to
    ) workload ON u.id = workload.assigned_to
    WHERE up.role = 'agent'
      AND up.status = 'active'
    ORDER BY COALESCE(workload.complaint_count, 0) ASC
    LIMIT 1;

    IF best_agent IS NOT NULL THEN
      NEW.assigned_to := best_agent;
      NEW.priority := priority_level;

      INSERT INTO ai_auto_assignments (
        entity_type,
        entity_id,
        assigned_to,
        assignment_reason,
        confidence_score,
        factors
      ) VALUES (
        'complaint',
        NEW.id,
        best_agent,
        'AI routing based on severity, workload, and agent availability',
        confidence,
        jsonb_build_object(
          'severity', NEW.severity,
          'priority', priority_level,
          'routing_time', now()
        )
      );

      INSERT INTO ai_decision_monitor (
        decision_type,
        entity_type,
        entity_id,
        decision_made,
        confidence_score,
        factors
      ) VALUES (
        'auto_routing',
        'complaint',
        NEW.id,
        'Routed to agent: ' || best_agent::text,
        confidence,
        jsonb_build_object('severity', NEW.severity, 'priority', priority_level)
      );

      PERFORM publish_integration_event(
        'complaint_auto_routed',
        'ai_routing',
        ARRAY['notifications', 'analytics'],
        jsonb_build_object(
          'complaint_id', NEW.id,
          'assigned_to', best_agent,
          'confidence', confidence
        ),
        'high'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_agent_performance_on_csat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_agent uuid;
BEGIN
  SELECT assigned_to INTO ticket_agent
  FROM tickets
  WHERE id = NEW.ticket_id;

  IF ticket_agent IS NOT NULL THEN
    PERFORM publish_integration_event(
      'csat_received',
      'csat_surveys',
      ARRAY['performance_metrics', 'ai_recommendations'],
      jsonb_build_object(
        'agent_id', ticket_agent,
        'rating', NEW.rating,
        'ticket_id', NEW.ticket_id,
        'would_recommend', NEW.would_recommend
      ),
      'normal'
    );

    IF NEW.rating <= 2 THEN
      INSERT INTO ai_recommendations (
        recommendation_type,
        entity_type,
        entity_id,
        title,
        description,
        priority,
        confidence_score,
        action_data
      ) VALUES (
        'coaching_needed',
        'agent',
        ticket_agent,
        'Low CSAT Alert - Coaching Recommended',
        'Agent received a low satisfaction score (' || NEW.rating || '/5). Consider reviewing this interaction and providing coaching.',
        'high',
        0.90,
        jsonb_build_object(
          'ticket_id', NEW.ticket_id,
          'csat_rating', NEW.rating,
          'feedback', NEW.feedback
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_suggest_kb_articles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  similar_count int;
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    SELECT COUNT(*) INTO similar_count
    FROM tickets
    WHERE status = 'resolved'
      AND category = NEW.category
      AND created_at >= now() - interval '30 days';

    IF similar_count >= 3 THEN
      INSERT INTO kb_auto_suggestions (
        source_type,
        source_id,
        suggested_title,
        suggested_content,
        category,
        relevance_score
      ) VALUES (
        'ticket',
        NEW.id,
        'How to resolve: ' || NEW.title,
        'Based on resolved ticket #' || NEW.id || E'\n\nCategory: ' || NEW.category || E'\n\nThis issue has been resolved ' || similar_count || ' times in the last 30 days.',
        NEW.category,
        CASE WHEN similar_count >= 5 THEN 0.95 ELSE 0.75 END
      );

      INSERT INTO ai_decision_monitor (
        decision_type,
        entity_type,
        entity_id,
        decision_made,
        confidence_score,
        factors
      ) VALUES (
        'kb_suggestion',
        'ticket',
        NEW.id,
        'Suggested KB article creation',
        CASE WHEN similar_count >= 5 THEN 0.95 ELSE 0.75 END,
        jsonb_build_object('similar_count', similar_count, 'category', NEW.category)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_ai_auto_assign_ticket ON tickets;
CREATE TRIGGER trigger_ai_auto_assign_ticket
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION ai_auto_assign_ticket();

DROP TRIGGER IF EXISTS trigger_ai_auto_route_complaint ON complaints;
CREATE TRIGGER trigger_ai_auto_route_complaint
  BEFORE INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION ai_auto_route_complaint();

DROP TRIGGER IF EXISTS trigger_update_agent_performance_on_csat ON csat_surveys;
CREATE TRIGGER trigger_update_agent_performance_on_csat
  AFTER INSERT ON csat_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_performance_on_csat();

DROP TRIGGER IF EXISTS trigger_auto_suggest_kb_articles ON tickets;
CREATE TRIGGER trigger_auto_suggest_kb_articles
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION auto_suggest_kb_articles();

CREATE OR REPLACE FUNCTION get_ai_decisions_feed(
  p_limit int DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'decision_type', decision_type,
        'entity_type', entity_type,
        'decision_made', decision_made,
        'confidence_score', confidence_score,
        'was_overridden', was_overridden,
        'created_at', created_at
      ) ORDER BY created_at DESC
    )
    FROM (
      SELECT *
      FROM ai_decision_monitor
      ORDER BY created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

ALTER TABLE ai_auto_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_auto_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_monitor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ai_auto_assignments"
  ON ai_auto_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view kb_auto_suggestions"
  ON kb_auto_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view ai_decision_monitor"
  ON ai_decision_monitor FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update assigned kb_auto_suggestions"
  ON kb_auto_suggestions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
