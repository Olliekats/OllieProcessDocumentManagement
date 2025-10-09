/**
 * Salesforce Service Cloud Integration
 *
 * This service provides methods to integrate with Salesforce for:
 * - Case management
 * - Contact/Account sync
 * - Knowledge articles
 * - Custom objects
 *
 * To activate:
 * 1. Create a Connected App in Salesforce
 * 2. Get OAuth credentials
 * 3. Add them to the integration_connections table
 * 4. Configure object mappings in integration_mappings table
 */

import { supabase } from '../lib/supabase';

export interface SalesforceConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  username?: string;
  password?: string;
  securityToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface SalesforceCase {
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  Origin: string;
  ContactId?: string;
  AccountId?: string;
  Type?: string;
  Reason?: string;
}

export interface SalesforceContact {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  AccountId?: string;
}

export class SalesforceIntegration {
  private connectionId: string | null = null;
  private config: SalesforceConfig | null = null;
  private accessToken: string | null = null;

  /**
   * Initialize connection to Salesforce
   */
  async connect(connectionId: string): Promise<boolean> {
    try {
      const { data: connection, error } = await supabase
        .from('integration_connections')
        .select('*, integration_providers(*)')
        .eq('id', connectionId)
        .eq('integration_providers.provider_name', 'salesforce')
        .single();

      if (error || !connection) {
        console.error('Salesforce connection not found:', error);
        return false;
      }

      this.connectionId = connectionId;
      this.config = connection.credentials as SalesforceConfig;

      // Authenticate
      await this.authenticate();

      return true;
    } catch (error) {
      console.error('Failed to connect to Salesforce:', error);
      return false;
    }
  }

  /**
   * Authenticate with Salesforce (OAuth2 Password Flow)
   */
  private async authenticate(): Promise<boolean> {
    if (!this.config) return false;

    try {
      const tokenUrl = `${this.config.instanceUrl}/services/oauth2/token`;

      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username: this.config.username || '',
        password: `${this.config.password || ''}${this.config.securityToken || ''}`,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Salesforce authentication failed:', data);
        await this.updateConnectionStatus('failed', data.error_description);
        return false;
      }

      this.accessToken = data.access_token;

      // Update config with tokens
      await supabase
        .from('integration_connections')
        .update({
          oauth_token_encrypted: data.access_token,
          oauth_refresh_token_encrypted: data.refresh_token,
          oauth_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          is_connected: true,
          connection_status: 'connected',
          last_successful_call: new Date().toISOString(),
        })
        .eq('id', this.connectionId);

      return true;
    } catch (error: any) {
      console.error('Authentication error:', error);
      await this.updateConnectionStatus('failed', error.message);
      return false;
    }
  }

  /**
   * Create a Case in Salesforce
   */
  async createCase(caseData: SalesforceCase): Promise<{ success: boolean; caseId?: string; error?: string }> {
    if (!this.accessToken || !this.config) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const url = `${this.config.instanceUrl}/services/data/v57.0/sobjects/Case`;

      const callStartTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      const responseTime = Date.now() - callStartTime;
      const responseData = await response.json();

      await this.logAPICall({
        method: 'POST',
        url,
        status: response.status,
        responseTime,
        requestBody: caseData,
        responseBody: responseData,
        operation: 'create_case',
        entityType: 'case',
      });

      if (!response.ok) {
        return {
          success: false,
          error: responseData[0]?.message || 'Failed to create case',
        };
      }

      // Log sync
      await this.logSync({
        objectType: 'case',
        operation: 'create',
        direction: 'push',
        recordsProcessed: 1,
        recordsSuccessful: 1,
        externalId: responseData.id,
      });

      return {
        success: true,
        caseId: responseData.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a Case in Salesforce
   */
  async updateCase(caseId: string, caseData: Partial<SalesforceCase>): Promise<{ success: boolean; error?: string }> {
    if (!this.accessToken || !this.config) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const url = `${this.config.instanceUrl}/services/data/v57.0/sobjects/Case/${caseId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      if (response.status === 204) {
        await this.logSync({
          objectType: 'case',
          operation: 'update',
          direction: 'push',
          recordsProcessed: 1,
          recordsSuccessful: 1,
          externalId: caseId,
        });

        return { success: true };
      }

      const responseData = await response.json();
      return {
        success: false,
        error: responseData[0]?.message || 'Failed to update case',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get Case from Salesforce
   */
  async getCase(caseId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.accessToken || !this.config) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const url = `${this.config.instanceUrl}/services/data/v57.0/sobjects/Case/${caseId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data[0]?.message || 'Failed to get case',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Query Salesforce using SOQL
   */
  async query(soql: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    if (!this.accessToken || !this.config) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const url = `${this.config.instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(soql)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data[0]?.message || 'Query failed',
        };
      }

      return {
        success: true,
        data: data.records,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create Contact in Salesforce
   */
  async createContact(contact: SalesforceContact): Promise<{ success: boolean; contactId?: string; error?: string }> {
    if (!this.accessToken || !this.config) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const url = `${this.config.instanceUrl}/services/data/v57.0/sobjects/Contact`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data[0]?.message || 'Failed to create contact',
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
    entityId?: string;
    externalId?: string;
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
      entity_id: params.entityId || null,
      external_id: params.externalId || null,
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
export const salesforceService = new SalesforceIntegration();
