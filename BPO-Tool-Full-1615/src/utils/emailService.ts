import { supabase } from '../lib/supabase';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session for email sending');
      return false;
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Email send failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('Email sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const emailTemplates = {
  notification: (title: string, message: string, actionUrl?: string) => ({
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
              ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
            </div>
            <div class="footer">
              <p>BPO Management Platform</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `${title}\n\n${message}${actionUrl ? `\n\nView details: ${actionUrl}` : ''}`,
  }),

  approval: (itemType: string, itemTitle: string, requester: string, actionUrl?: string) => ({
    subject: `Approval Required: ${itemType}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Approval Required</h1>
            </div>
            <div class="content">
              <p>A new ${itemType} requires your approval.</p>
              <div class="info-box">
                <strong>${itemType}:</strong> ${itemTitle}<br>
                <strong>Requested by:</strong> ${requester}
              </div>
              <p>Please review and take action on this approval request.</p>
              ${actionUrl ? `<a href="${actionUrl}" class="button">Review & Approve</a>` : ''}
            </div>
            <div class="footer">
              <p>BPO Management Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Approval Required: ${itemType}\n\n${itemType}: ${itemTitle}\nRequested by: ${requester}\n\nPlease review and take action.${actionUrl ? `\n\nReview: ${actionUrl}` : ''}`,
  }),

  welcome: (userName: string) => ({
    subject: 'Welcome to BPO Management Platform',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .features { list-style: none; padding: 0; }
            .features li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Welcome to BPO Platform</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Welcome to the BPO Management Platform! Your account has been successfully created.</p>
              <p>Here's what you can do:</p>
              <ul class="features">
                <li>📊 Manage processes and workflows</li>
                <li>📈 Track KPIs and performance metrics</li>
                <li>👥 Collaborate with your team</li>
                <li>📝 Create and manage SOPs</li>
                <li>🔄 Handle change initiatives</li>
              </ul>
            </div>
            <div class="footer">
              <p>BPO Management Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to BPO Management Platform!\n\nHi ${userName},\n\nYour account has been successfully created. You can now manage processes, track KPIs, collaborate with your team, and more.`,
  }),
};

export const sendNotificationEmail = async (
  to: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<boolean> => {
  const template = emailTemplates.notification(title, message, actionUrl);
  return sendEmail({ to, ...template });
};

export const sendApprovalEmail = async (
  to: string,
  itemType: string,
  itemTitle: string,
  requester: string,
  actionUrl?: string
): Promise<boolean> => {
  const template = emailTemplates.approval(itemType, itemTitle, requester, actionUrl);
  return sendEmail({ to, ...template });
};

export const sendWelcomeEmail = async (to: string, userName: string): Promise<boolean> => {
  const template = emailTemplates.welcome(userName);
  return sendEmail({ to, ...template });
};
