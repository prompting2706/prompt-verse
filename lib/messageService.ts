import { supabase } from './supabase';

export const messageService = {
  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    text: string;
    sharedPromptId?: string;
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        text: params.text,
        is_read: false,
      } as any)
      .select()
      .single();
    if (error) throw error;

    // Update last_message and last_message_at on the conversation
    await supabase
      .from('conversations')
      .update({
        last_message: params.text.substring(0, 200),
        last_message_at: new Date().toISOString(),
      } as any)
      .eq('id', params.conversationId);

    return data;
  },

  async getOrCreateConversation(userId1: string, userId2: string): Promise<string> {
    // Look for existing conversation with exactly these two participants
    const { data: existing } = await supabase
      .from('conversations')
      .select('id, participant_ids')
      .contains('participant_ids', [userId1, userId2]);

    if (existing && existing.length > 0) {
      return (existing[0] as any).id;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ participant_ids: [userId1, userId2] } as any)
      .select()
      .single();
    if (error) throw error;
    return (data as any).id;
  },

  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },

  async markMessagesRead(conversationId: string, userId: string) {
    // Mark all unread messages in this conversation that were NOT sent by this user
    await supabase
      .from('messages')
      .update({ is_read: true } as any)
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', userId);
  },

  subscribeToMessages(conversationId: string, onNew: (msg: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onNew(payload.new)
      )
      .subscribe();
  },
};
