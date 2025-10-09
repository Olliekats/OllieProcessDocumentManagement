import { supabase } from '../lib/supabase';

export interface RoutingSuggestion {
  suggestedAgent: string | null;
  suggestedCategory: string;
  suggestedPriority: string;
  confidence: number;
  reasoning: string;
}

export const analyzeAndRouteTicket = async (
  subject: string,
  description: string
): Promise<RoutingSuggestion> => {
  try {
    const combinedText = `${subject} ${description}`.toLowerCase();

    let category = 'general';
    let priority = 'medium';
    let reasoning = '';

    if (combinedText.includes('urgent') || combinedText.includes('critical') || combinedText.includes('emergency')) {
      priority = 'critical';
      reasoning = 'Urgent keywords detected. ';
    } else if (combinedText.includes('asap') || combinedText.includes('important')) {
      priority = 'high';
      reasoning = 'High priority keywords detected. ';
    }

    if (combinedText.includes('billing') || combinedText.includes('invoice') || combinedText.includes('payment')) {
      category = 'billing';
      reasoning += 'Billing-related content identified.';
    } else if (combinedText.includes('technical') || combinedText.includes('error') || combinedText.includes('bug')) {
      category = 'technical';
      reasoning += 'Technical issue identified.';
    } else if (combinedText.includes('password') || combinedText.includes('login') || combinedText.includes('access')) {
      category = 'account';
      reasoning += 'Account access issue identified.';
    } else if (combinedText.includes('complaint') || combinedText.includes('unhappy') || combinedText.includes('disappointed')) {
      category = 'complaint';
      priority = priority === 'medium' ? 'high' : priority;
      reasoning += 'Complaint detected - escalating priority.';
    }

    const { data: agents } = await supabase
      .from('agent_skills')
      .select('user_id, skill_name, proficiency_level')
      .eq('skill_category', category)
      .order('proficiency_level', { ascending: false })
      .limit(5);

    let suggestedAgent: string | null = null;
    if (agents && agents.length > 0) {
      const { data: availability } = await supabase
        .from('attendance')
        .select('user_id')
        .eq('date', new Date().toISOString().split('T')[0])
        .eq('status', 'present')
        .in('user_id', agents.map(a => a.user_id));

      const availableAgents = agents.filter(a =>
        availability?.some(av => av.user_id === a.user_id)
      );

      if (availableAgents.length > 0) {
        suggestedAgent = availableAgents[0].user_id;
        reasoning += ` Suggested agent has ${availableAgents[0].proficiency_level}/5 proficiency in ${category}.`;
      }
    }

    const confidence = calculateConfidence(combinedText, category, priority);

    await supabase.from('ticket_categorization_history').insert({
      suggested_category: category,
      suggested_priority: priority,
      suggested_agent_id: suggestedAgent,
      confidence_score: confidence,
      categorization_method: 'rule_based',
      features_used: {
        keywords_matched: extractKeywords(combinedText),
        text_length: combinedText.length,
      },
    });

    return {
      suggestedAgent,
      suggestedCategory: category,
      suggestedPriority: priority,
      confidence,
      reasoning: reasoning || 'No specific patterns detected, using default routing.',
    };
  } catch (error) {
    console.error('Error in AI routing:', error);
    return {
      suggestedAgent: null,
      suggestedCategory: 'general',
      suggestedPriority: 'medium',
      confidence: 0.5,
      reasoning: 'Error occurred during analysis, using default routing.',
    };
  }
};

const calculateConfidence = (text: string, category: string, priority: string): number => {
  let confidence = 0.5;

  const categoryKeywords = {
    billing: ['billing', 'invoice', 'payment', 'charge', 'refund'],
    technical: ['error', 'bug', 'broken', 'not working', 'issue'],
    account: ['password', 'login', 'access', 'locked'],
    complaint: ['complaint', 'unhappy', 'disappointed', 'poor', 'terrible'],
  };

  const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || [];
  const matchCount = keywords.filter(kw => text.includes(kw)).length;

  confidence += (matchCount * 0.1);
  confidence = Math.min(confidence, 0.95);

  return parseFloat(confidence.toFixed(4));
};

const extractKeywords = (text: string): string[] => {
  const allKeywords = [
    'urgent', 'critical', 'billing', 'payment', 'technical', 'error',
    'bug', 'password', 'login', 'complaint', 'asap', 'important'
  ];

  return allKeywords.filter(kw => text.includes(kw));
};

export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    return null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

export const findSimilarTickets = async (ticketId: string, limit: number = 5) => {
  try {
    const { data: similarTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, subject, status, category')
      .neq('id', ticketId)
      .limit(limit);

    return similarTickets || [];
  } catch (error) {
    console.error('Error finding similar tickets:', error);
    return [];
  }
};
