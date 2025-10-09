/*
  # Create SOP Versions Table

  1. New Tables
    - `sop_versions`
      - `id` (uuid, primary key)
      - `sop_id` (uuid, references sops)
      - `version_number` (text)
      - `content` (text)
      - `change_description` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `sop_versions` table
    - Add policies for authenticated users to manage versions
*/

CREATE TABLE IF NOT EXISTS sop_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid REFERENCES sops(id) ON DELETE CASCADE NOT NULL,
  version_number text NOT NULL,
  content text NOT NULL,
  change_description text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE sop_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SOP versions"
  ON sop_versions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create SOP versions"
  ON sop_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_sop_versions_sop_id ON sop_versions(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_versions_created_at ON sop_versions(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sops' AND column_name = 'source_artifact_id'
  ) THEN
    ALTER TABLE sops ADD COLUMN source_artifact_id uuid REFERENCES process_artifacts(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sops' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE sops ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sops' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE sops ADD COLUMN approved_at timestamptz;
  END IF;
END $$;
