/*
  # Document Management, Version Control & Auto-Generation
  
  ## New Tables
  1. process_documents - Uploaded process documents
  2. process_map_versions - Version control for process maps
  3. sop_versions - Version control for SOPs
  4. knowledge_versions - Version control for knowledge articles
  5. generated_artifacts - Auto-generated SOPs, RACI, Risk matrices
  6. document_approvals - Approval workflow tracking
  
  ## Updates
  - Add version fields to existing tables
  - Add approval status fields
*/

-- Process Documents (uploaded files)
CREATE TABLE IF NOT EXISTS process_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_size_mb numeric(5,2) NOT NULL,
  storage_path text NOT NULL,
  storage_url text NOT NULL,
  upload_status text DEFAULT 'uploaded',
  parsing_status text DEFAULT 'pending',
  parsed_data jsonb,
  bpmn_generated boolean DEFAULT false,
  bpmn_xml text,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  parsed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Process Map Versions
CREATE TABLE IF NOT EXISTS process_map_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL,
  version_number text NOT NULL,
  version_name text,
  bpmn_xml text NOT NULL,
  diagram_data jsonb,
  change_summary text,
  is_published boolean DEFAULT false,
  approval_status text DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  approved_by uuid REFERENCES auth.users(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(process_id, version_number)
);

-- SOP Versions
CREATE TABLE IF NOT EXISTS sop_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid NOT NULL,
  version_number text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  change_summary text,
  is_published boolean DEFAULT false,
  approval_status text DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  approved_by uuid REFERENCES auth.users(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sop_id, version_number)
);

-- Knowledge Article Versions
CREATE TABLE IF NOT EXISTS knowledge_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  version_number text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  change_summary text,
  is_published boolean DEFAULT false,
  approval_status text DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  approved_by uuid REFERENCES auth.users(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id, version_number)
);

-- Generated Artifacts (SOPs, RACI, Risk & Controls)
CREATE TABLE IF NOT EXISTS generated_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  artifact_type text NOT NULL,
  artifact_name text NOT NULL,
  artifact_data jsonb NOT NULL,
  generation_method text DEFAULT 'auto',
  confidence_score numeric(5,2),
  is_reviewed boolean DEFAULT false,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Document Approvals
CREATE TABLE IF NOT EXISTS document_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  version_id uuid,
  approval_workflow_id uuid,
  current_status text DEFAULT 'pending',
  requested_by uuid REFERENCES auth.users(id) NOT NULL,
  requested_at timestamptz DEFAULT now(),
  current_approver uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejected_by uuid REFERENCES auth.users(id),
  rejected_at timestamptz,
  rejection_reason text,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_process_docs_process ON process_documents(process_id);
CREATE INDEX IF NOT EXISTS idx_process_docs_type ON process_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_process_docs_status ON process_documents(parsing_status);
CREATE INDEX IF NOT EXISTS idx_map_versions_process ON process_map_versions(process_id);
CREATE INDEX IF NOT EXISTS idx_map_versions_published ON process_map_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_sop_versions_sop ON sop_versions(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_versions_published ON sop_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_knowledge_versions_article ON knowledge_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_versions_published ON knowledge_versions(is_published);
CREATE INDEX IF NOT EXISTS idx_artifacts_source ON generated_artifacts(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON generated_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_doc_approvals_doc ON document_approvals(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_doc_approvals_status ON document_approvals(current_status);

-- Enable RLS
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_map_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "View process documents" ON process_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage process documents" ON process_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View process versions" ON process_map_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage process versions" ON process_map_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View SOP versions" ON sop_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage SOP versions" ON sop_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View knowledge versions" ON knowledge_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage knowledge versions" ON knowledge_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View artifacts" ON generated_artifacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage artifacts" ON generated_artifacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "View approvals" ON document_approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage approvals" ON document_approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Function to create new version
CREATE OR REPLACE FUNCTION create_process_version(
  p_process_id uuid,
  p_version_number text,
  p_bpmn_xml text,
  p_diagram_data jsonb,
  p_change_summary text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_version_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  INSERT INTO process_map_versions (
    process_id,
    version_number,
    bpmn_xml,
    diagram_data,
    change_summary,
    created_by
  )
  VALUES (
    p_process_id,
    p_version_number,
    p_bpmn_xml,
    p_diagram_data,
    p_change_summary,
    v_user_id
  )
  RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$;

-- Function to publish version
CREATE OR REPLACE FUNCTION publish_version(
  p_version_table text,
  p_version_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  EXECUTE format('
    UPDATE %I 
    SET 
      is_published = true,
      approval_status = ''approved'',
      approved_by = $1,
      published_at = now()
    WHERE id = $2
  ', p_version_table)
  USING v_user_id, p_version_id;
END;
$$;

-- Function to generate SOP from process
CREATE OR REPLACE FUNCTION generate_sop_from_process(
  p_process_id uuid,
  p_process_name text,
  p_bpmn_xml text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_artifact_id uuid;
  v_sop_content jsonb;
BEGIN
  v_sop_content := jsonb_build_object(
    'title', 'SOP: ' || p_process_name,
    'process_id', p_process_id,
    'sections', jsonb_build_array(
      jsonb_build_object('section', 'Purpose', 'content', 'Standard Operating Procedure for ' || p_process_name),
      jsonb_build_object('section', 'Scope', 'content', 'This SOP applies to all process executions'),
      jsonb_build_object('section', 'Steps', 'content', 'Generated from BPMN workflow'),
      jsonb_build_object('section', 'Responsibilities', 'content', 'As defined in RACI matrix'),
      jsonb_build_object('section', 'References', 'content', 'Process Map ID: ' || p_process_id)
    ),
    'generated_from', 'bpmn',
    'bpmn_xml', p_bpmn_xml
  );
  
  INSERT INTO generated_artifacts (
    source_type,
    source_id,
    artifact_type,
    artifact_name,
    artifact_data,
    confidence_score
  )
  VALUES (
    'process',
    p_process_id,
    'sop',
    'SOP: ' || p_process_name,
    v_sop_content,
    85.0
  )
  RETURNING id INTO v_artifact_id;
  
  RETURN v_artifact_id;
END;
$$;

-- Function to generate RACI matrix
CREATE OR REPLACE FUNCTION generate_raci_matrix(
  p_process_id uuid,
  p_process_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_artifact_id uuid;
  v_raci_data jsonb;
BEGIN
  v_raci_data := jsonb_build_object(
    'process_id', p_process_id,
    'process_name', p_process_name,
    'matrix', jsonb_build_array(
      jsonb_build_object(
        'task', 'Process Initiation',
        'responsible', 'Process Owner',
        'accountable', 'Department Head',
        'consulted', 'Stakeholders',
        'informed', 'Team Members'
      ),
      jsonb_build_object(
        'task', 'Process Execution',
        'responsible', 'Team Lead',
        'accountable', 'Process Owner',
        'consulted', 'Subject Matter Experts',
        'informed', 'Management'
      ),
      jsonb_build_object(
        'task', 'Process Completion',
        'responsible', 'Team Members',
        'accountable', 'Team Lead',
        'consulted', 'Quality Assurance',
        'informed', 'All Stakeholders'
      )
    )
  );
  
  INSERT INTO generated_artifacts (
    source_type,
    source_id,
    artifact_type,
    artifact_name,
    artifact_data,
    confidence_score
  )
  VALUES (
    'process',
    p_process_id,
    'raci',
    'RACI Matrix: ' || p_process_name,
    v_raci_data,
    80.0
  )
  RETURNING id INTO v_artifact_id;
  
  RETURN v_artifact_id;
END;
$$;

-- Function to generate Risk & Control matrix
CREATE OR REPLACE FUNCTION generate_risk_controls(
  p_process_id uuid,
  p_process_name text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_artifact_id uuid;
  v_risk_data jsonb;
BEGIN
  v_risk_data := jsonb_build_object(
    'process_id', p_process_id,
    'process_name', p_process_name,
    'risks', jsonb_build_array(
      jsonb_build_object(
        'risk', 'Process Delay',
        'category', 'Operational',
        'likelihood', 'Medium',
        'impact', 'Medium',
        'control', 'SLA monitoring and alerts',
        'control_type', 'Detective',
        'owner', 'Process Owner'
      ),
      jsonb_build_object(
        'risk', 'Data Accuracy',
        'category', 'Quality',
        'likelihood', 'Low',
        'impact', 'High',
        'control', 'Validation checkpoints',
        'control_type', 'Preventive',
        'owner', 'Quality Assurance'
      ),
      jsonb_build_object(
        'risk', 'Compliance Breach',
        'category', 'Compliance',
        'likelihood', 'Low',
        'impact', 'High',
        'control', 'Compliance checkpoints and audit trails',
        'control_type', 'Preventive',
        'owner', 'Compliance Officer'
      )
    )
  );
  
  INSERT INTO generated_artifacts (
    source_type,
    source_id,
    artifact_type,
    artifact_name,
    artifact_data,
    confidence_score
  )
  VALUES (
    'process',
    p_process_id,
    'risk_control',
    'Risk & Control Matrix: ' || p_process_name,
    v_risk_data,
    75.0
  )
  RETURNING id INTO v_artifact_id;
  
  RETURN v_artifact_id;
END;
$$;