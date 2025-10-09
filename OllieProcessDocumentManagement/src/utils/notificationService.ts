import { supabase } from '../lib/supabase';
import { screenReaderService } from './screenReaderService';

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  entityType?: string;
  entityId?: string;
}

export const notificationService = {
  async sendNotification(payload: NotificationPayload) {
    const { userId, title, message, type = 'info', link } = payload;

    const { data: settings } = await supabase
      .from('user_settings')
      .select('notification_preferences, email_frequency')
      .eq('user_id', userId)
      .maybeSingle();

    const prefs = settings?.notification_preferences || {
      in_app: { enabled: true },
      email: { enabled: true }
    };

    const notification = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        link,
        read: false
      })
      .select()
      .single();

    if (!notification.data) {
      throw new Error('Failed to create notification');
    }

    if (prefs.in_app?.enabled) {
      await supabase.from('notification_log').insert({
        notification_id: notification.data.id,
        user_id: userId,
        delivery_method: 'in_app',
        status: 'delivered',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      });

      if (screenReaderService.isEnabled()) {
        screenReaderService.announceNotification(title, message);
      }
    }

    if (prefs.email?.enabled && settings?.email_frequency === 'immediate') {
      await this.sendEmailNotification(userId, title, message, link);
    }

    return notification.data;
  },

  async sendEmailNotification(userId: string, title: string, message: string, link?: string) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile?.email) {
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          to: profile.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p style="color: #475569; font-size: 16px; line-height: 1.5;">${message}</p>
              ${link ? `<a href="${link}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Details</a>` : ''}
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
              <p style="color: #94a3b8; font-size: 12px;">OllieProcess - BPO Management Platform</p>
            </div>
          `
        })
      });

      await supabase.from('notification_log').insert({
        user_id: userId,
        delivery_method: 'email',
        status: response.ok ? 'sent' : 'failed',
        sent_at: new Date().toISOString(),
        error_message: response.ok ? null : await response.text()
      });
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  },

  async notifyApprovalRequest(approverId: string, entityType: string, entityName: string, requestedBy: string, entityId: string) {
    const { data: requester } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', requestedBy)
      .maybeSingle();

    await this.sendNotification({
      userId: approverId,
      title: 'New Approval Request',
      message: `${requester?.full_name || 'Someone'} has requested your approval for ${entityType}: ${entityName}`,
      type: 'warning',
      link: `/approvals`,
      entityType,
      entityId
    });
  },

  async notifyApprovalDecision(userId: string, entityType: string, entityName: string, approved: boolean, reviewerName: string) {
    await this.sendNotification({
      userId,
      title: `Approval ${approved ? 'Approved' : 'Rejected'}`,
      message: `Your ${entityType} "${entityName}" has been ${approved ? 'approved' : 'rejected'} by ${reviewerName}`,
      type: approved ? 'success' : 'error',
      link: `/${entityType}s`
    });
  },

  async notifyTaskAssignment(userId: string, taskName: string, assignedBy: string, taskId: string) {
    const { data: assigner } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', assignedBy)
      .maybeSingle();

    await this.sendNotification({
      userId,
      title: 'New Task Assigned',
      message: `${assigner?.full_name || 'Someone'} has assigned you a task: ${taskName}`,
      type: 'info',
      link: `/tasks`,
      entityType: 'task',
      entityId: taskId
    });
  },

  async notifyMention(userId: string, mentionedBy: string, context: string, link: string) {
    const { data: mentioner } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', mentionedBy)
      .maybeSingle();

    await this.sendNotification({
      userId,
      title: 'You were mentioned',
      message: `${mentioner?.full_name || 'Someone'} mentioned you: ${context}`,
      type: 'info',
      link
    });
  },

  async notifyProcessComplete(userId: string, processName: string, processId: string) {
    await this.sendNotification({
      userId,
      title: 'Process Completed',
      message: `The process "${processName}" has been completed successfully.`,
      type: 'success',
      link: `/processes/${processId}`
    });
  },

  async notifySLAWarning(userId: string, processName: string, remainingTime: string) {
    await this.sendNotification({
      userId,
      title: 'SLA Warning',
      message: `Process "${processName}" is approaching its SLA deadline. Time remaining: ${remainingTime}`,
      type: 'warning',
      link: `/processes`
    });
  },

  async markAsRead(notificationId: string, userId: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  },

  async markAllAsRead(userId: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    return count || 0;
  }
};
