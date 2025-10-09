/*
  # Add Diagram Data to Processes

  Adds diagram_data column to processes table for storing BPMN visual diagrams
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