import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_auth';

const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_PROMPT_LENGTH = 10000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await requireAuth(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { promptText } = req.body as { promptText?: string };

  if (!promptText || typeof promptText !== 'string' || promptText.trim().length === 0) {
    return res.status(400).json({ error: 'promptText is required' });
  }

  if (promptText.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: 'promptText too long' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured' });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Based on the following AI prompt, suggest a short, descriptive, and catchy title. The title should be no more than 5-7 words. Reply with ONLY the title — no quotes, no explanation, no punctuation at the end.\n\nPROMPT:\n---\n${promptText.slice(0, 2000)}\n---\n\nSUGGESTED TITLE:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 24,
        },
      }),
    });

    if (!geminiRes.ok) {
      console.error('[gemini] upstream error', geminiRes.status);
      return res.status(502).json({ error: 'Gemini API error' });
    }

    const data = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const title = raw.trim().replace(/^["']|["']$/g, '') || 'Untitled Prompt';

    return res.status(200).json({ title });
  } catch (err) {
    console.error('[gemini] handler error', err);
    return res.status(500).json({ error: 'Failed to generate title' });
  }
}
