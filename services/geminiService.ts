import { supabase } from '../lib/supabase';

export const suggestTitleForPrompt = async (promptText: string): Promise<string> => {
  if (!promptText.trim()) return 'Untitled Prompt';

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers,
      body: JSON.stringify({ promptText }),
    });

    if (!res.ok) {
      if (res.status === 503) return 'AI Title Suggestion (Not Configured)';
      if (res.status === 401) return 'Untitled Prompt';
      throw new Error(`Server returned ${res.status}`);
    }

    const data2 = (await res.json()) as { title?: string; error?: string };
    if (data2.error) throw new Error(data2.error);
    return data2.title || 'Untitled Prompt';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Network error while fetching AI suggestion'
    );
  }
};
