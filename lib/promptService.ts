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

  // BUG-006: load all pages so users with 20+ prompts see everything
  async getAllByUser(userId: string): Promise<Record<string, unknown>[]> {
    const all: Record<string, unknown>[] = [];
    let page = 0;
    while (true) {
      const batch = await promptService.getByUser(userId, page);
      all.push(...(batch as Record<string, unknown>[]));
      if (batch.length < PAGE_SIZE) break;
      page++;
    }
    return all;
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
    const { data } = await supabase.from('prompts').select('use_count').eq('id', id).maybeSingle();
    if (data) await promptService.update(id, { use_count: ((data as any).use_count ?? 0) + 1 });
  },

  // BUG-005: persist prompt likes to DB
  async toggleLike(id: string, userId: string, currentLikes: string[]): Promise<string[]> {
    const liked = currentLikes.includes(userId);
    const newLikes = liked
      ? currentLikes.filter(x => x !== userId)
      : [...currentLikes, userId];
    await promptService.update(id, { likes: newLikes });
    return newLikes;
  },

  // BUG-005: persist prompt comments to DB
  async addComment(promptId: string, comment: { id: string; authorId: string; authorName: string; authorAvatar: string; text: string; createdAt: string }, currentComments: import('../types').Comment[]): Promise<void> {
    await promptService.update(promptId, { comments: [...currentComments, comment] });
  },
};
