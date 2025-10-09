/*
  # Create Collaboration Comments Table

  Creates collaboration_comments table for real-time commenting on entities
*/

CREATE TABLE IF NOT EXISTS collaboration_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collab_comments_entity ON collaboration_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_collab_comments_user ON collaboration_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_comments_created ON collaboration_comments(created_at);

ALTER TABLE collaboration_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert comments"
  ON collaboration_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all comments"
  ON collaboration_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete own comments"
  ON collaboration_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);