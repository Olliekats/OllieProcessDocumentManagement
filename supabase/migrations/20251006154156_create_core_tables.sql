/*
  # BPO Management Platform - Core Tables

  1. New Tables
    - `users_profile` - Extended user profile data
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `role` (text) - admin, manager, user
      - `department` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `processes` - Business process definitions
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `status` (text) - draft, active, archived
      - `owner_id` (uuid, references users_profile)
      - `bpmn_xml` (text) - BPMN diagram data
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sops` - Standard Operating Procedures
      - `id` (uuid, primary key)
      - `process_id` (uuid, references processes)
      - `title` (text)
      - `content` (text)
      - `version` (text)
      - `status` (text) - draft, published, archived
      - `created_by` (uuid, references users_profile)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `kpis` - Key Performance Indicators
      - `id` (uuid, primary key)
      - `process_id` (uuid, references processes)
      - `name` (text)
      - `description` (text)
      - `target_value` (numeric)
      - `current_value` (numeric)
      - `unit` (text)
      - `frequency` (text) - daily, weekly, monthly
      - `status` (text) - on_track, at_risk, off_track
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `projects` - Project management
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `status` (text) - planning, active, on_hold, completed
      - `priority` (text) - low, medium, high, critical
      - `start_date` (date)
      - `end_date` (date)
      - `budget` (numeric)
      - `owner_id` (uuid, references users_profile)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users Profile
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  department text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Processes
CREATE TABLE IF NOT EXISTS processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text,
  status text NOT NULL DEFAULT 'draft',
  owner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  bpmn_xml text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view processes"
  ON processes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create processes"
  ON processes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Process owners can update their processes"
  ON processes FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Process owners can delete their processes"
  ON processes FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- SOPs
CREATE TABLE IF NOT EXISTS sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SOPs"
  ON sops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create SOPs"
  ON sops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "SOP creators can update their SOPs"
  ON sops FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "SOP creators can delete their SOPs"
  ON sops FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- KPIs
CREATE TABLE IF NOT EXISTS kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  unit text,
  frequency text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'on_track',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view KPIs"
  ON kpis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage KPIs"
  ON kpis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning',
  priority text NOT NULL DEFAULT 'medium',
  start_date date,
  end_date date,
  budget numeric,
  owner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);