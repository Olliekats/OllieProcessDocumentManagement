/*
  # Add Diagram Data to Processes

  1. Changes
    - Add diagram_data column to processes table for storing BPMN visual diagrams
    - Column stores JSON data with nodes and connections
  
  2. Notes
    - JSONB type for efficient querying and indexing
    - Nullable to support existing processes without diagrams
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processes' AND column_name = 'diagram_data'
  ) THEN
    ALTER TABLE processes ADD COLUMN diagram_data jsonb;
  END IF;
END $$;
