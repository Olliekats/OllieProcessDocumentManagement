/*
  # Create Process Mapping Table

  1. New Tables
    - `process_mapping`
      - `id` (uuid, primary key)
      - `process_name` (text) - Name of the process
      - `description` (text) - Process description
      - `department` (text) - Department owning the process
      - `category` (text) - Process category (core, support, management)
      - `complexity` (text) - Complexity level (low, medium, high)
      - `status` (text) - Current status
      - `cycle_time` (numeric) - Cycle time in hours
      - `last_review_date` (date) - Last review date
      - `owner_id` (uuid) - User who owns this process
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `process_mapping` table
    - Add policies for authenticated users to manage their processes
*/

CREATE TABLE IF NOT EXISTS process_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_name text NOT NULL,
  description text,
  department text NOT NULL,
  category text NOT NULL CHECK (category IN ('core', 'support', 'management')),
  complexity text NOT NULL CHECK (complexity IN ('low', 'medium', 'high')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'active', 'archived')),
  cycle_time numeric,
  last_review_date date,
  owner_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE process_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all process mappings"
  ON process_mapping FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own process mappings"
  ON process_mapping FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own process mappings"
  ON process_mapping FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own process mappings"
  ON process_mapping FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);