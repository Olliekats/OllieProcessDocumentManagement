/*
  # Add Email to Users Profile

  1. Changes
    - Add email column to users_profile table
  
  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'email'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN email text UNIQUE;
  END IF;
END $$;