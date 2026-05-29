import { type Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  username: string;
  referralCode?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, name, username, referralCode }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, username },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Sign up failed');

    // Link referral if code provided
    if (referralCode && data.user) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrer) {
        await supabase.from('referrals').insert({
          referrer_id: (referrer as any).id,
          referred_user_id: data.user.id,
          status: 'pending',
          earned_amount: 0,
        } as any);
      }
    }

    return data;
  },

  async signIn({ email, password }: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
