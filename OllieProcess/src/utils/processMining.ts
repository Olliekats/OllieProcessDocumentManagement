import { supabase } from '../lib/supabase';

export interface ProcessMetrics {
  processId: string;
  processName: string;
  totalInstances: number;
  completedInstances: number;
  avgCompletionMinutes: number;
  successRate: number;
  onTimeRate: number;
  bottleneckCount: number;
}

export interface NodeMetrics {
  nodeId: string;
  nodeLabel: string;
  avgProcessingMinutes: number;
  totalExecutions: number;
  isBottleneck: boolean;
  bottleneckSeverity: string | null;
  throughputRate: number;
}

export interface Bottleneck {
  id: string;
  nodeLabel: string;
  severity: string;
  avgDelayMinutes: number;
  impactScore: number;
  affectedInstancesCount: number;
  rootCauses: any;
  recommendedActions: any;
  detectedAt: string;
}

export interface ProcessInsight {
  id: string;
  insightType: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  impactAssessment: string;
  potentialSavings: any;
  recommendedActions: any;
  confidenceScore: number;
}

export async function calculateDailyMetrics(processId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { error } = await supabase.rpc('calculate_process_metrics', {
    p_process_id: processId,
    p_period_start: today.toISOString(),
    p_period_end: tomorrow.toISOString()
  });

  if (error) throw error;
}

export async function detectProcessBottlenecks(processId: string) {
  const { error } = await supabase.rpc('detect_bottlenecks', {
    p_process_id: processId
  });

  if (error) throw error;
}

export async function getProcessMetrics(period: string = 'daily', limit: number = 10): Promise<ProcessMetrics[]> {
  const { data, error } = await supabase
    .from('process_performance_metrics')
    .select(`
      *,
      processes!inner(name)
    `)
    .eq('time_period', period)
    .order('period_start', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(m => ({
    processId: m.process_id,
    processName: m.processes.name,
    totalInstances: m.total_instances,
    completedInstances: m.completed_instances,
    avgCompletionMinutes: m.avg_completion_minutes,
    successRate: m.success_rate,
    onTimeRate: m.on_time_rate,
    bottleneckCount: m.bottleneck_count
  }));
}

export async function getNodeMetrics(processId: string, period: string = 'daily'): Promise<NodeMetrics[]> {
  const { data, error } = await supabase
    .from('node_performance_metrics')
    .select('*')
    .eq('process_id', processId)
    .eq('time_period', period)
    .order('avg_processing_minutes', { ascending: false });

  if (error) throw error;

  return (data || []).map(m => ({
    nodeId: m.node_id,
    nodeLabel: m.node_label,
    avgProcessingMinutes: m.avg_processing_minutes,
    totalExecutions: m.total_executions,
    isBottleneck: m.is_bottleneck,
    bottleneckSeverity: m.bottleneck_severity,
    throughputRate: m.throughput_rate
  }));
}

export async function getActiveBottlenecks(): Promise<Bottleneck[]> {
  const { data, error } = await supabase
    .from('process_bottlenecks')
    .select('*')
    .eq('status', 'active')
    .order('impact_score', { ascending: false });

  if (error) throw error;

  return (data || []).map(b => ({
    id: b.id,
    nodeLabel: b.node_label,
    severity: b.severity,
    avgDelayMinutes: b.avg_delay_minutes,
    impactScore: b.impact_score,
    affectedInstancesCount: b.affected_instances_count,
    rootCauses: b.root_causes,
    recommendedActions: b.recommended_actions,
    detectedAt: b.detected_at
  }));
}

export async function resolveBottleneck(bottleneckId: string, resolutionNotes: string) {
  const { error } = await supabase
    .from('process_bottlenecks')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes
    })
    .eq('id', bottleneckId);

  if (error) throw error;
}

export async function getProcessInsights(status: string = 'new'): Promise<ProcessInsight[]> {
  let query = supabase
    .from('process_insights')
    .select('*')
    .order('priority', { ascending: true })
    .order('generated_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(i => ({
    id: i.id,
    insightType: i.insight_type,
    category: i.category,
    priority: i.priority,
    title: i.title,
    description: i.description,
    impactAssessment: i.impact_assessment,
    potentialSavings: i.potential_savings,
    recommendedActions: i.recommended_actions,
    confidenceScore: i.confidence_score
  }));
}

export async function analyzeProcessPath(instanceId: string) {
  const { data: tasks } = await supabase
    .from('process_tasks')
    .select('node_id, node_label, status, started_at, completed_at, time_spent_minutes')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: true });

  if (!tasks) return null;

  const { data: logs } = await supabase
    .from('process_execution_log')
    .select('*')
    .eq('instance_id', instanceId)
    .order('timestamp', { ascending: true });

  return {
    tasks,
    logs,
    totalSteps: tasks.length,
    completedSteps: tasks.filter(t => t.status === 'completed').length,
    totalTime: tasks.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0),
    path: tasks.map(t => t.node_id)
  };
}

export async function calculateNodePerformance(processId: string) {
  const { data: tasks } = await supabase
    .from('process_tasks')
    .select(`
      node_id,
      node_label,
      status,
      time_spent_minutes,
      process_instances!inner(process_id)
    `)
    .eq('process_instances.process_id', processId)
    .eq('status', 'completed');

  if (!tasks) return;

  const nodeStats = tasks.reduce((acc: any, task: any) => {
    const key = task.node_id;
    if (!acc[key]) {
      acc[key] = {
        nodeId: task.node_id,
        nodeLabel: task.node_label,
        times: [],
        count: 0
      };
    }
    if (task.time_spent_minutes) {
      acc[key].times.push(task.time_spent_minutes);
      acc[key].count++;
    }
    return acc;
  }, {});

  const period = new Date();
  period.setHours(0, 0, 0, 0);
  const periodEnd = new Date(period);
  periodEnd.setDate(periodEnd.getDate() + 1);

  for (const nodeId in nodeStats) {
    const stats = nodeStats[nodeId];
    const times = stats.times.sort((a: number, b: number) => a - b);
    const avg = times.reduce((sum: number, t: number) => sum + t, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];

    await supabase
      .from('node_performance_metrics')
      .upsert({
        process_id: processId,
        node_id: stats.nodeId,
        node_label: stats.nodeLabel,
        time_period: 'daily',
        period_start: period.toISOString(),
        period_end: periodEnd.toISOString(),
        total_executions: stats.count,
        completed_executions: stats.count,
        avg_processing_minutes: avg,
        median_processing_minutes: median,
        min_processing_minutes: Math.min(...times),
        max_processing_minutes: Math.max(...times),
        throughput_rate: stats.count / 24
      });
  }
}

export async function detectDeviations(instanceId: string, expectedPath: string[]) {
  const { data: tasks } = await supabase
    .from('process_tasks')
    .select('node_id, sequence_order')
    .eq('instance_id', instanceId)
    .order('sequence_order', { ascending: true });

  if (!tasks) return;

  const actualPath = tasks.map(t => t.node_id);

  if (JSON.stringify(actualPath) !== JSON.stringify(expectedPath)) {
    await supabase
      .from('process_deviations')
      .insert({
        instance_id: instanceId,
        deviation_type: 'path_deviation',
        severity: 'medium',
        expected_path: expectedPath.join(' -> '),
        actual_path: actualPath.join(' -> '),
        reason: 'Process followed unexpected path'
      });
  }
}

export async function generateProcessInsight(
  processId: string,
  insightType: string,
  title: string,
  description: string,
  priority: string = 'medium',
  recommendations: any = null
) {
  const { error } = await supabase
    .from('process_insights')
    .insert({
      process_id: processId,
      insight_type: insightType,
      category: 'optimization',
      priority,
      title,
      description,
      recommended_actions: recommendations,
      confidence_score: 85.0
    });

  if (error) throw error;
}

export async function getCycleTimeAnalysis(processId: string) {
  const { data } = await supabase
    .from('process_instances')
    .select('actual_duration_minutes, started_at')
    .eq('process_id', processId)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(100);

  if (!data || data.length === 0) return null;

  const times = data.map(i => i.actual_duration_minutes).filter(t => t != null);
  const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
  const sorted = times.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  return {
    average: avg,
    median,
    p95,
    min: Math.min(...times),
    max: Math.max(...times),
    sampleSize: times.length
  };
}

export async function getResourceUtilization(userId?: string) {
  let query = supabase
    .from('resource_utilization')
    .select(`
      *,
      users_profile!resource_utilization_user_id_fkey(full_name)
    `)
    .order('period_start', { ascending: false })
    .limit(30);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateResourceUtilization(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: tasks } = await supabase
    .from('process_tasks')
    .select('*')
    .eq('assigned_to', userId)
    .gte('assigned_at', today.toISOString())
    .lt('assigned_at', tomorrow.toISOString());

  if (!tasks) return;

  const completed = tasks.filter(t => t.status === 'completed');
  const avgTime = completed.length > 0
    ? completed.reduce((sum, t) => sum + (t.time_spent_minutes || 0), 0) / completed.length
    : 0;

  await supabase
    .from('resource_utilization')
    .upsert({
      user_id: userId,
      time_period: 'daily',
      period_start: today.toISOString(),
      period_end: tomorrow.toISOString(),
      total_tasks_assigned: tasks.length,
      total_tasks_completed: completed.length,
      avg_task_completion_minutes: avgTime,
      utilization_rate: tasks.length > 0 ? (completed.length / tasks.length * 100) : 0
    });
}
