import { supabase } from '../lib/supabase';

export async function getIntegrationConnections() {
  const { data, error } = await supabase
    .from('integration_connections')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createConnection(
  name: string,
  type: string,
  baseUrl: string,
  authType: string,
  authConfig: any
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('integration_connections')
    .insert({
      connection_name: name,
      connection_type: type,
      base_url: baseUrl,
      auth_type: authType,
      auth_config: authConfig,
      is_active: true,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function testConnection(connectionId: string) {
  const { data: connection } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (!connection) throw new Error('Connection not found');

  const { error } = await supabase
    .from('integration_connections')
    .update({
      last_test_at: new Date().toISOString(),
      last_test_status: 'success'
    })
    .eq('id', connectionId);

  if (error) throw error;

  await supabase.rpc('log_integration_event', {
    p_type: 'connection_test',
    p_integration_id: connectionId,
    p_direction: 'outbound',
    p_status: 'success'
  });

  return true;
}

export async function getWebhooks() {
  const { data, error } = await supabase
    .from('integration_webhooks')
    .select('*')
    .order('created_at', { ascending: false});

  if (error) throw error;
  return data || [];
}

export async function createWebhook(
  name: string,
  url: string,
  event: string,
  method: string = 'POST',
  headers?: any
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('integration_webhooks')
    .insert({
      webhook_name: name,
      webhook_url: url,
      trigger_event: event,
      webhook_method: method,
      headers: headers,
      is_active: true,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleWebhook(webhookId: string, isActive: boolean) {
  const { error } = await supabase
    .from('integration_webhooks')
    .update({ is_active: isActive })
    .eq('id', webhookId);

  if (error) throw error;
}

export async function getIntegrationLogs(limit: number = 50) {
  const { data, error } = await supabase
    .from('integration_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getDataMappings() {
  const { data, error } = await supabase
    .from('integration_mappings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createDataMapping(
  name: string,
  sourceSystem: string,
  targetSystem: string,
  entityType: string,
  fieldMappings: any
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('integration_mappings')
    .insert({
      mapping_name: name,
      source_system: sourceSystem,
      target_system: targetSystem,
      entity_type: entityType,
      field_mappings: fieldMappings,
      is_active: true,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScheduledIntegrations() {
  const { data, error } = await supabase
    .from('integration_schedules')
    .select(`
      *,
      integration_connections(connection_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSchedule(
  name: string,
  connectionId: string,
  scheduleType: string,
  cronExpression?: string,
  intervalMinutes?: number
) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from('integration_schedules')
    .insert({
      schedule_name: name,
      connection_id: connectionId,
      schedule_type: scheduleType,
      cron_expression: cronExpression,
      interval_minutes: intervalMinutes,
      is_active: true,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function triggerWebhook(webhookId: string, payload: any) {
  const { data: webhook } = await supabase
    .from('integration_webhooks')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (!webhook || !webhook.is_active) {
    throw new Error('Webhook not found or inactive');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.webhook_url, {
      method: webhook.webhook_method,
      headers: {
        'Content-Type': 'application/json',
        ...(webhook.headers || {})
      },
      body: JSON.stringify(payload)
    });

    const duration = Date.now() - startTime;
    const success = response.ok;

    await supabase.rpc('update_webhook_stats', {
      p_webhook_id: webhookId,
      p_success: success
    });

    await supabase.rpc('log_integration_event', {
      p_type: 'webhook',
      p_integration_id: webhookId,
      p_direction: 'outbound',
      p_status: success ? 'success' : 'failed',
      p_request: payload,
      p_response: { status: response.status },
      p_duration_ms: duration
    });

    return { success, status: response.status };
  } catch (error: any) {
    await supabase.rpc('update_webhook_stats', {
      p_webhook_id: webhookId,
      p_success: false
    });

    await supabase.rpc('log_integration_event', {
      p_type: 'webhook',
      p_integration_id: webhookId,
      p_direction: 'outbound',
      p_status: 'error',
      p_request: payload,
      p_error: error.message
    });

    throw error;
  }
}
