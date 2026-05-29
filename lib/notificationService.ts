import { supabase } from './supabase';

export const notificationService = {
  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },

  async create(notification: Record<string, unknown>) {
    const { error } = await supabase
      .from('notifications')
      .insert(notification as any);
    if (error) throw error;
  },

  async markRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true } as any)
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true } as any)
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },
};
