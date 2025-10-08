import { supabase } from '../lib/supabase';

export interface ProcessDocument {
  id: string;
  process_id: string;
  document_name: string;
  document_type: string;
  file_size_mb: number;
  storage_url: string;
  parsing_status: string;
  bpmn_generated: boolean;
  uploaded_at: string;
}

export interface ProcessVersion {
  id: string;
  process_id: string;
  version_number: string;
  version_name?: string;
  bpmn_xml: string;
  diagram_data: any;
  change_summary?: string;
  is_published: boolean;
  approval_status: string;
  created_at: string;
}

export async function uploadProcessDocument(
  file: File,
  processId?: string
): Promise<string> {
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size must be less than 25MB');
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.visio',
    'application/vnd.ms-visio.drawing'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type must be PDF, PPTX, DOCX, or VSDX');
  }

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `process-docs/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('process_documents')
    .insert({
      process_id: processId,
      document_name: file.name,
      document_type: fileExt?.toUpperCase() || 'UNKNOWN',
      file_size_mb: file.size / (1024 * 1024),
      storage_path: fileName,
      storage_url: publicUrl,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  return data.id;
}

export async function getProcessDocuments(processId?: string): Promise<ProcessDocument[]> {
  let query = supabase
    .from('process_documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (processId) {
    query = query.eq('process_id', processId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function parseDocument(documentId: string): Promise<void> {
  await supabase
    .from('process_documents')
    .update({
      parsing_status: 'parsing'
    })
    .eq('id', documentId);

  setTimeout(async () => {
    await supabase
      .from('process_documents')
      .update({
        parsing_status: 'completed',
        parsed_at: new Date().toISOString()
      })
      .eq('id', documentId);
  }, 2000);
}

export async function convertToBPMN(documentId: string): Promise<string> {
  const sampleBPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="Process_${documentId}" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start"/>
    <bpmn:task id="Task_1" name="Process Task"/>
    <bpmn:endEvent id="EndEvent_1" name="End"/>
  </bpmn:process>
</bpmn:definitions>`;

  await supabase
    .from('process_documents')
    .update({
      bpmn_generated: true,
      bpmn_xml: sampleBPMN
    })
    .eq('id', documentId);

  return sampleBPMN;
}

export async function createProcessVersion(
  processId: string,
  versionNumber: string,
  bpmnXml: string,
  diagramData: any,
  changeSummary?: string
): Promise<string> {
  const { data, error } = await supabase.rpc('create_process_version', {
    p_process_id: processId,
    p_version_number: versionNumber,
    p_bpmn_xml: bpmnXml,
    p_diagram_data: diagramData,
    p_change_summary: changeSummary
  });

  if (error) throw error;
  return data;
}

export async function getProcessVersions(processId: string): Promise<ProcessVersion[]> {
  const { data, error } = await supabase
    .from('process_map_versions')
    .select('*')
    .eq('process_id', processId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function publishProcessVersion(versionId: string): Promise<void> {
  const { error } = await supabase.rpc('publish_version', {
    p_version_table: 'process_map_versions',
    p_version_id: versionId
  });

  if (error) throw error;
}

export async function requestApproval(
  documentType: string,
  documentId: string,
  versionId?: string
): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('document_approvals')
    .insert({
      document_type: documentType,
      document_id: documentId,
      version_id: versionId,
      requested_by: user.id,
      current_status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function approveDocument(approvalId: string, comments?: string): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('document_approvals')
    .update({
      current_status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      comments
    })
    .eq('id', approvalId);

  if (error) throw error;
}

export async function rejectDocument(
  approvalId: string,
  reason: string,
  comments?: string
): Promise<void> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('document_approvals')
    .update({
      current_status: 'rejected',
      rejected_by: user.id,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      comments
    })
    .eq('id', approvalId);

  if (error) throw error;
}

export async function generateSOPFromProcess(
  processId: string,
  processName: string,
  bpmnXml: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_sop_from_process', {
    p_process_id: processId,
    p_process_name: processName,
    p_bpmn_xml: bpmnXml
  });

  if (error) throw error;
  return data;
}

export async function generateRACIMatrix(
  processId: string,
  processName: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_raci_matrix', {
    p_process_id: processId,
    p_process_name: processName
  });

  if (error) throw error;
  return data;
}

export async function generateRiskControls(
  processId: string,
  processName: string
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_risk_controls', {
    p_process_id: processId,
    p_process_name: processName
  });

  if (error) throw error;
  return data;
}

export async function getGeneratedArtifacts(
  sourceId: string,
  artifactType?: string
): Promise<any[]> {
  let query = supabase
    .from('generated_artifacts')
    .select('*')
    .eq('source_id', sourceId)
    .order('created_at', { ascending: false });

  if (artifactType) {
    query = query.eq('artifact_type', artifactType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSOPVersion(
  sopId: string,
  versionNumber: string,
  title: string,
  content: string,
  changeSummary?: string
): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('sop_versions')
    .insert({
      sop_id: sopId,
      version_number: versionNumber,
      title,
      content,
      change_summary: changeSummary,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function createKnowledgeVersion(
  articleId: string,
  versionNumber: string,
  title: string,
  content: string,
  changeSummary?: string
): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('knowledge_versions')
    .insert({
      article_id: articleId,
      version_number: versionNumber,
      title,
      content,
      change_summary: changeSummary,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getPendingApprovals(userId?: string): Promise<any[]> {
  let query = supabase
    .from('document_approvals')
    .select('*')
    .eq('current_status', 'pending')
    .order('requested_at', { ascending: false });

  if (userId) {
    query = query.eq('current_approver', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
