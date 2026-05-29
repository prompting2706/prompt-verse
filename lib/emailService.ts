import { supabase } from './supabase';

interface OrderItem {
  title: string;
  price: number;
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const emailService = {
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
    } catch {
      // Never block registration over email failure
    }
  },

  async sendOrderConfirmation(params: {
    buyerEmail: string;
    buyerName: string;
    orderId: string;
    items: OrderItem[];
    total: number;
  }): Promise<void> {
    try {
      const headers = await authHeader();
      await fetch('/api/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(params),
      });
    } catch {
      // Never block checkout over email failure
    }
  },
};
