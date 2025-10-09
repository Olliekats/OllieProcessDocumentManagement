/**
 * Bird.com Integration Service
 *
 * This service provides methods to integrate with Bird.com for:
 * - Omnichannel messaging (SMS, WhatsApp, Email, Voice, RCS)
 * - Contact management
 * - Campaign management
 * - Analytics
 *
 * To activate:
 * 1. Get your Bird.com API key from https://dashboard.bird.com/
 * 2. Add it to the integration_connections table
 * 3. Configure your workspace and channels
 */

import { supabase } from '../lib/supabase';

export interface BirdConfig {
  apiKey: string;
  workspaceId: string;
  channelId?: string;
  webhookSecret?: string;
}

export interface BirdMessage {
  to: string;
  from?: string;
  channel: 'sms' | 'whatsapp' | 'email' | 'voice' | 'rcs';
  type: 'text' | 'image' | 'video' | 'file' | 'template';
  content: {
    text?: string;
    templateId?: string;
    templateParams?: Record<string, string>;
    mediaUrl?: string;
    subject?: string; // For email
  };
}

export interface BirdContact {
  identifier: string; // Phone number or email
  displayName?: string;
  attributes?: Record<string, any>;
  channels?: string[];
}

export class BirdIntegration {
  private connectionId: string | null = null;
  private config: BirdConfig | null = null;
  private baseUrl = 'https://api.bird.com/v1';

  /**
   * Initialize connection to Bird.com
   */
  async connect(connectionId: string): Promise<boolean> {
    try {
      const { data: connection, error } = await supabase
        .from('integration_connections')
        .select('*, integration_providers(*)')
        .eq('id', connectionId)
        .eq('integration_providers.provider_name', 'bird')
        .single();

      if (error || !connection) {
        console.error('Bird connection not found:', error);
        return false;
      }

      this.connectionId = connectionId;
      this.config = connection.credentials as BirdConfig;

      // Test connection
      await this.testConnection();

      return true;
    } catch (error) {
      console.error('Failed to connect to Bird:', error);
      return false;
    }
  }

  /**
   * Send omnichannel message
   */
  async sendMessage(message: BirdMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config || !this.connectionId) {
      return { success: false, error: 'Not connected to Bird' };
    }

    try {
      const url = `${this.baseUrl}/workspaces/${this.config.workspaceId}/messages`;

      const payload = {
        receiver: {
          contacts: [
            {
              identifierValue: message.to,
            },
          ],
        },
        channel: message.channel,
        content: this.buildMessageContent(message),
      };

      if (message.from) {
        payload['sender'] = {
          identifierValue: message.from,
        };
      }

      const callStartTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseTime = Date.now() - callStartTime;
      const responseData = await response.json();

      await this.logAPICall({
        method: 'POST',
        url,
        status: response.status,
        responseTime,
        requestBody: payload,
        responseBody: responseData,
        operation: 'send_message',
        entityType: `${message.channel}_message`,
      });

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || 'Failed to send message',
        };
      }

      // Log to integration_sync_logs
      await this.logSync({
        objectType: `${message.channel}_message`,
        operation: 'create',
        direction: 'push',
        recordsProcessed: 1,
        recordsSuccessful: 1,
        externalId: responseData.id,
      });

      return {
        success: true,
        messageId: responseData.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to,
      channel: 'sms',
      type: 'text',
      content: { text },
    });
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to,
      channel: 'whatsapp',
      type: 'text',
      content: { text },
    });
  }

  /**
   * Send WhatsApp template message
   */
  async sendWhatsAppTemplate(
    to: string,
    templateId: string,
    params: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to,
      channel: 'whatsapp',
      type: 'template',
      content: {
        templateId,
        templateParams: params,
      },
    });
  }

  /**
   * Send email via Bird
   */
  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendMessage({
      to,
      channel: 'email',
      type: 'text',
      content: {
        subject,
        text,
      },
    });
  }

  /**
   * Create or update contact
   */
  async upsertContact(contact: BirdContact): Promise<{ success: boolean; contactId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Not connected to Bird' };
    }

    try {
      const url = `${this.baseUrl}/workspaces/${this.config.workspaceId}/contacts`;

      const payload = {
        identifier: contact.identifier,
        displayName: contact.displayName,
        attributes: contact.attributes || {},
        channels: contact.channels || [],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create contact',
        };
      }

      return {
        success: true,
        contactId: data.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Not connected to Bird' };
    }

    try {
      const url = `${this.baseUrl}/messages/${messageId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `AccessKey ${this.config.apiKey}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get message status',
        };
      }

      return {
        success: true,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build message content based on type
   */
  private buildMessageContent(message: BirdMessage): any {
    switch (message.type) {
      case 'text':
        return {
          text: message.content.text,
        };

      case 'template':
        return {
          template: {
            id: message.content.templateId,
            parameters: message.content.templateParams,
          },
        };

      case 'image':
      case 'video':
      case 'file':
        return {
          media: {
            url: message.content.mediaUrl,
            type: message.type,
          },
        };

      default:
        return { text: message.content.text };
    }
  }

  /**
   * Test connection
   */
  private async testConnection(): Promise<void> {
    if (!this.config) return;

    try {
      const url = `${this.baseUrl}/workspaces/${this.config.workspaceId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `AccessKey ${this.config.apiKey}`,
        },
      });

      if (response.ok) {
        await this.updateConnectionStatus('connected');
      } else {
        await this.updateConnectionStatus('failed');
      }
    } catch (error) {
      await this.updateConnectionStatus('failed');
    }
  }

  /**
   * Update connection status
   */
  private async updateConnectionStatus(status: string, error?: string): Promise<void> {
    if (!this.connectionId) return;

    await supabase
      .from('integration_connections')
      .update({
        connection_status: status,
        is_connected: status === 'connected',
        connection_error: error || null,
        last_connection_test: new Date().toISOString(),
      })
      .eq('id', this.connectionId);
  }

  /**
   * Log API call to database
   */
  private async logAPICall(params: {
    method: string;
    url: string;
    status?: number;
    responseTime?: number;
    requestBody?: any;
    responseBody?: any;
    error?: string;
    operation: string;
    entityType?: string;
  }): Promise<void> {
    if (!this.connectionId) return;

    await supabase.from('api_call_logs').insert({
      connection_id: this.connectionId,
      request_method: params.method,
      request_url: params.url,
      request_body: params.requestBody || null,
      response_status: params.status || null,
      response_time_ms: params.responseTime || null,
      response_body: params.responseBody || null,
      status: params.error ? 'error' : 'success',
      error_message: params.error || null,
      operation: params.operation,
      entity_type: params.entityType || null,
    });
  }

  /**
   * Log sync operation
   */
  private async logSync(params: {
    objectType: string;
    operation: string;
    direction: 'push' | 'pull';
    recordsProcessed: number;
    recordsSuccessful: number;
    externalId?: string;
  }): Promise<void> {
    if (!this.connectionId) return;

    await supabase.from('integration_sync_logs').insert({
      connection_id: this.connectionId,
      sync_type: 'realtime',
      sync_direction: params.direction,
      object_type: params.objectType,
      operation: params.operation,
      records_processed: params.recordsProcessed,
      records_successful: params.recordsSuccessful,
      records_failed: params.recordsProcessed - params.recordsSuccessful,
      status: params.recordsSuccessful === params.recordsProcessed ? 'completed' : 'partial',
      target_ids: params.externalId ? [params.externalId] : [],
      completed_at: new Date().toISOString(),
    });
  }
}

// Singleton instance
export const birdService = new BirdIntegration();
