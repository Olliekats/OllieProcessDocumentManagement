/*
  # Fix Process Documents RLS Policies
  
  Drop the "ALL" policy and create separate policies for each operation:
  - INSERT: Allow authenticated users to insert documents
  - SELECT: Allow authenticated users to view documents
  - UPDATE: Allow authenticated users to update documents
  - DELETE: Allow authenticated users to delete documents
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View process documents" ON process_documents;
DROP POLICY IF EXISTS "Manage process documents" ON process_documents;

-- Create separate policies for each operation
CREATE POLICY "Users can insert process documents"
  ON process_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view process documents"
  ON process_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update process documents"
  ON process_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete process documents"
  ON process_documents FOR DELETE
  TO authenticated
  USING (true);