/*
  # Create Project Tasks and Dependencies Tables for Gantt Charts

  ## Overview
  This migration creates the database structure needed for fully functional Gantt charts
  with drag-and-drop support, task dependencies, and duration management.

  ## New Tables

  ### 1. `project_tasks`
  - `id` (uuid, primary key) - Unique task identifier
  - `project_id` (uuid, foreign key) - Links to transition_projects
  - `name` (text) - Task name/title
  - `description` (text) - Task details
  - `start_date` (date) - Task start date
  - `end_date` (date) - Task end date
  - `duration_days` (integer) - Calculated duration
  - `progress` (integer) - 0-100 completion percentage
  - `status` (text) - not_started, in_progress, completed, blocked
  - `assigned_to` (uuid) - User responsible for task
  - `order_index` (integer) - Display order in Gantt chart
  - `color` (text) - Custom color for task bar
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 2. `task_dependencies`
  - `id` (uuid, primary key) - Unique dependency identifier
  - `predecessor_id` (uuid, foreign key) - Task that must complete first
  - `successor_id` (uuid, foreign key) - Task that depends on predecessor
  - `dependency_type` (text) - finish_to_start, start_to_start, finish_to_finish, start_to_finish
  - `lag_days` (integer) - Delay between tasks (can be negative for lead time)
  - `created_at` (timestamptz) - Record creation time

  ### 3. `project_milestones`
  - `id` (uuid, primary key) - Unique milestone identifier
  - `project_id` (uuid, foreign key) - Links to transition_projects
  - `name` (text) - Milestone name
  - `date` (date) - Milestone target date
  - `status` (text) - pending, achieved, missed
  - `description` (text) - Milestone details
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz) - Record creation time

  ## Security
  - Enable RLS on all tables
  - Policies allow authenticated users to manage tasks for their projects
  - Read access for team members
  - Write access for project owners and assigned users

  ## Indexes
  - Index on project_id for fast task lookups
  - Index on assigned_to for user task views
  - Index on dates for timeline filtering
  - Index on dependency relationships
*/

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES transition_projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_days integer GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  assigned_to uuid REFERENCES auth.users(id),
  order_index integer DEFAULT 0,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
  successor_id uuid REFERENCES project_tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type text DEFAULT 'finish_to_start' CHECK (
    dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')
  ),
  lag_days integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_dependency CHECK (predecessor_id != successor_id),
  CONSTRAINT unique_dependency UNIQUE (predecessor_id, successor_id)
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES transition_projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'missed')),
  description text DEFAULT '',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_dates ON project_tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_order ON project_tasks(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_successor ON task_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_date ON project_milestones(date);

-- Enable Row Level Security
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_tasks

-- Users can view tasks for projects they own or are assigned to
CREATE POLICY "Users can view project tasks"
  ON project_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_tasks.project_id
      AND transition_projects.owner_id = auth.uid()
    )
    OR assigned_to = auth.uid()
  );

-- Users can create tasks for projects they own
CREATE POLICY "Project owners can create tasks"
  ON project_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_tasks.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

-- Users can update tasks they own or are assigned to
CREATE POLICY "Users can update their tasks"
  ON project_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_tasks.project_id
      AND transition_projects.owner_id = auth.uid()
    )
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_tasks.project_id
      AND transition_projects.owner_id = auth.uid()
    )
    OR assigned_to = auth.uid()
  );

-- Project owners can delete tasks
CREATE POLICY "Project owners can delete tasks"
  ON project_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_tasks.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

-- RLS Policies for task_dependencies

-- Users can view dependencies for tasks they can see
CREATE POLICY "Users can view task dependencies"
  ON task_dependencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN transition_projects ON project_tasks.project_id = transition_projects.id
      WHERE project_tasks.id = task_dependencies.predecessor_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

-- Project owners can manage dependencies
CREATE POLICY "Project owners can create dependencies"
  ON task_dependencies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN transition_projects ON project_tasks.project_id = transition_projects.id
      WHERE project_tasks.id = task_dependencies.predecessor_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete dependencies"
  ON task_dependencies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks
      JOIN transition_projects ON project_tasks.project_id = transition_projects.id
      WHERE project_tasks.id = task_dependencies.predecessor_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

-- RLS Policies for project_milestones

-- Users can view milestones for their projects
CREATE POLICY "Users can view project milestones"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_milestones.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

-- Project owners can manage milestones
CREATE POLICY "Project owners can create milestones"
  ON project_milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_milestones.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update milestones"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_milestones.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_milestones.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete milestones"
  ON project_milestones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transition_projects
      WHERE transition_projects.id = project_milestones.project_id
      AND transition_projects.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS project_tasks_updated_at ON project_tasks;
CREATE TRIGGER project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tasks_updated_at();
