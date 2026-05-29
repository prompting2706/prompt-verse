import { supabase } from './supabase';

export const campaignService = {
  async getAll() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getBySeller(sellerId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(campaign: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;
  },
};
