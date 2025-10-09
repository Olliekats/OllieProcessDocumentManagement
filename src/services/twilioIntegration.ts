/**
 * Twilio Integration Service
 *
 * This service provides methods to integrate with Twilio for:
 * - SMS messaging
 * - Voice calls
 * - WhatsApp messaging
 *
 * To activate:
 * 1. Get your Twilio credentials from https://console.twilio.com/
 * 2. Add them to the integration_connections table
 * 3. Configure the connection using the IntegrationManager
 */

import { supabase } from '../lib/supabase';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  environment?: 'production' | 'test';
}

export interface SMSMessage {
  to: string;
  from?: string;
  body: string;
  mediaUrl?: string[];
}

export interface VoiceCall {
  to: string;
  from?: string;
  url?: string; // TwiML URL
  statusCallback?: string;
}

export class TwilioIntegration {
  private connectionId: string | null = null;
  private config: TwilioConfig | null = null;

  /**
   * Initialize connection to Twilio
   */
  async connect(connectionId: string): Promise<boolean> {
    try {
      const { data: connection, error } = await supabase
        .from('integration_connections')
        .select('*, integration_providers(*)')
        .eq('id', connectionId)
        .eq('integration_providers.provider_name', 'twilio')
        .single();

      if (error || !connection) {
        console.error('Twilio connection not found:', error);
        return false;
      }

      this.connectionId = connectionId;
      this.config = connection.credentials as TwilioConfig;

      // Test connection
      await this.testConnection();

      return true;
    } catch (error) {
      console.error('Failed to connect to Twilio:', error);
      return false;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(message: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config || !this.connectionId) {
      return { success: false, error: 'Not connected to Twilio' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`;

      const formData = new URLSearchParams({
        To: message.to,
        From: message.from || this.config.phoneNumber,
        Body: message.body,
      });

      if (message.mediaUrl) {
        message.mediaUrl.forEach(url => formData.append('MediaUrl', url));
      }

      // Log API call
      const callStartTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.config.accountSid}:${this.config.authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const responseTime = Date.now() - callStartTime;
      const responseData = await response.json();

      // Log to database
      await this.logAPICall({
        method: 'POST',
        url,
        status: response.status,
        responseTime,
        responseBody: responseData,
        operation: 'send_sms',
      });

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || 'Failed to send SMS',
        };
      }

      return {
        success: true,
        messageId: responseData.sid,
      };
    } catch (error: any) {
      await this.logAPICall({
        method: 'POST',
        url: 'twilio_sms',
        status: 0,
        error: error.message,
        operation: 'send_sms',
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Make voice call
   */
  async makeCall(call: VoiceCall): Promise<{ success: boolean; callId?: string; error?: string }> {
    if (!this.config || !this.connectionId) {
      return { success: false, error: 'Not connected to Twilio' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Calls.json`;

      const formData = new URLSearchParams({
        To: call.to,
        From: call.from || this.config.phoneNumber,
        Url: call.url || '',
      });

      if (call.statusCallback) {
        formData.append('StatusCallback', call.statusCallback);
      }

      const callStartTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.config.accountSid}:${this.config.authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const responseTime = Date.now() - callStartTime;
      const responseData = await response.json();

      await this.logAPICall({
        method: 'POST',
        url,
        status: response.status,
        responseTime,
        responseBody: responseData,
        operation: 'make_call',
      });

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || 'Failed to make call',
        };
      }

      return {
        success: true,
        callId: responseData.sid,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(message: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // WhatsApp uses same API as SMS but with whatsapp: prefix
    const whatsappMessage = {
      ...message,
      to: `whatsapp:${message.to}`,
      from: message.from ? `whatsapp:${message.from}` : `whatsapp:${this.config?.phoneNumber}`,
    };

    return this.sendSMS(whatsappMessage);
  }

  /**
   * Test connection
   */
  private async testConnection(): Promise<void> {
    if (!this.config) return;

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}.json`;
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.config.accountSid}:${this.config.authToken}`),
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
   * Update connection status in database
   */
  private async updateConnectionStatus(status: string): Promise<void> {
    if (!this.connectionId) return;

    await supabase
      .from('integration_connections')
      .update({
        connection_status: status,
        is_connected: status === 'connected',
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
    responseBody?: any;
    error?: string;
    operation: string;
  }): Promise<void> {
    if (!this.connectionId) return;

    await supabase.from('api_call_logs').insert({
      connection_id: this.connectionId,
      request_method: params.method,
      request_url: params.url,
      response_status: params.status || null,
      response_time_ms: params.responseTime || null,
      response_body: params.responseBody || null,
      status: params.error ? 'error' : 'success',
      error_message: params.error || null,
      operation: params.operation,
    });

    // Update connection statistics
    await supabase.rpc('increment_api_call_count', {
      conn_id: this.connectionId,
      is_success: !params.error,
    });
  }
}

// Singleton instance
export const twilioService = new TwilioIntegration();
