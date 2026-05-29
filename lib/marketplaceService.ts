import { supabase } from './supabase';

const PAGE_SIZE = 24;

export const marketplaceService = {
  async getItems(page = 0, filters?: { tag?: string; minPrice?: number; maxPrice?: number }) {
    let query = supabase
      .from('marketplace_items')
      .select('*, seller:profiles!marketplace_items_seller_id_fkey(name, avatar_url, verification_status)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filters?.tag) query = query.contains('tags', [filters.tag]);
    if (filters?.minPrice !== undefined) query = query.gte('price', filters.minPrice);
    if (filters?.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getBySeller(sellerId: string) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*, seller:profiles!marketplace_items_seller_id_fkey(name, avatar_url, verification_status)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(item: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .insert(item as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
    if (error) throw error;
  },

  async uploadCover(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-covers').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-covers').getPublicUrl(path);
    return data.publicUrl;
  },

  async createOrderBatch(rows: Array<{
    buyer_id: string;
    seller_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    commission_rate: number;
    net_amount: number;
    status: string;
  }>) {
    const { data, error } = await supabase
      .from('orders')
      .insert(rows as any)
      .select('id');
    if (error) throw error;
    return data ?? [];
  },

  async getOrdersByBuyer(buyerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, item:marketplace_items!orders_item_id_fkey(id, title, cover_image, type, price, tags, seller_id)')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
