import { supabase } from '../lib/supabase';
import { sendNotificationEmail } from './emailService';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  sendEmail?: boolean;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, title, message, type = 'info', link, sendEmail: shouldSendEmail = false } = params;

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    link,
  });

  if (error) {
    console.error('Failed to create notification:', error);
    return;
  }

  if (shouldSendEmail) {
    try {
      const { data: userData } = await supabase
        .from('users_profile')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      if (userData?.email) {
        await sendNotificationEmail(userData.email, title, message, link);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }
  }
};

export const notifyUser = {
  success: (userId: string, title: string, message: string, link?: string) =>
    createNotification({ userId, title, message, type: 'success', link }),

  error: (userId: string, title: string, message: string, link?: string) =>
    createNotification({ userId, title, message, type: 'error', link }),

  warning: (userId: string, title: string, message: string, link?: string) =>
    createNotification({ userId, title, message, type: 'warning', link }),

  info: (userId: string, title: string, message: string, link?: string) =>
    createNotification({ userId, title, message, type: 'info', link }),
};
