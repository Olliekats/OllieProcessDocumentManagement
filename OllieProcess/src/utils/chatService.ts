import { supabase } from '../lib/supabase';

export interface ChatSession {
  id: string;
  session_number: string;
  customer_name: string;
  customer_email?: string;
  customer_id?: string;
  status: 'waiting' | 'active' | 'closed' | 'transferred';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channel: 'web' | 'mobile' | 'whatsapp' | 'social';
  subject?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  rating?: number;
  assigned_agent_id?: string;
  department?: string;
  tags?: string[];
  started_at: string;
  first_response_at?: string;
  closed_at?: string;
  wait_time_seconds?: number;
  duration_seconds?: number;
  message_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'customer' | 'agent' | 'system' | 'bot';
  sender_id?: string;
  sender_name: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  content: string;
  is_internal: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category?: string;
  department?: string;
  language: string;
  is_active: boolean;
  usage_count: number;
}

export async function createChatSession(data: {
  customer_name: string;
  customer_email?: string;
  channel?: string;
  subject?: string;
  department?: string;
}): Promise<{ data: ChatSession | null; error: any }> {
  const sessionNumber = `CHT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  return await supabase
    .from('chat_sessions')
    .insert({
      session_number: sessionNumber,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      channel: data.channel || 'web',
      subject: data.subject,
      department: data.department,
      status: 'waiting',
    })
    .select()
    .single();
}

export async function getChatSessions(filters?: {
  status?: string;
  assigned_agent_id?: string;
}): Promise<{ data: ChatSession[] | null; error: any }> {
  let query = supabase
    .from('chat_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.assigned_agent_id) {
    query = query.eq('assigned_agent_id', filters.assigned_agent_id);
  }

  return await query;
}

export async function updateChatSession(
  sessionId: string,
  updates: Partial<ChatSession>
): Promise<{ data: ChatSession | null; error: any }> {
  return await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
}

export async function assignChatToAgent(
  sessionId: string,
  agentId: string
): Promise<{ error: any }> {
  const { error: updateError } = await supabase
    .from('chat_sessions')
    .update({
      assigned_agent_id: agentId,
      status: 'active',
    })
    .eq('id', sessionId);

  if (updateError) return { error: updateError };

  const { error: assignError } = await supabase
    .from('chat_assignments')
    .insert({
      session_id: sessionId,
      agent_id: agentId,
      accepted_at: new Date().toISOString(),
    });

  return { error: assignError };
}

export async function sendChatMessage(data: {
  session_id: string;
  sender_type: 'customer' | 'agent' | 'system' | 'bot';
  sender_id?: string;
  sender_name: string;
  content: string;
  is_internal?: boolean;
}): Promise<{ data: ChatMessage | null; error: any }> {
  return await supabase
    .from('chat_messages')
    .insert({
      session_id: data.session_id,
      sender_type: data.sender_type,
      sender_id: data.sender_id,
      sender_name: data.sender_name,
      content: data.content,
      message_type: 'text',
      is_internal: data.is_internal || false,
    })
    .select()
    .single();
}

export async function getChatMessages(
  sessionId: string
): Promise<{ data: ChatMessage[] | null; error: any }> {
  return await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
}

export async function closeChatSession(
  sessionId: string,
  rating?: number
): Promise<{ error: any }> {
  const updates: any = {
    status: 'closed',
    closed_at: new Date().toISOString(),
  };

  if (rating) {
    updates.rating = rating;
  }

  const { error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId);

  return { error };
}

export async function getCannedResponses(
  department?: string
): Promise<{ data: CannedResponse[] | null; error: any }> {
  let query = supabase
    .from('chat_canned_responses')
    .select('*')
    .eq('is_active', true)
    .order('title');

  if (department) {
    query = query.or(`department.eq.${department},department.is.null`);
  }

  return await query;
}

export async function subscribeToChatMessages(
  sessionId: string,
  callback: (message: ChatMessage) => void
) {
  return supabase
    .channel(`chat_messages:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();
}

export async function subscribeToChatSessions(
  callback: (session: ChatSession) => void
) {
  return supabase
    .channel('chat_sessions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_sessions',
      },
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          callback(payload.new as ChatSession);
        }
      }
    )
    .subscribe();
}

export async function updateTypingStatus(
  sessionId: string,
  userId: string,
  isTyping: boolean
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('chat_participants')
    .update({
      is_typing: isTyping,
      last_seen_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  return { error };
}

export async function addParticipant(
  sessionId: string,
  userId: string,
  role: 'customer' | 'agent' | 'supervisor' | 'observer'
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('chat_participants')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
    });

  return { error };
}
