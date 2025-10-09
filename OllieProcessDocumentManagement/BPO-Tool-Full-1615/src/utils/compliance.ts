import { supabase } from '../lib/supabase';

export async function getComplianceRequirements(status?: string) {
  let query = supabase
    .from('compliance_reqs')
    .select(`
      *,
      users_profile!compliance_reqs_responsible_party_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createComplianceRequirement(
  name: string,
  regulation: string,
  description: string,
  level: string,
  responsibleParty?: string,
  dueDate?: string
) {
  const { data, error } = await supabase
    .from('compliance_reqs')
    .insert({
      requirement_name: name,
      regulation,
      description,
      requirement_level: level,
      responsible_party: responsibleParty,
      due_date: dueDate,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateComplianceStatus(id: string, status: string, evidenceUrl?: string) {
  const { error } = await supabase
    .from('compliance_reqs')
    .update({
      status,
      evidence_url: evidenceUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getAuditLog(entityType?: string, entityId?: string) {
  let query = supabase
    .from('compliance_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (entityId) {
    query = query.eq('entity_id', entityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function logAuditEvent(
  entityType: string,
  entityId: string,
  action: string,
  changes?: any,
  metadata?: any
) {
  const { data, error } = await supabase.rpc('log_audit_event', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_action: action,
    p_changes: changes,
    p_metadata: metadata
  });

  if (error) throw error;
  return data;
}

export async function getRisks(status?: string) {
  let query = supabase
    .from('compliance_risks')
    .select(`
      *,
      users_profile!compliance_risks_owner_id_fkey(full_name)
    `)
    .order('risk_score', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createRisk(
  title: string,
  description: string,
  category: string,
  probability: string,
  impact: string,
  processId?: string,
  ownerId?: string
) {
  const { data: score } = await supabase.rpc('calculate_risk_score', {
    p_probability: probability,
    p_impact: impact
  });

  const { data, error } = await supabase
    .from('compliance_risks')
    .insert({
      risk_title: title,
      risk_description: description,
      risk_category: category,
      probability,
      impact,
      risk_score: score || 9,
      process_ref_id: processId,
      owner_id: ownerId,
      status: 'identified'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRiskStatus(id: string, status: string, mitigationPlan?: string) {
  const { error } = await supabase
    .from('compliance_risks')
    .update({
      status,
      mitigation_plan: mitigationPlan,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getComplianceCheckpoints(processId?: string) {
  let query = supabase
    .from('compliance_checkpoints')
    .select('*')
    .order('created_at', { ascending: false });

  if (processId) {
    query = query.eq('checkpoint_process_id', processId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCheckpoint(
  processId: string,
  nodeId: string,
  name: string,
  type: string,
  rules: any,
  isMandatory: boolean = true
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('compliance_checkpoints')
    .insert({
      checkpoint_process_id: processId,
      node_id: nodeId,
      checkpoint_name: name,
      checkpoint_type: type,
      validation_rules: rules,
      is_mandatory: isMandatory,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function validateCheckpoint(
  checkpointId: string,
  instanceId: string,
  taskId: string,
  result: boolean,
  data?: any,
  reason?: string
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { error } = await supabase
    .from('compliance_validations')
    .insert({
      checkpoint_id: checkpointId,
      instance_id: instanceId,
      task_id: taskId,
      validation_result: result,
      validation_data: data,
      failure_reason: reason,
      validated_by: user?.id
    });

  if (error) throw error;

  await logAuditEvent(
    'checkpoint_validation',
    checkpointId,
    result ? 'validation_passed' : 'validation_failed',
    { result, reason },
    { instance_id: instanceId, task_id: taskId }
  );
}

export async function acknowledgePolicyAsync(
  policyId: string,
  policyName: string,
  version: string
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return;

  const { error } = await supabase
    .from('compliance_policies')
    .insert({
      policy_ref_id: policyId,
      policy_name: policyName,
      user_id: user.id,
      version
    });

  if (error) throw error;

  await logAuditEvent(
    'policy',
    policyId,
    'acknowledged',
    { version },
    { user_id: user.id }
  );
}

export async function getUserPolicyAcknowledgements(userId: string) {
  const { data, error } = await supabase
    .from('compliance_policies')
    .select('*')
    .eq('user_id', userId)
    .order('acknowledged_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getComplianceStats() {
  const [reqs, risks, audits] = await Promise.all([
    getComplianceRequirements(),
    getRisks(),
    getAuditLog()
  ]);

  return {
    totalRequirements: reqs.length,
    compliantCount: reqs.filter(r => r.status === 'compliant').length,
    pendingCount: reqs.filter(r => r.status === 'pending').length,
    totalRisks: risks.length,
    highRisks: risks.filter(r => r.risk_score >= 12).length,
    totalAuditEvents: audits.length
  };
}
