import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requireAuth(req: VercelRequest): Promise<boolean> {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  const { error } = await supabase.auth.getUser(token);
  return !error;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
