import { supabase } from '../lib/supabase';

export interface SentimentAnalysis {
  score: number;
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  emotions: {
    anger?: number;
    frustration?: number;
    disappointment?: number;
    satisfaction?: number;
    urgency?: number;
  };
  keyPhrases: string[];
  urgencyScore: number;
}

export interface ComplaintRoutingSuggestion {
  suggestedAssignee: string | null;
  suggestedCategory: string;
  suggestedPriority: string;
  confidence: number;
  reasoning: string;
  sentiment: SentimentAnalysis;
  suggestedResponses: string[];
  similarComplaints: any[];
  autoActions: string[];
}

export const analyzeSentiment = (text: string): SentimentAnalysis => {
  const lowerText = text.toLowerCase();

  let score = 0;
  let urgencyScore = 0;
  const emotions = {
    anger: 0,
    frustration: 0,
    disappointment: 0,
    satisfaction: 0,
    urgency: 0,
  };
  const keyPhrases: string[] = [];

  const sentimentPatterns = {
    veryNegative: ['terrible', 'worst', 'horrible', 'disgusting', 'unacceptable', 'appalling', 'outrageous'],
    negative: ['bad', 'poor', 'disappointing', 'unsatisfied', 'unhappy', 'upset', 'frustrated'],
    anger: ['angry', 'furious', 'outraged', 'livid', 'infuriated', 'mad'],
    frustration: ['frustrated', 'annoyed', 'irritated', 'fed up', 'tired of'],
    disappointment: ['disappointed', 'let down', 'expected better', 'not what i wanted'],
    urgency: ['urgent', 'immediately', 'asap', 'emergency', 'critical', 'now', 'today'],
    positive: ['great', 'good', 'excellent', 'satisfied', 'happy', 'pleased', 'thank you'],
  };

  sentimentPatterns.veryNegative.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      score -= 0.3;
      keyPhrases.push(phrase);
      emotions.anger += 0.2;
    }
  });

  sentimentPatterns.negative.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      score -= 0.15;
      keyPhrases.push(phrase);
      emotions.disappointment += 0.15;
    }
  });

  sentimentPatterns.anger.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      score -= 0.2;
      emotions.anger += 0.3;
      keyPhrases.push(phrase);
    }
  });

  sentimentPatterns.frustration.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      score -= 0.1;
      emotions.frustration += 0.25;
      keyPhrases.push(phrase);
    }
  });

  sentimentPatterns.disappointment.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      score -= 0.1;
      emotions.disappointment += 0.2;
      keyPhrases.push(phrase);
    }
  });

  sentimentPatterns.urgency.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      urgencyScore += 0.25;
      emotions.urgency += 0.3;
      keyPhrases.push(phrase);
    }
  });

  sentimentPatterns.positive.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      score += 0.15;
      emotions.satisfaction += 0.2;
    }
  });

  score = Math.max(-1, Math.min(1, score));
  urgencyScore = Math.min(1, urgencyScore);

  let label: SentimentAnalysis['label'] = 'neutral';
  if (score <= -0.5) label = 'very_negative';
  else if (score < -0.1) label = 'negative';
  else if (score > 0.3) label = 'positive';
  else if (score > 0.6) label = 'very_positive';

  Object.keys(emotions).forEach(key => {
    emotions[key as keyof typeof emotions] = Math.min(1, emotions[key as keyof typeof emotions]);
  });

  return {
    score: parseFloat(score.toFixed(3)),
    label,
    emotions,
    keyPhrases,
    urgencyScore: parseFloat(urgencyScore.toFixed(3)),
  };
};

export const categorizeComplaint = async (subject: string, description: string): Promise<{
  category: string;
  priority: string;
  confidence: number;
  matchedRules: string[];
}> => {
  const combinedText = `${subject} ${description}`.toLowerCase();
  let category = 'general';
  let priority = 'medium';
  let confidence = 0.5;
  const matchedRules: string[] = [];

  const { data: rules } = await supabase
    .from('ai_routing_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority_order', { ascending: false });

  if (rules) {
    for (const rule of rules) {
      if (rule.rule_type === 'keyword' && rule.conditions.keywords) {
        const keywords = rule.conditions.keywords as string[];
        const matchCount = keywords.filter((kw: string) => combinedText.includes(kw.toLowerCase())).length;

        if (matchCount > 0) {
          matchedRules.push(rule.rule_name);
          confidence += matchCount * 0.1;

          if (rule.target_category) category = rule.target_category;
          if (rule.target_priority) priority = rule.target_priority;

          if (matchCount >= 2) break;
        }
      }
    }
  }

  confidence = Math.min(0.95, confidence);

  return {
    category,
    priority,
    confidence: parseFloat(confidence.toFixed(3)),
    matchedRules,
  };
};

export const findBestAgent = async (
  category: string,
  priority: string,
  sentiment: SentimentAnalysis
): Promise<{ agentId: string | null; reason: string; confidence: number }> => {
  try {
    const needsSeniorAgent = sentiment.label === 'very_negative' || priority === 'critical';

    const { data: availableAgents } = await supabase
      .from('users_profile')
      .select('user_id, full_name, role')
      .in('role', needsSeniorAgent ? ['manager', 'senior_agent'] : ['agent', 'senior_agent', 'manager'])
      .limit(10);

    if (!availableAgents || availableAgents.length === 0) {
      return {
        agentId: null,
        reason: 'No available agents found',
        confidence: 0,
      };
    }

    const selectedAgent = availableAgents[0];
    const reason = needsSeniorAgent
      ? `Assigned to senior agent due to ${sentiment.label} sentiment and ${priority} priority`
      : `Assigned based on availability and category: ${category}`;

    return {
      agentId: selectedAgent.user_id,
      reason,
      confidence: 0.8,
    };
  } catch (error) {
    console.error('Error finding best agent:', error);
    return {
      agentId: null,
      reason: 'Error during agent assignment',
      confidence: 0,
    };
  }
};

export const getSuggestedResponses = async (
  category: string,
  sentiment: SentimentAnalysis
): Promise<string[]> => {
  try {
    const { data: responses } = await supabase
      .from('ai_suggested_responses')
      .select('suggested_response')
      .eq('complaint_type', category)
      .eq('is_active', true)
      .order('success_rate', { ascending: false })
      .limit(3);

    if (responses && responses.length > 0) {
      return responses.map(r => r.suggested_response);
    }

    const { data: genericResponses } = await supabase
      .from('ai_suggested_responses')
      .select('suggested_response')
      .eq('complaint_type', 'general')
      .eq('is_active', true)
      .limit(2);

    return genericResponses?.map(r => r.suggested_response) || [];
  } catch (error) {
    console.error('Error getting suggested responses:', error);
    return [];
  }
};

export const findSimilarComplaints = async (
  subject: string,
  category: string,
  limit: number = 5
): Promise<any[]> => {
  try {
    const { data: similarComplaints } = await supabase
      .from('complaints')
      .select('id, complaint_number, subject, status, severity')
      .eq('complaint_type', category)
      .neq('status', 'closed')
      .limit(limit);

    return similarComplaints || [];
  } catch (error) {
    console.error('Error finding similar complaints:', error);
    return [];
  }
};

export const analyzeAndRouteComplaint = async (
  subject: string,
  description: string,
  complaintType: string
): Promise<ComplaintRoutingSuggestion> => {
  const startTime = Date.now();

  try {
    const sentiment = analyzeSentiment(`${subject} ${description}`);

    const categorization = await categorizeComplaint(subject, description);

    let priority = categorization.priority;
    if (sentiment.label === 'very_negative' && priority === 'medium') {
      priority = 'high';
    }
    if (sentiment.urgencyScore > 0.7 && priority !== 'critical') {
      priority = priority === 'low' ? 'medium' : 'high';
    }

    const agentAssignment = await findBestAgent(categorization.category, priority, sentiment);

    const suggestedResponses = await getSuggestedResponses(categorization.category, sentiment);

    const similarComplaints = await findSimilarComplaints(subject, categorization.category);

    const autoActions: string[] = [];
    if (priority === 'critical') autoActions.push('Notify management');
    if (sentiment.emotions.anger > 0.7) autoActions.push('Flag for immediate review');
    if (sentiment.urgencyScore > 0.8) autoActions.push('Escalate to priority queue');
    if (similarComplaints.length > 3) autoActions.push('Check for systemic issue');

    const routingTime = Date.now() - startTime;

    let reasoning = `Sentiment: ${sentiment.label} (${sentiment.score.toFixed(2)}). `;
    reasoning += `Category: ${categorization.category}. `;
    reasoning += `Priority: ${priority}. `;
    if (categorization.matchedRules.length > 0) {
      reasoning += `Matched rules: ${categorization.matchedRules.join(', ')}. `;
    }
    reasoning += agentAssignment.reason;

    return {
      suggestedAssignee: agentAssignment.agentId,
      suggestedCategory: categorization.category,
      suggestedPriority: priority,
      confidence: (categorization.confidence + agentAssignment.confidence) / 2,
      reasoning,
      sentiment,
      suggestedResponses,
      similarComplaints,
      autoActions,
    };
  } catch (error) {
    console.error('Error in complaint routing:', error);

    return {
      suggestedAssignee: null,
      suggestedCategory: complaintType || 'general',
      suggestedPriority: 'medium',
      confidence: 0.3,
      reasoning: 'Error during AI analysis, using defaults',
      sentiment: {
        score: 0,
        label: 'neutral',
        emotions: {},
        keyPhrases: [],
        urgencyScore: 0,
      },
      suggestedResponses: [],
      similarComplaints: [],
      autoActions: [],
    };
  }
};

export const logRoutingDecision = async (
  complaintId: string,
  suggestion: ComplaintRoutingSuggestion,
  actualAssignee: string | null,
  wasOverridden: boolean,
  overrideReason?: string
) => {
  try {
    await supabase.from('ai_routing_history').insert({
      entity_type: 'complaint',
      entity_id: complaintId,
      suggested_category: suggestion.suggestedCategory,
      suggested_priority: suggestion.suggestedPriority,
      suggested_assignee: suggestion.suggestedAssignee,
      actual_assignee: actualAssignee,
      confidence_score: suggestion.confidence,
      was_overridden: wasOverridden,
      override_reason: overrideReason,
    });

    await supabase.from('ai_sentiment_analysis').insert({
      entity_type: 'complaint',
      entity_id: complaintId,
      sentiment_score: suggestion.sentiment.score,
      sentiment_label: suggestion.sentiment.label,
      emotions: suggestion.sentiment.emotions,
      key_phrases: suggestion.sentiment.keyPhrases,
      urgency_score: suggestion.sentiment.urgencyScore,
    });

    if (suggestion.suggestedAssignee || actualAssignee) {
      await supabase.from('complaint_routing_assignments').insert({
        complaint_id: complaintId,
        ai_suggested_assignee: suggestion.suggestedAssignee,
        ai_confidence: suggestion.confidence,
        ai_reasoning: suggestion.reasoning,
        actual_assignee: actualAssignee || suggestion.suggestedAssignee,
        was_manually_assigned: wasOverridden,
      });
    }
  } catch (error) {
    console.error('Error logging routing decision:', error);
  }
};
