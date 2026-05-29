import { supabase } from './supabase';

export const referralService = {
  async getByReferrer(referrerId: string) {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:profiles!referrals_referred_user_id_fkey(name, avatar_url)
      `)
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
