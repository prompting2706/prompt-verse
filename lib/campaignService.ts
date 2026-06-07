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

  // BUG-021: batch-persist accumulated impressions to DB
  async flushImpressions(batches: Map<string, number>): Promise<void> {
    const updates = Array.from(batches.entries());
    await Promise.allSettled(
      updates.map(([id, count]) =>
        supabase.rpc('increment_campaign_impressions', { campaign_id: id, increment_by: count })
          .then(({ error }) => {
            if (error) {
              // Fallback: read-then-write if RPC doesn't exist
              return supabase
                .from('campaigns')
                .select('total_impressions')
                .eq('id', id)
                .single()
                .then(({ data }) => {
                  const current = (data as any)?.total_impressions ?? 0;
                  return supabase
                    .from('campaigns')
                    .update({ total_impressions: current + count } as any)
                    .eq('id', id);
                });
            }
          })
      )
    );
  },
};
