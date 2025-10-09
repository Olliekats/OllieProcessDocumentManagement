/*
  # Process Execution Engine - Complete Schema
  
  ## Overview
  Transform BPMN diagrams from static documentation into live, executable workflows.
  This migration creates the foundation for end-to-end process automation.
  
  ## New Tables
  
  ### 1. process_versions
  - Tracks all versions of process designs
  - Enables rollback and comparison
  - Links to original process design
  
  ### 2. process_instances
  - Live workflow executions
  - Tracks current state, progress, variables
  - Links to process version being executed
  
  ### 3. process_tasks
  - Individual steps in active workflows
  - Task state, assignments, timing
  - SLA tracking and escalation
  
  ### 4. task_assignments
  - Who is assigned to which tasks
  - Support for multiple assignees
  - Assignment history
  
  ### 5. process_variables
  - Runtime data storage for processes
  - Key-value pairs per instance
  - Type-safe storage
  
  ### 6. process_execution_log
  - Complete audit trail
  - Every action, transition, decision
  - Compliance and troubleshooting
  
  ### 7. process_sla_rules
  - Define SLA expectations per node
  - Warning and breach thresholds
  - Escalation rules
  
  ### 8. process_sla_tracking
  - Real-time SLA monitoring
  - Automatic breach detection
  - Performance analytics
  
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users
  - Role-based access control
  
  ## Performance
  - Indexes on frequently queried columns
  - Optimized for real-time queries
*/

-- Process versions for tracking design changes
CREATE TABLE IF NOT EXISTS process_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  diagram_data jsonb NOT NULL,
  change_description text,
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(process_id, version_number)
);

-- Live process instances (executable workflows)
CREATE TABLE IF NOT EXISTS process_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) NOT NULL,
  version_id uuid REFERENCES process_versions(id) NOT NULL,
  instance_name text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  current_node_id text,
  progress_percentage integer DEFAULT 0,
  priority text DEFAULT 'medium',
  started_by uuid REFERENCES auth.users(id) NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  estimated_completion timestamptz,
  actual_duration_minutes integer,
  error_message text,
  variables jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Individual tasks within process instances
CREATE TABLE IF NOT EXISTS process_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES process_instances(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_label text NOT NULL,
  node_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sequence_order integer,
  assigned_to uuid REFERENCES auth.users(id),
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  due_date timestamptz,
  priority text DEFAULT 'medium',
  completion_data jsonb,
  decision_outcome text,
  notes text,
  time_spent_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task assignments (support multiple assignees)
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES process_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) NOT NULL,
  assignment_type text DEFAULT 'primary',
  assigned_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Process variables for runtime data
CREATE TABLE IF NOT EXISTS process_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES process_instances(id) ON DELETE CASCADE NOT NULL,
  variable_name text NOT NULL,
  variable_value jsonb NOT NULL,
  variable_type text NOT NULL,
  scope text DEFAULT 'instance',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(instance_id, variable_name)
);

-- Complete execution audit trail
CREATE TABLE IF NOT EXISTS process_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES process_instances(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES process_tasks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_description text NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  from_node_id text,
  to_node_id text,
  event_data jsonb,
  timestamp timestamptz DEFAULT now()
);

-- SLA rules definition
CREATE TABLE IF NOT EXISTS process_sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_label text,
  target_duration_minutes integer NOT NULL,
  warning_threshold_minutes integer NOT NULL,
  escalation_rules jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(process_id, node_id)
);

-- Real-time SLA tracking
CREATE TABLE IF NOT EXISTS process_sla_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES process_tasks(id) ON DELETE CASCADE NOT NULL,
  sla_rule_id uuid REFERENCES process_sla_rules(id),
  target_completion timestamptz NOT NULL,
  warning_sent_at timestamptz,
  breach_detected_at timestamptz,
  actual_completion timestamptz,
  duration_minutes integer,
  status text DEFAULT 'on_track',
  escalation_triggered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_process_instances_status ON process_instances(status);
CREATE INDEX IF NOT EXISTS idx_process_instances_started_by ON process_instances(started_by);
CREATE INDEX IF NOT EXISTS idx_process_instances_started_at ON process_instances(started_at);
CREATE INDEX IF NOT EXISTS idx_process_tasks_instance ON process_tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_process_tasks_assigned ON process_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_process_tasks_status ON process_tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_log_instance ON process_execution_log(instance_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_task ON process_sla_tracking(task_id);
CREATE INDEX IF NOT EXISTS idx_sla_tracking_status ON process_sla_tracking(status);

-- Enable Row Level Security
ALTER TABLE process_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_execution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for process_versions
CREATE POLICY "Authenticated users can view process versions"
  ON process_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create process versions"
  ON process_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for process_instances
CREATE POLICY "Users can view process instances they started or are assigned to"
  ON process_instances FOR SELECT
  TO authenticated
  USING (
    auth.uid() = started_by OR
    EXISTS (
      SELECT 1 FROM process_tasks
      WHERE process_tasks.instance_id = process_instances.id
      AND process_tasks.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create process instances"
  ON process_instances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = started_by);

CREATE POLICY "Users can update their process instances"
  ON process_instances FOR UPDATE
  TO authenticated
  USING (auth.uid() = started_by);

-- RLS Policies for process_tasks
CREATE POLICY "Users can view tasks assigned to them or that they created"
  ON process_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM process_instances
      WHERE process_instances.id = process_tasks.instance_id
      AND process_instances.started_by = auth.uid()
    )
  );

CREATE POLICY "System can create process tasks"
  ON process_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Assigned users can update their tasks"
  ON process_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

-- RLS Policies for task_assignments
CREATE POLICY "Users can view their task assignments"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create task assignments"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = assigned_by);

-- RLS Policies for process_variables
CREATE POLICY "Users can view variables for their process instances"
  ON process_variables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_instances
      WHERE process_instances.id = process_variables.instance_id
      AND (process_instances.started_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM process_tasks
             WHERE process_tasks.instance_id = process_instances.id
             AND process_tasks.assigned_to = auth.uid()
           ))
    )
  );

CREATE POLICY "Authenticated users can manage process variables"
  ON process_variables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for process_execution_log
CREATE POLICY "Users can view execution logs for their processes"
  ON process_execution_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_instances
      WHERE process_instances.id = process_execution_log.instance_id
      AND (process_instances.started_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM process_tasks
             WHERE process_tasks.instance_id = process_instances.id
             AND process_tasks.assigned_to = auth.uid()
           ))
    )
  );

CREATE POLICY "System can create execution log entries"
  ON process_execution_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for process_sla_rules
CREATE POLICY "Authenticated users can view SLA rules"
  ON process_sla_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create SLA rules"
  ON process_sla_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their SLA rules"
  ON process_sla_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for process_sla_tracking
CREATE POLICY "Users can view SLA tracking for their tasks"
  ON process_sla_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_tasks
      WHERE process_tasks.id = process_sla_tracking.task_id
      AND (process_tasks.assigned_to = auth.uid() OR
           EXISTS (
             SELECT 1 FROM process_instances
             WHERE process_instances.id = process_tasks.instance_id
             AND process_instances.started_by = auth.uid()
           ))
    )
  );

CREATE POLICY "System can manage SLA tracking"
  ON process_sla_tracking FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);