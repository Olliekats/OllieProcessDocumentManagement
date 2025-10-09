import { supabase } from '../lib/supabase';

export interface ProcessRecommendation {
  id: string;
  process_ref_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  expected_impact: any;
  estimated_savings: any;
  confidence_score: number;
  priority: string;
  status: string;
  generated_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: string;
  years_experience: number;
}

export interface SLABreachPrediction {
  id: string;
  task_id: string;
  breach_probability: number;
  estimated_delay_minutes: number;
  recommended_actions: any;
  urgency_level: string;
  prediction_timestamp: string;
}

export async function getProcessRecommendations(status: string = 'suggested'): Promise<ProcessRecommendation[]> {
  let query = supabase
    .from('process_recommendations')
    .select('*')
    .order('priority', { ascending: true })
    .order('generated_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateRecommendationStatus(id: string, status: string, reviewNotes?: string) {
  const user = (await supabase.auth.getUser()).data.user;

  const { error } = await supabase
    .from('process_recommendations')
    .update({
      status,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function generateProcessRecommendation(
  processId: string,
  type: string,
  title: string,
  description: string,
  expectedImpact: any,
  priority: string = 'medium'
) {
  const { error } = await supabase
    .from('process_recommendations')
    .insert({
      process_ref_id: processId,
      recommendation_type: type,
      title,
      description,
      expected_impact: expectedImpact,
      confidence_score: 85.0,
      priority
    });

  if (error) throw error;
}

export async function getUserSkills(userId?: string): Promise<UserSkill[]> {
  let query = supabase
    .from('user_skills_matrix')
    .select(`
      *,
      users_profile!user_skills_matrix_user_id_fkey(full_name)
    `)
    .order('skill_category');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function addUserSkill(
  userId: string,
  skillName: string,
  category: string,
  proficiency: string,
  experience: number
) {
  const { error } = await supabase
    .from('user_skills_matrix')
    .insert({
      user_id: userId,
      skill_name: skillName,
      skill_category: category,
      proficiency_level: proficiency,
      years_experience: experience
    });

  if (error) throw error;
}

export async function predictTaskAssignment(taskId: string, nodeType: string) {
  const { data: users } = await supabase
    .from('user_skills_matrix')
    .select(`
      user_id,
      skill_name,
      proficiency_level,
      users_profile!user_skills_matrix_user_id_fkey(full_name)
    `);

  if (!users || users.length === 0) return null;

  const { data: workload } = await supabase
    .from('process_tasks')
    .select('assigned_to')
    .in('status', ['pending', 'assigned', 'in_progress']);

  const workloadMap: Record<string, number> = {};
  workload?.forEach(task => {
    if (task.assigned_to) {
      workloadMap[task.assigned_to] = (workloadMap[task.assigned_to] || 0) + 1;
    }
  });

  const scores = users.map(user => {
    const skillScore = user.proficiency_level === 'expert' ? 100
      : user.proficiency_level === 'advanced' ? 80
      : user.proficiency_level === 'intermediate' ? 60
      : 40;

    const workloadScore = Math.max(0, 100 - (workloadMap[user.user_id] || 0) * 10);
    const overallScore = (skillScore * 0.6) + (workloadScore * 0.4);

    return {
      user_id: user.user_id,
      score: overallScore,
      skills: skillScore,
      workload: workloadScore
    };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0];
}

export async function getSLABreachPredictions(urgencyLevel?: string): Promise<SLABreachPrediction[]> {
  let query = supabase
    .from('sla_breach_predictions')
    .select(`
      *,
      process_tasks!sla_breach_predictions_task_id_fkey(
        node_label,
        status,
        assigned_to,
        process_instances!inner(instance_name)
      )
    `)
    .order('breach_probability', { ascending: false })
    .order('prediction_timestamp', { ascending: false });

  if (urgencyLevel) {
    query = query.eq('urgency_level', urgencyLevel);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSLABreachPrediction(
  taskId: string,
  breachProbability: number,
  estimatedDelay: number,
  recommendations: any
) {
  const urgency = breachProbability > 75 ? 'critical'
    : breachProbability > 50 ? 'high'
    : breachProbability > 25 ? 'medium'
    : 'low';

  const { error } = await supabase
    .from('sla_breach_predictions')
    .insert({
      task_id: taskId,
      breach_probability: breachProbability,
      estimated_delay_minutes: estimatedDelay,
      recommended_actions: recommendations,
      urgency_level: urgency
    });

  if (error) throw error;
}

export async function analyzeProcessForRecommendations(processId: string) {
  const { data: instances } = await supabase
    .from('process_instances')
    .select('*')
    .eq('process_id', processId)
    .eq('status', 'completed');

  if (!instances || instances.length < 5) return;

  const avgDuration = instances.reduce((sum, i) => sum + (i.actual_duration_minutes || 0), 0) / instances.length;

  const longRunning = instances.filter(i => (i.actual_duration_minutes || 0) > avgDuration * 1.5);

  if (longRunning.length > instances.length * 0.3) {
    await generateProcessRecommendation(
      processId,
      'optimization',
      'High variance in process completion times',
      `Analysis shows ${longRunning.length} out of ${instances.length} instances took significantly longer than average. Consider reviewing task assignments and identifying bottlenecks.`,
      {
        time_savings: `${Math.round((avgDuration * 0.2))} minutes per instance`,
        instances_affected: longRunning.length
      },
      'high'
    );
  }

  const { data: bottlenecks } = await supabase
    .from('process_bottlenecks')
    .select('*')
    .eq('process_id', processId)
    .eq('status', 'active');

  if (bottlenecks && bottlenecks.length > 0) {
    await generateProcessRecommendation(
      processId,
      'bottleneck_resolution',
      `${bottlenecks.length} active bottlenecks detected`,
      'Automated analysis has identified performance bottlenecks. Immediate action recommended to improve throughput.',
      {
        bottlenecks: bottlenecks.length,
        potential_improvement: '30-40%'
      },
      'critical'
    );
  }
}

export async function recordTaskAssignment(
  taskId: string,
  userId: string,
  assignedBy: string,
  score: number,
  workload: number,
  skillsMatch: number
) {
  const { error } = await supabase
    .from('task_assignment_history')
    .insert({
      task_id: taskId,
      user_id: userId,
      assigned_by: assignedBy,
      assignment_score: score,
      workload_at_assignment: workload,
      skills_match_score: skillsMatch
    });

  if (error) throw error;
}

export async function createAutoEscalation(
  taskId: string,
  instanceId: string,
  reason: string,
  severity: string,
  fromUser?: string,
  toUser?: string
) {
  const { error } = await supabase
    .from('auto_escalations')
    .insert({
      task_id: taskId,
      instance_id: instanceId,
      escalation_reason: reason,
      severity,
      triggered_by: 'system',
      escalated_from: fromUser,
      escalated_to: toUser
    });

  if (error) throw error;
}

export async function getAutoEscalations(severity?: string) {
  let query = supabase
    .from('auto_escalations')
    .select('*')
    .order('escalation_timestamp', { ascending: false });

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
