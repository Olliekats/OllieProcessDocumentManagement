import { supabase } from '../lib/supabase';

export interface BPMNNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
}

export interface BPMNConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface BPMNDiagram {
  nodes: BPMNNode[];
  connections: BPMNConnection[];
}

export interface ProcessInstance {
  id: string;
  process_id: string;
  version_id: string;
  instance_name: string;
  status: string;
  current_node_id: string | null;
  progress_percentage: number;
  priority: string;
  started_by: string;
  started_at: string;
  completed_at: string | null;
  estimated_completion: string | null;
  variables: Record<string, any>;
}

export interface ProcessTask {
  id: string;
  instance_id: string;
  node_id: string;
  node_label: string;
  node_type: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: string;
}

export async function createProcessVersion(processId: string, diagramData: BPMNDiagram, changeDescription?: string) {
  const { data: existingVersions } = await supabase
    .from('process_versions')
    .select('version_number')
    .eq('process_id', processId)
    .order('version_number', { ascending: false })
    .limit(1);

  const nextVersion = existingVersions && existingVersions.length > 0
    ? existingVersions[0].version_number + 1
    : 1;

  await supabase
    .from('process_versions')
    .update({ is_active: false })
    .eq('process_id', processId);

  const { data, error } = await supabase
    .from('process_versions')
    .insert({
      process_id: processId,
      version_number: nextVersion,
      diagram_data: diagramData,
      change_description: changeDescription,
      is_active: true,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function startProcessInstance(
  processId: string,
  instanceName: string,
  initialVariables: Record<string, any> = {},
  priority: string = 'medium'
): Promise<string> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data: activeVersion } = await supabase
    .from('process_versions')
    .select('*')
    .eq('process_id', processId)
    .eq('is_active', true)
    .single();

  if (!activeVersion) throw new Error('No active version found for this process');

  const diagram = activeVersion.diagram_data as BPMNDiagram;
  const startNode = diagram.nodes.find(n => n.type === 'start');

  if (!startNode) throw new Error('No start node found in process diagram');

  const { data: instance, error: instanceError } = await supabase
    .from('process_instances')
    .insert({
      process_id: processId,
      version_id: activeVersion.id,
      instance_name: instanceName,
      status: 'running',
      current_node_id: startNode.id,
      progress_percentage: 0,
      priority: priority,
      started_by: user.id,
      variables: initialVariables
    })
    .select()
    .single();

  if (instanceError) throw instanceError;

  await logExecution(instance.id, null, 'process_started', `Process instance "${instanceName}" started`, user.id, null, startNode.id);

  await advanceProcess(instance.id, startNode.id);

  return instance.id;
}

export async function advanceProcess(instanceId: string, fromNodeId: string) {
  const { data: instance } = await supabase
    .from('process_instances')
    .select('*, process_versions!inner(diagram_data)')
    .eq('id', instanceId)
    .single();

  if (!instance) throw new Error('Process instance not found');

  const diagram = instance.process_versions.diagram_data as BPMNDiagram;
  const outgoingConnections = diagram.connections.filter(c => c.from === fromNodeId);

  if (outgoingConnections.length === 0) {
    await completeProcess(instanceId);
    return;
  }

  for (const connection of outgoingConnections) {
    const nextNode = diagram.nodes.find(n => n.id === connection.to);
    if (!nextNode) continue;

    await createTask(instanceId, nextNode);
  }

  const completedTasks = await supabase
    .from('process_tasks')
    .select('id')
    .eq('instance_id', instanceId)
    .eq('status', 'completed');

  const totalTasks = await supabase
    .from('process_tasks')
    .select('id')
    .eq('instance_id', instanceId);

  const progress = totalTasks.data && completedTasks.data
    ? Math.round((completedTasks.data.length / totalTasks.data.length) * 100)
    : 0;

  await supabase
    .from('process_instances')
    .update({
      progress_percentage: progress,
      current_node_id: outgoingConnections[0].to
    })
    .eq('id', instanceId);
}

async function createTask(instanceId: string, node: BPMNNode) {
  const existingTask = await supabase
    .from('process_tasks')
    .select('id')
    .eq('instance_id', instanceId)
    .eq('node_id', node.id)
    .maybeSingle();

  if (existingTask.data) return;

  const { data: instance } = await supabase
    .from('process_instances')
    .select('priority')
    .eq('id', instanceId)
    .single();

  const taskData = {
    instance_id: instanceId,
    node_id: node.id,
    node_label: node.label,
    node_type: node.type,
    status: node.type === 'end' ? 'completed' : 'pending',
    priority: instance?.priority || 'medium'
  };

  const { data: task, error } = await supabase
    .from('process_tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) throw error;

  if (node.type === 'end') {
    await completeTask(task.id, {});
  } else if (node.type === 'task') {
    await assignTaskAutomatically(task.id);
  } else if (node.type === 'automated') {
    await completeTask(task.id, { auto_completed: true });
  }

  return task;
}

async function assignTaskAutomatically(taskId: string) {
  const { data: users } = await supabase
    .from('users_profile')
    .select('id')
    .limit(1);

  if (users && users.length > 0) {
    await supabase
      .from('process_tasks')
      .update({
        assigned_to: users[0].id,
        assigned_at: new Date().toISOString(),
        status: 'assigned'
      })
      .eq('id', taskId);

    const user = (await supabase.auth.getUser()).data.user;

    await supabase
      .from('task_assignments')
      .insert({
        task_id: taskId,
        user_id: users[0].id,
        assigned_by: user?.id || users[0].id,
        assignment_type: 'primary',
        status: 'pending'
      });
  }
}

export async function completeTask(taskId: string, completionData: Record<string, any>) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data: task } = await supabase
    .from('process_tasks')
    .select('*, process_instances!inner(id)')
    .eq('id', taskId)
    .single();

  if (!task) throw new Error('Task not found');

  const startTime = task.started_at ? new Date(task.started_at) : new Date(task.created_at);
  const timeSpent = Math.round((Date.now() - startTime.getTime()) / 60000);

  await supabase
    .from('process_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_data: completionData,
      time_spent_minutes: timeSpent
    })
    .eq('id', taskId);

  await logExecution(
    task.instance_id,
    taskId,
    'task_completed',
    `Task "${task.node_label}" completed`,
    user.id,
    task.node_id,
    null,
    completionData
  );

  await advanceProcess(task.instance_id, task.node_id);
}

async function completeProcess(instanceId: string) {
  const user = (await supabase.auth.getUser()).data.user;

  const { data: instance } = await supabase
    .from('process_instances')
    .select('started_at')
    .eq('id', instanceId)
    .single();

  if (!instance) return;

  const duration = Math.round((Date.now() - new Date(instance.started_at).getTime()) / 60000);

  await supabase
    .from('process_instances')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
      actual_duration_minutes: duration
    })
    .eq('id', instanceId);

  await logExecution(
    instanceId,
    null,
    'process_completed',
    'Process completed successfully',
    user?.id,
    null,
    null
  );
}

export async function logExecution(
  instanceId: string,
  taskId: string | null,
  eventType: string,
  description: string,
  actorId?: string,
  fromNodeId?: string | null,
  toNodeId?: string | null,
  eventData?: Record<string, any>
) {
  await supabase
    .from('process_execution_log')
    .insert({
      instance_id: instanceId,
      task_id: taskId,
      event_type: eventType,
      event_description: description,
      actor_id: actorId,
      from_node_id: fromNodeId,
      to_node_id: toNodeId,
      event_data: eventData
    });
}

export async function getActiveProcessInstances(userId?: string) {
  let query = supabase
    .from('process_instances')
    .select(`
      *,
      processes!inner(name, category),
      users_profile!process_instances_started_by_fkey(full_name)
    `)
    .in('status', ['running', 'paused']);

  if (userId) {
    query = query.or(`started_by.eq.${userId},id.in.(select instance_id from process_tasks where assigned_to=${userId})`);
  }

  const { data, error } = await query.order('started_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMyTasks(userId: string, statusFilter?: string) {
  let query = supabase
    .from('process_tasks')
    .select(`
      *,
      process_instances!inner(
        instance_name,
        priority,
        processes!inner(name)
      )
    `)
    .eq('assigned_to', userId);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  } else {
    query = query.in('status', ['pending', 'assigned', 'in_progress']);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function startTask(taskId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('process_tasks')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', taskId);

  if (error) throw error;

  const { data: task } = await supabase
    .from('process_tasks')
    .select('instance_id, node_label')
    .eq('id', taskId)
    .single();

  if (task) {
    await logExecution(
      task.instance_id,
      taskId,
      'task_started',
      `Task "${task.node_label}" started`,
      user.id
    );
  }
}

export async function pauseProcessInstance(instanceId: string) {
  const user = (await supabase.auth.getUser()).data.user;

  await supabase
    .from('process_instances')
    .update({ status: 'paused' })
    .eq('id', instanceId);

  await logExecution(instanceId, null, 'process_paused', 'Process paused', user?.id);
}

export async function resumeProcessInstance(instanceId: string) {
  const user = (await supabase.auth.getUser()).data.user;

  await supabase
    .from('process_instances')
    .update({ status: 'running' })
    .eq('id', instanceId);

  await logExecution(instanceId, null, 'process_resumed', 'Process resumed', user?.id);
}

export async function cancelProcessInstance(instanceId: string, reason: string) {
  const user = (await supabase.auth.getUser()).data.user;

  await supabase
    .from('process_instances')
    .update({
      status: 'cancelled',
      error_message: reason,
      completed_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  await logExecution(instanceId, null, 'process_cancelled', `Process cancelled: ${reason}`, user?.id);
}
