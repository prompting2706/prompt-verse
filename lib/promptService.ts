import { supabase } from './supabase';

const PAGE_SIZE = 20;

export const promptService = {
  async getByUser(userId: string, page = 0) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    return data ?? [];
  },

  async getArchived(userId: string) {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(prompt: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('prompts')
      .insert(prompt as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('prompts')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('prompts').delete().eq('id', id);
    if (error) throw error;
  },

  async archive(id: string, archived: boolean): Promise<void> {
    await promptService.update(id, { is_archived: archived });
  },

  async incrementUseCount(id: string): Promise<void> {
    const { data } = await supabase.from('prompts').select('use_count').eq('id', id).single();
    if (data) await promptService.update(id, { use_count: ((data as any).use_count ?? 0) + 1 });
  },
};
