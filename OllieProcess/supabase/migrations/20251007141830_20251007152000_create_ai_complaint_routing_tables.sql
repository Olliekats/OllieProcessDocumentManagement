/*
  # TIER 2: AI-Powered Complaint Routing Tables

  1. New Tables
    - `complaint_routing_rules` - AI routing rules configuration
    - `complaint_routing_history` - Historical routing decisions
    - `complaint_routing_assignments` - Assignment tracking

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users

  3. Purpose
    - Track AI-based complaint routing decisions
    - Analyze routing accuracy and patterns
    - Configure intelligent routing rules
*/

-- Complaint Routing Rules Table
CREATE TABLE IF NOT EXISTS complaint_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_team text NOT NULL,
  target_agent_id uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Complaint Routing History Table
CREATE TABLE IF NOT EXISTS complaint_routing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL,
  recommended_team text NOT NULL,
  recommended_agent_id uuid REFERENCES auth.users(id),
  confidence_score numeric(5,2) NOT NULL,
  reasoning text[] DEFAULT ARRAY[]::text[],
  analysis_results jsonb DEFAULT '{}'::jsonb,
  was_accepted boolean,
  actual_team text,
  actual_agent_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Complaint Routing Assignments Table
CREATE TABLE IF NOT EXISTS complaint_routing_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL,
  ai_suggested_assignee uuid REFERENCES auth.users(id),
  ai_confidence numeric(5,2),
  ai_reasoning text,
  actual_assignee uuid REFERENCES auth.users(id),
  was_manually_assigned boolean DEFAULT false,
  assignment_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routing_rules_priority ON complaint_routing_rules(priority DESC, is_active);
CREATE INDEX IF NOT EXISTS idx_routing_history_complaint ON complaint_routing_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_routing_history_created ON complaint_routing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routing_assignments_complaint ON complaint_routing_assignments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_routing_assignments_assignee ON complaint_routing_assignments(actual_assignee);

-- Enable Row Level Security
ALTER TABLE complaint_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_routing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_routing_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view routing rules"
  ON complaint_routing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage routing rules"
  ON complaint_routing_rules FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can view routing history"
  ON complaint_routing_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert routing history"
  ON complaint_routing_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view routing assignments"
  ON complaint_routing_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert routing assignments"
  ON complaint_routing_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate routing accuracy
CREATE OR REPLACE FUNCTION calculate_routing_accuracy(
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  total_routings bigint,
  accepted_count bigint,
  accuracy_rate numeric,
  avg_confidence numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_routings,
    COUNT(*) FILTER (WHERE was_accepted = true) as accepted_count,
    ROUND(
      (COUNT(*) FILTER (WHERE was_accepted = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as accuracy_rate,
    ROUND(AVG(confidence_score), 2) as avg_confidence
  FROM complaint_routing_history
  WHERE created_at >= NOW() - (days_back || ' days')::interval;
END;
$$ LANGUAGE plpgsql;

-- Function to get routing statistics by team
CREATE OR REPLACE FUNCTION get_team_routing_stats()
RETURNS TABLE (
  team_name text,
  total_assigned bigint,
  avg_confidence numeric,
  auto_accepted_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    recommended_team as team_name,
    COUNT(*) as total_assigned,
    ROUND(AVG(confidence_score), 2) as avg_confidence,
    ROUND(
      (COUNT(*) FILTER (WHERE was_accepted = true)::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as auto_accepted_rate
  FROM complaint_routing_history
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY recommended_team
  ORDER BY total_assigned DESC;
END;
$$ LANGUAGE plpgsql;
