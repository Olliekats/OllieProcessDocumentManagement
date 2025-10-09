import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type IntegrationEventType =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.assigned'
  | 'ticket.resolved'
  | 'complaint.created'
  | 'complaint.updated'
  | 'complaint.escalated'
  | 'complaint.resolved'
  | 'agent.performance_updated'
  | 'agent.status_changed'
  | 'client.risk_changed'
  | 'csat.received'
  | 'kb.article_created'
  | 'process.completed'
  | 'approval.requested'
  | 'approval.completed'
  | 'chat.started'
  | 'chat.ended';

export type IntegrationPriority = 'high' | 'normal' | 'low';

interface IntegrationEvent {
  event_type: IntegrationEventType;
  source_module: string;
  target_modules: string[];
  event_data: Record<string, any>;
  priority?: IntegrationPriority;
}

interface EventHandler {
  eventType: IntegrationEventType;
  handler: (data: any) => void | Promise<void>;
}

class IntegrationService {
  private subscriptions: RealtimeChannel[] = [];
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  async publishEvent(event: IntegrationEvent): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('publish_integration_event', {
        p_event_type: event.event_type,
        p_source_module: event.source_module,
        p_target_modules: event.target_modules,
        p_event_data: event.event_data,
        p_priority: event.priority || 'normal',
      });

      if (error) {
        console.error('Error publishing integration event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }

  subscribeToEvents(
    moduleName: string,
    eventTypes: IntegrationEventType[],
    handler: (event: any) => void | Promise<void>
  ): () => void {
    const channel = supabase
      .channel(`integration-${moduleName}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_events',
          filter: `target_modules.cs.{${moduleName}}`,
        },
        async (payload) => {
          const event = payload.new;
          if (eventTypes.includes(event.event_type as IntegrationEventType)) {
            await handler(event);

            await supabase
              .from('integration_events')
              .update({
                status: 'processed',
                processed_at: new Date().toISOString()
              })
              .eq('id', event.id);
          }
        }
      )
      .subscribe();

    this.subscriptions.push(channel);

    return () => {
      channel.unsubscribe();
      const index = this.subscriptions.indexOf(channel);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  subscribeToTable<T = any>(
    tableName: string,
    callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; record: T }) => void
  ): () => void {
    const channel = supabase
      .channel(`table-${tableName}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          callback({ eventType, record: payload.new as T || payload.old as T });
        }
      )
      .subscribe();

    this.subscriptions.push(channel);

    return () => {
      channel.unsubscribe();
      const index = this.subscriptions.indexOf(channel);
      if (index > -1) {
        this.subscriptions.splice(index, 1);
      }
    };
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach((channel) => channel.unsubscribe());
    this.subscriptions = [];
  }

  async notifyTicketCreated(ticket: any): Promise<void> {
    await this.publishEvent({
      event_type: 'ticket.created',
      source_module: 'contact_center',
      target_modules: ['dashboard', 'realtime_ops', 'workforce_mgmt', 'analytics'],
      event_data: { ticket_id: ticket.id, priority: ticket.priority, category: ticket.category },
      priority: ticket.priority === 'urgent' ? 'high' : 'normal',
    });
  }

  async notifyTicketAssigned(ticketId: string, agentId: string): Promise<void> {
    await this.publishEvent({
      event_type: 'ticket.assigned',
      source_module: 'contact_center',
      target_modules: ['dashboard', 'realtime_ops', 'performance_mgmt', 'agent_dashboard'],
      event_data: { ticket_id: ticketId, agent_id: agentId },
    });
  }

  async notifyTicketResolved(ticketId: string, resolutionData: any): Promise<void> {
    await this.publishEvent({
      event_type: 'ticket.resolved',
      source_module: 'contact_center',
      target_modules: ['dashboard', 'knowledge_base', 'analytics', 'client_mgmt'],
      event_data: { ticket_id: ticketId, ...resolutionData },
    });
  }

  async notifyComplaintCreated(complaint: any): Promise<void> {
    await this.publishEvent({
      event_type: 'complaint.created',
      source_module: 'complaints',
      target_modules: ['dashboard', 'realtime_ops', 'client_mgmt', 'quality_assurance'],
      event_data: { complaint_id: complaint.id, severity: complaint.severity, client_id: complaint.client_id },
      priority: 'high',
    });
  }

  async notifyComplaintEscalated(complaintId: string, escalationData: any): Promise<void> {
    await this.publishEvent({
      event_type: 'complaint.escalated',
      source_module: 'complaints',
      target_modules: ['dashboard', 'management', 'client_mgmt'],
      event_data: { complaint_id: complaintId, ...escalationData },
      priority: 'high',
    });
  }

  async notifyCSATReceived(csatData: any): Promise<void> {
    await this.publishEvent({
      event_type: 'csat.received',
      source_module: 'csat_surveys',
      target_modules: ['dashboard', 'performance_mgmt', 'quality_assurance', 'client_mgmt'],
      event_data: csatData,
    });
  }

  async notifyAgentPerformanceUpdated(agentId: string, metrics: any): Promise<void> {
    await this.publishEvent({
      event_type: 'agent.performance_updated',
      source_module: 'performance_mgmt',
      target_modules: ['dashboard', 'coaching', 'workforce_mgmt'],
      event_data: { agent_id: agentId, metrics },
    });
  }

  async notifyClientRiskChanged(clientId: string, riskLevel: string): Promise<void> {
    await this.publishEvent({
      event_type: 'client.risk_changed',
      source_module: 'client_mgmt',
      target_modules: ['dashboard', 'account_management', 'executive_dashboard'],
      event_data: { client_id: clientId, risk_level: riskLevel },
      priority: riskLevel === 'critical' ? 'high' : 'normal',
    });
  }

  async notifyKBArticleCreated(article: any): Promise<void> {
    await this.publishEvent({
      event_type: 'kb.article_created',
      source_module: 'knowledge_base',
      target_modules: ['contact_center', 'training', 'quality_assurance'],
      event_data: { article_id: article.id, category: article.category },
    });
  }

  async notifyApprovalRequested(approvalData: any): Promise<void> {
    await this.publishEvent({
      event_type: 'approval.requested',
      source_module: 'approvals',
      target_modules: ['dashboard', 'notifications', 'management'],
      event_data: approvalData,
      priority: 'high',
    });
  }

  async notifyProcessCompleted(processId: string, processData: any): Promise<void> {
    await this.publishEvent({
      event_type: 'process.completed',
      source_module: 'process_execution',
      target_modules: ['dashboard', 'analytics', 'process_mgmt'],
      event_data: { process_id: processId, ...processData },
    });
  }
}

export const integrationService = new IntegrationService();
