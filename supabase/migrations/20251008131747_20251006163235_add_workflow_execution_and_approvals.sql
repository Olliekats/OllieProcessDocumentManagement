/*
  # Add Workflow Execution and Approval System
  
  Creates workflow instances, steps, approvals, and user roles for managing
  approval processes and workflow execution.
*/

-- Create workflow_instances table
CREATE TABLE IF NOT EXISTS workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_step integer DEFAULT 0,
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all workflow instances"
  ON workflow_instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create workflow instances"
  ON workflow_instances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = started_by);

CREATE POLICY "Users can update workflow instances"
  ON workflow_instances FOR UPDATE
  TO authenticated
  USING (true);

-- Create workflow_steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid REFERENCES workflow_instances(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL,
  step_name text NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('approval', 'notification', 'action')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'failed')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  data jsonb DEFAULT '{}'::jsonb,
  comments text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow steps"
  ON workflow_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Assigned users can update workflow steps"
  ON workflow_steps FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to);

CREATE POLICY "Users can create workflow steps"
  ON workflow_steps FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  approval_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  requested_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  comments text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all approvals"
  ON approvals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create approval requests"
  ON approvals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can update approvals"
  ON approvals FOR UPDATE
  TO authenticated
  USING (true);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'viewer', 'approver')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status 
  ON workflow_instances(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_instance 
  ON workflow_steps(instance_id, step_number);

CREATE INDEX IF NOT EXISTS idx_approvals_status 
  ON approvals(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user 
  ON user_roles(user_id);