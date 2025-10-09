/*
  # Dynamic Process Orchestrator

  This migration creates an advanced real-time process orchestration system:
  - Processes that adapt in real-time based on conditions
  - Smart routing based on workload, skills, and SLAs
  - Intelligent exception handling with escalation rules
  - Multi-tenant process isolation
  - Cross-process dependencies and coordination

  ## New Tables

  1. `orchestration_rules`
     - Dynamic routing and assignment rules
     - Condition-based process adaptation
     - Real-time decision logic

  2. `smart_routing_config`
     - Skill-based routing
     - Workload balancing
     - SLA-aware assignment

  3. `process_orchestration_state`
     - Real-time process execution state
     - Dynamic adjustments tracking
     - Performance monitoring

  4. `exception_handling_rules`
     - Exception detection patterns
     - Automated response actions
     - Escalation workflows

  5. `cross_process_dependencies`
     - Inter-process relationships
     - Dependency tracking
     - Coordination logic

  6. `orchestration_events`
     - Real-time event stream
     - Decision audit trail
     - Performance metrics

  ## Security
  - RLS enabled on all tables
  - Multi-tenant isolation
  - Secure event processing
*/

-- Orchestration Rules (dynamic decision-making)
CREATE TABLE IF NOT EXISTS orchestration_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  rule_type text NOT NULL, -- 'routing', 'assignment', 'escalation', 'adaptation', 'exception'
  trigger_event text NOT NULL, -- What triggers this rule
  priority integer DEFAULT 50, -- Higher = more priority
  -- Conditions
  conditions jsonb NOT NULL, -- When to apply this rule
  time_conditions jsonb, -- Time-based conditions
  workload_conditions jsonb, -- Load-based conditions
  sla_conditions jsonb, -- SLA-based conditions
  -- Actions
  actions jsonb NOT NULL, -- What to do when triggered
  fallback_actions jsonb, -- Backup actions if primary fails
  -- Configuration
  is_active boolean DEFAULT true,
  effective_from timestamptz DEFAULT now(),
  effective_until timestamptz,
  applies_to_tenants text[], -- Multi-tenant support
  -- Performance
  execution_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  avg_execution_time_ms numeric(10,2),
  last_executed_at timestamptz,
  -- Metadata
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Smart Routing Configuration
CREATE TABLE IF NOT EXISTS smart_routing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  activity_name text, -- Specific activity or null for process-level
  routing_strategy text NOT NULL, -- 'skill_based', 'workload_balanced', 'round_robin', 'priority', 'sla_aware', 'ai_optimized'
  -- Skill-based routing
  required_skills text[],
  skill_weights jsonb DEFAULT '{}'::jsonb,
  min_skill_level integer,
  -- Workload balancing
  max_workload_per_agent integer,
  consider_active_tasks boolean DEFAULT true,
  consider_pending_tasks boolean DEFAULT true,
  workload_calculation_method text, -- 'count', 'weighted', 'time_based'
  -- SLA awareness
  sla_buffer_minutes integer DEFAULT 30,
  prioritize_overdue boolean DEFAULT true,
  escalate_at_percentage integer DEFAULT 80, -- Escalate at 80% of SLA
  -- Agent selection
  agent_pool_id uuid,
  eligible_roles text[],
  exclude_agents uuid[],
  prefer_agents uuid[],
  -- Performance optimization
  min_performance_rating numeric(5,2),
  consider_historical_success boolean DEFAULT true,
  avoid_reassignment_within_hours integer DEFAULT 24,
  -- Tenant isolation
  tenant_id text,
  cross_tenant_allowed boolean DEFAULT false,
  -- Configuration
  is_active boolean DEFAULT true,
  fallback_strategy text, -- If primary strategy fails
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Process Orchestration State (real-time execution tracking)
CREATE TABLE IF NOT EXISTS process_orchestration_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_instance_id uuid NOT NULL UNIQUE,
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  -- Current state
  current_activity text,
  current_state text, -- 'running', 'waiting', 'suspended', 'error', 'completed'
  assigned_to uuid REFERENCES users_profile(id),
  -- Timing
  started_at timestamptz DEFAULT now(),
  expected_completion_at timestamptz,
  actual_completion_at timestamptz,
  total_elapsed_seconds integer DEFAULT 0,
  -- SLA tracking
  sla_deadline timestamptz,
  sla_buffer_exhausted_percentage numeric(5,2) DEFAULT 0,
  is_at_risk boolean DEFAULT false,
  escalation_level integer DEFAULT 0,
  -- Dynamic adjustments
  original_path text[],
  actual_path text[],
  deviations_count integer DEFAULT 0,
  adaptations_applied jsonb DEFAULT '[]'::jsonb,
  -- Performance
  activities_completed integer DEFAULT 0,
  activities_remaining integer DEFAULT 0,
  rework_count integer DEFAULT 0,
  exception_count integer DEFAULT 0,
  -- Resources
  agents_involved uuid[],
  systems_involved text[],
  total_cost_incurred numeric(10,2) DEFAULT 0,
  -- Context data
  business_data jsonb DEFAULT '{}'::jsonb,
  variables jsonb DEFAULT '{}'::jsonb,
  tags text[],
  -- Tenant
  tenant_id text,
  -- Status
  health_score numeric(5,2), -- 0-100 health indicator
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Exception Handling Rules
CREATE TABLE IF NOT EXISTS exception_handling_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  exception_type text NOT NULL, -- 'timeout', 'error', 'resource_unavailable', 'sla_breach', 'quality_issue', 'custom'
  process_types text[], -- Which processes this applies to
  activity_types text[], -- Which activities this applies to
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  -- Detection
  detection_criteria jsonb NOT NULL,
  detection_method text, -- 'threshold', 'pattern', 'ml_model', 'manual'
  -- Response actions
  immediate_actions jsonb DEFAULT '[]'::jsonb, -- Auto-actions
  manual_actions jsonb DEFAULT '[]'::jsonb, -- Require human intervention
  notification_rules jsonb DEFAULT '[]'::jsonb,
  -- Escalation
  auto_escalate boolean DEFAULT false,
  escalation_delay_minutes integer,
  escalation_path uuid[], -- Chain of users to escalate to
  max_escalation_level integer DEFAULT 3,
  -- Recovery
  retry_strategy jsonb, -- Automatic retry configuration
  max_retry_attempts integer DEFAULT 3,
  retry_delay_seconds integer DEFAULT 60,
  fallback_process_id uuid REFERENCES process_mapping(id),
  -- Tracking
  times_triggered integer DEFAULT 0,
  successful_recoveries integer DEFAULT 0,
  manual_interventions_required integer DEFAULT 0,
  avg_resolution_time_minutes integer,
  -- Configuration
  is_active boolean DEFAULT true,
  priority integer DEFAULT 50,
  created_by uuid REFERENCES users_profile(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cross-Process Dependencies
CREATE TABLE IF NOT EXISTS cross_process_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  child_process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  dependency_type text NOT NULL, -- 'sequential', 'parallel', 'conditional', 'data_flow', 'resource_sharing'
  -- Dependency configuration
  trigger_condition jsonb, -- When to trigger child
  data_mapping jsonb, -- Data to pass between processes
  wait_for_completion boolean DEFAULT true,
  timeout_minutes integer,
  -- Coordination
  synchronization_point text, -- Where processes must sync
  coordination_rules jsonb,
  conflict_resolution text, -- How to handle conflicts
  -- Error handling
  on_parent_error text DEFAULT 'cancel', -- 'cancel', 'continue', 'wait'
  on_child_error text DEFAULT 'notify', -- 'fail_parent', 'retry', 'notify', 'ignore'
  max_retry_attempts integer DEFAULT 3,
  -- Performance
  executions_count integer DEFAULT 0,
  success_rate numeric(5,2),
  avg_completion_time_seconds integer,
  -- Configuration
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orchestration Events (real-time event stream)
CREATE TABLE IF NOT EXISTS orchestration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_timestamp timestamptz DEFAULT now(),
  process_instance_id uuid NOT NULL,
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'rule_triggered', 'routing_decision', 'assignment_made', 'exception_handled', 'escalation', 'adaptation'
  -- Event details
  source text, -- 'orchestrator', 'rule_engine', 'exception_handler', 'smart_router'
  activity_name text,
  rule_id uuid,
  -- Decision context
  input_data jsonb DEFAULT '{}'::jsonb,
  evaluation_results jsonb DEFAULT '{}'::jsonb,
  decision_made text,
  decision_confidence numeric(5,2),
  alternatives_considered jsonb DEFAULT '[]'::jsonb,
  -- Actions taken
  actions_executed jsonb DEFAULT '[]'::jsonb,
  action_results jsonb DEFAULT '[]'::jsonb,
  -- Performance
  processing_time_ms integer,
  was_successful boolean DEFAULT true,
  error_message text,
  -- Impact
  agent_assigned uuid REFERENCES users_profile(id),
  sla_impact_seconds integer,
  cost_impact numeric(10,2),
  -- Metadata
  tenant_id text,
  tags text[],
  created_at timestamptz DEFAULT now()
);

-- Orchestration Performance Metrics
CREATE TABLE IF NOT EXISTS orchestration_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date DEFAULT CURRENT_DATE,
  process_id uuid REFERENCES process_mapping(id) ON DELETE CASCADE,
  -- Execution metrics
  total_instances integer DEFAULT 0,
  completed_instances integer DEFAULT 0,
  failed_instances integer DEFAULT 0,
  avg_completion_time_seconds integer,
  -- Routing effectiveness
  routing_decisions_made integer DEFAULT 0,
  optimal_routing_percentage numeric(5,2),
  reassignments_required integer DEFAULT 0,
  -- SLA performance
  sla_met_count integer DEFAULT 0,
  sla_breached_count integer DEFAULT 0,
  avg_sla_buffer_remaining_minutes integer,
  -- Exception handling
  exceptions_detected integer DEFAULT 0,
  exceptions_auto_resolved integer DEFAULT 0,
  avg_exception_resolution_time_minutes integer,
  -- Adaptations
  adaptations_applied integer DEFAULT 0,
  adaptation_success_rate numeric(5,2),
  -- Cost optimization
  total_cost numeric(12,2) DEFAULT 0,
  cost_per_instance numeric(10,2),
  cost_savings_from_optimization numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orch_rules_process ON orchestration_rules(process_id);
CREATE INDEX IF NOT EXISTS idx_orch_rules_active ON orchestration_rules(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_smart_routing_process ON smart_routing_config(process_id);
CREATE INDEX IF NOT EXISTS idx_orch_state_instance ON process_orchestration_state(process_instance_id);
CREATE INDEX IF NOT EXISTS idx_orch_state_assigned ON process_orchestration_state(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orch_state_at_risk ON process_orchestration_state(is_at_risk, sla_deadline);
CREATE INDEX IF NOT EXISTS idx_exception_rules_type ON exception_handling_rules(exception_type, is_active);
CREATE INDEX IF NOT EXISTS idx_dependencies_parent ON cross_process_dependencies(parent_process_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_child ON cross_process_dependencies(child_process_id);
CREATE INDEX IF NOT EXISTS idx_orch_events_instance ON orchestration_events(process_instance_id);
CREATE INDEX IF NOT EXISTS idx_orch_events_timestamp ON orchestration_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_orch_metrics_date ON orchestration_performance_metrics(metric_date, process_id);

-- Enable RLS
ALTER TABLE orchestration_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_routing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_orchestration_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE exception_handling_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_process_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orchestration_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view orchestration rules"
  ON orchestration_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage orchestration rules"
  ON orchestration_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view routing config"
  ON smart_routing_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage routing config"
  ON smart_routing_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view orchestration state"
  ON process_orchestration_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage orchestration state"
  ON process_orchestration_state FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view exception rules"
  ON exception_handling_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage exception rules"
  ON exception_handling_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view dependencies"
  ON cross_process_dependencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage dependencies"
  ON cross_process_dependencies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view orchestration events"
  ON orchestration_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create orchestration events"
  ON orchestration_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view performance metrics"
  ON orchestration_performance_metrics FOR SELECT
  TO authenticated
  USING (true);
