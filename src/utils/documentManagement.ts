import { supabase } from '../lib/supabase';
import {
  extractTextFromDocument,
  analyzeProcessDocument,
  generateBPMNFromProcess,
  generateSOPContent,
  generateRACIContent,
  generateRiskControlContent
} from '../services/openaiService';

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
  uploaded_by: string;
  uploader_email?: string;
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

  if (uploadError) {
    if (uploadError.message.includes('tenant config')) {
      throw new Error('Storage service is not fully configured. Please contact your administrator to enable Supabase Storage for this project.');
    }
    throw uploadError;
  }

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
    .select(`
      *,
      uploader:uploaded_by (
        email
      )
    `)
    .order('uploaded_at', { ascending: false });

  if (processId) {
    query = query.eq('process_id', processId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((doc: any) => ({
    ...doc,
    uploader_email: doc.uploader?.email || 'Unknown'
  }));
}

export async function parseDocument(documentId: string, file?: File): Promise<any> {
  try {
    await supabase
      .from('process_documents')
      .update({ parsing_status: 'parsing' })
      .eq('id', documentId);

    let documentText = '';

    if (file) {
      documentText = await extractTextFromDocument(file);
    } else {
      const { data: doc } = await supabase
        .from('process_documents')
        .select('storage_url')
        .eq('id', documentId)
        .single();

      documentText = `Document stored at: ${doc?.storage_url}. Please analyze based on document type and content.`;
    }

    const analysis = await analyzeProcessDocument(documentText);

    await supabase
      .from('process_documents')
      .update({
        parsing_status: 'completed',
        parsed_at: new Date().toISOString(),
        parsed_data: analysis
      })
      .eq('id', documentId);

    return analysis;
  } catch (error) {
    await supabase
      .from('process_documents')
      .update({
        parsing_status: 'failed'
      })
      .eq('id', documentId);

    throw error;
  }
}

export async function convertToBPMN(documentId: string): Promise<string> {
  try {
    const { data: doc } = await supabase
      .from('process_documents')
      .select('parsed_data, document_name')
      .eq('id', documentId)
      .single();

    if (!doc?.parsed_data) {
      throw new Error('Document must be parsed before converting to BPMN');
    }

    const processAnalysis = doc.parsed_data;
    const bpmnXml = await generateBPMNFromProcess(processAnalysis);

    await supabase
      .from('process_documents')
      .update({
        bpmn_generated: true,
        bpmn_xml: bpmnXml
      })
      .eq('id', documentId);

    await supabase
      .from('generated_artifacts')
      .insert({
        source_type: 'process',
        source_id: documentId,
        artifact_type: 'bpmn',
        artifact_name: `BPMN Diagram: ${processAnalysis.processName || doc.document_name}`,
        artifact_data: { content: bpmnXml, format: 'xml' },
        generation_method: 'openai',
        confidence_score: 95.0
      });

    return bpmnXml;
  } catch (error) {
    console.error('Error converting to BPMN:', error);
    throw error;
  }
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
  try {
    const { data: doc } = await supabase
      .from('process_documents')
      .select('parsed_data')
      .eq('id', processId)
      .single();

    const processAnalysis = doc?.parsed_data || {
      processName,
      processDescription: 'Process description not available',
      steps: [],
      roles: [],
      inputs: [],
      outputs: []
    };

    const sopContent = await generateSOPContent(processAnalysis, bpmnXml);

    const { data, error } = await supabase
      .from('generated_artifacts')
      .insert({
        source_type: 'process',
        source_id: processId,
        artifact_type: 'sop',
        artifact_name: `SOP: ${processName}`,
        artifact_data: { content: sopContent },
        generation_method: 'openai',
        confidence_score: 92.0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error generating SOP:', error);
    throw error;
  }
}

export async function generateRACIMatrix(
  processId: string,
  processName: string
): Promise<string> {
  try {
    const { data: doc } = await supabase
      .from('process_documents')
      .select('parsed_data')
      .eq('id', processId)
      .single();

    const processAnalysis = doc?.parsed_data || {
      processName,
      processDescription: 'Process description not available',
      steps: [],
      roles: []
    };

    const raciContent = await generateRACIContent(processAnalysis);

    const { data, error } = await supabase
      .from('generated_artifacts')
      .insert({
        source_type: 'process',
        source_id: processId,
        artifact_type: 'raci',
        artifact_name: `RACI Matrix: ${processName}`,
        artifact_data: { content: raciContent },
        generation_method: 'openai',
        confidence_score: 90.0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error generating RACI matrix:', error);
    throw error;
  }
}

export async function generateRiskControls(
  processId: string,
  processName: string
): Promise<string> {
  try {
    const { data: doc } = await supabase
      .from('process_documents')
      .select('parsed_data')
      .eq('id', processId)
      .single();

    const processAnalysis = doc?.parsed_data || {
      processName,
      processDescription: 'Process description not available',
      steps: [],
      roles: []
    };

    const riskContent = await generateRiskControlContent(processAnalysis);

    const { data, error } = await supabase
      .from('generated_artifacts')
      .insert({
        source_type: 'process',
        source_id: processId,
        artifact_type: 'risk_control',
        artifact_name: `Risk & Control Matrix: ${processName}`,
        artifact_data: { content: riskContent },
        generation_method: 'openai',
        confidence_score: 88.0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error generating risk controls:', error);
    throw error;
  }
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
