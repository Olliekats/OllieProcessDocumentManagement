/*
  # Fix Storage Bucket Policies

  1. Changes
    - Add storage policies for the documents bucket to allow authenticated users to upload, view, and delete files
    
  2. Security
    - SELECT policy: Authenticated users can view all files
    - INSERT policy: Authenticated users can upload files
    - UPDATE policy: Users can update their own files
    - DELETE policy: Users can delete their own files
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Allow authenticated users to view all files in documents bucket
CREATE POLICY "Allow authenticated users to view files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

-- Allow authenticated users to upload files to documents bucket
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow users to update their own files
CREATE POLICY "Allow users to update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'documents' AND owner = auth.uid());

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND owner = auth.uid());
