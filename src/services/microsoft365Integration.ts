import { supabase } from '../lib/supabase';

interface Microsoft365Config {
  tenant_id: string;
  client_id: string;
  client_secret: string;
  outlook_enabled?: boolean;
  teams_enabled?: boolean;
  sharepoint_enabled?: boolean;
  sharepoint_site_url?: string;
}

interface OutlookEmailOptions {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  attachments?: Array<{
    name: string;
    contentBytes: string;
  }>;
}

interface TeamsMessageOptions {
  channelId: string;
  message: string;
  mentions?: string[];
}

interface SharePointUploadOptions {
  siteUrl: string;
  libraryName: string;
  fileName: string;
  fileContent: Blob | ArrayBuffer;
}

class Microsoft365Integration {
  private accessToken: string | null = null;
  private config: Microsoft365Config | null = null;

  async initialize(userId: string): Promise<void> {
    const { data } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.api_keys?.microsoft365) {
      this.config = data.api_keys.microsoft365;
      await this.getAccessToken();
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config) throw new Error('Microsoft 365 not configured');

    if (this.accessToken) return this.accessToken;

    const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenant_id}/oauth2/v2.0/token`;

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.client_id,
        client_secret: this.config.client_secret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async sendOutlookEmail(options: OutlookEmailOptions): Promise<boolean> {
    if (!this.config?.outlook_enabled) {
      throw new Error('Outlook integration is not enabled');
    }

    try {
      const token = await this.getAccessToken();
      const graphUrl = 'https://graph.microsoft.com/v1.0/me/sendMail';

      const emailPayload = {
        message: {
          subject: options.subject,
          body: {
            contentType: 'HTML',
            content: options.body,
          },
          toRecipients: options.to.map(email => ({
            emailAddress: { address: email },
          })),
          ccRecipients: options.cc?.map(email => ({
            emailAddress: { address: email },
          })),
          attachments: options.attachments,
        },
        saveToSentItems: true,
      };

      const response = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Outlook email:', error);
      return false;
    }
  }

  async sendTeamsMessage(options: TeamsMessageOptions): Promise<boolean> {
    if (!this.config?.teams_enabled) {
      throw new Error('Teams integration is not enabled');
    }

    try {
      const token = await this.getAccessToken();
      const graphUrl = `https://graph.microsoft.com/v1.0/teams/{team-id}/channels/${options.channelId}/messages`;

      const messagePayload = {
        body: {
          content: options.message,
        },
      };

      const response = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Teams message:', error);
      return false;
    }
  }

  async uploadToSharePoint(options: SharePointUploadOptions): Promise<boolean> {
    if (!this.config?.sharepoint_enabled) {
      throw new Error('SharePoint integration is not enabled');
    }

    try {
      const token = await this.getAccessToken();
      const siteUrl = this.config.sharepoint_site_url || options.siteUrl;
      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${siteUrl}/drive/root:/${options.libraryName}/${options.fileName}:/content`;

      const response = await fetch(graphUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: options.fileContent,
      });

      return response.ok;
    } catch (error) {
      console.error('Error uploading to SharePoint:', error);
      return false;
    }
  }

  async createTeamsApprovalRequest(options: {
    title: string;
    description: string;
    approvers: string[];
    dueDate?: Date;
  }): Promise<string | null> {
    if (!this.config?.teams_enabled) {
      throw new Error('Teams integration is not enabled');
    }

    try {
      const token = await this.getAccessToken();
      const graphUrl = 'https://graph.microsoft.com/v1.0/teams/approvals';

      const approvalPayload = {
        displayName: options.title,
        description: options.description,
        requestedBy: options.approvers,
        dueDateTime: options.dueDate?.toISOString(),
      };

      const response = await fetch(graphUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalPayload),
      });

      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating Teams approval:', error);
      return null;
    }
  }

  async getSharePointDocuments(libraryName: string): Promise<any[]> {
    if (!this.config?.sharepoint_enabled || !this.config.sharepoint_site_url) {
      throw new Error('SharePoint integration is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${this.config.sharepoint_site_url}/drive/root:/${libraryName}:/children`;

      const response = await fetch(graphUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.value;
      }
      return [];
    } catch (error) {
      console.error('Error getting SharePoint documents:', error);
      return [];
    }
  }
}

export const microsoft365Integration = new Microsoft365Integration();

export const sendApprovalEmailViaOutlook = async (
  userId: string,
  to: string[],
  approvalDetails: {
    processName: string;
    requestedBy: string;
    description: string;
    approvalUrl: string;
  }
): Promise<boolean> => {
  await microsoft365Integration.initialize(userId);

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Approval Request</h2>
      <p>You have a new approval request:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Process:</strong> ${approvalDetails.processName}</p>
        <p><strong>Requested by:</strong> ${approvalDetails.requestedBy}</p>
        <p><strong>Description:</strong> ${approvalDetails.description}</p>
      </div>
      <p>
        <a href="${approvalDetails.approvalUrl}"
           style="background-color: #2563eb; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Review Approval
        </a>
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        This is an automated message from OllieProcess.
      </p>
    </div>
  `;

  return await microsoft365Integration.sendOutlookEmail({
    to,
    subject: `Approval Required: ${approvalDetails.processName}`,
    body: emailBody,
  });
};

export const sendTaskAssignmentViaTeams = async (
  userId: string,
  channelId: string,
  taskDetails: {
    taskName: string;
    assignedTo: string;
    dueDate: string;
    description: string;
  }
): Promise<boolean> => {
  await microsoft365Integration.initialize(userId);

  const message = `
📋 **New Task Assignment**

**Task:** ${taskDetails.taskName}
**Assigned to:** ${taskDetails.assignedTo}
**Due Date:** ${taskDetails.dueDate}
**Description:** ${taskDetails.description}
  `;

  return await microsoft365Integration.sendTeamsMessage({
    channelId,
    message,
  });
};

export const uploadSOPToSharePoint = async (
  userId: string,
  sopDetails: {
    fileName: string;
    content: Blob;
    libraryName: string;
  }
): Promise<boolean> => {
  await microsoft365Integration.initialize(userId);

  return await microsoft365Integration.uploadToSharePoint({
    siteUrl: '',
    libraryName: sopDetails.libraryName,
    fileName: sopDetails.fileName,
    fileContent: sopDetails.content,
  });
};
