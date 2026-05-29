import { supabase } from './supabase';

export const profileService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getByUsername(username: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async search(query: string) {
    if (!query.trim()) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .ilike('name', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },

  async follow(currentUserId: string, targetUserId: string): Promise<void> {
    const profile = await profileService.getById(currentUserId);
    if (!profile) throw new Error('Profile not found');
    const following: string[] = profile.following ?? [];
    const updated = following.includes(targetUserId)
      ? following.filter((id: string) => id !== targetUserId)
      : [...following, targetUserId];
    await profileService.update(currentUserId, { following: updated });
  },
};
