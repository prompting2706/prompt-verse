import { supabase } from './supabase';

const WITH_PROFILES = `
  *,
  buyer:profiles!custom_orders_buyer_id_fkey(name, avatar_url),
  seller:profiles!custom_orders_seller_id_fkey(name, avatar_url)
`;

export const customOrderService = {
  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('custom_orders')
      .select(WITH_PROFILES)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(order: {
    buyer_id: string;
    seller_id: string;
    title: string;
    description: string;
    budget: number;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('custom_orders')
      .insert({
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        title: order.title,
        description: order.description,
        budget: order.budget,
        status: order.status ?? 'pending',
      } as any)
      .select(WITH_PROFILES)
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('custom_orders')
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select(WITH_PROFILES)
      .single();
    if (error) throw error;
    return data;
  },
};
