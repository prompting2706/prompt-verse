import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({ ok: false, error: 'Supabase not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return res.status(200).json({ ok: true, ts: new Date().toISOString() });
  } catch (err) {
    console.error('[ping] supabase error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
