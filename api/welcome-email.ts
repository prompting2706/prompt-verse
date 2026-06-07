import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { requireAuth, escapeHtml, EMAIL_RE } from './_auth';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use Resend's shared domain for testing; swap to your verified domain in production
const FROM = process.env.EMAIL_FROM ?? 'PromptVerse <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL ?? 'https://promptverse.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // BUG: endpoint had no auth — anyone could send emails in PromptVerse's name
  if (!(await requireAuth(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, name } = req.body as { email?: string; name?: string };

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!process.env.RESEND_API_KEY) {
    // Not configured — silently succeed so registration is not blocked
    return res.status(200).json({ skipped: true });
  }

  const displayName = escapeHtml(name || 'there');

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Welcome to PromptVerse! 🚀',
      html: buildWelcomeHtml(displayName, APP_URL),
    });

    if (error) {
      console.error('[welcome-email] resend error', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[welcome-email] handler error', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

function buildWelcomeHtml(name: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to PromptVerse</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">PromptVerse</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your AI Prompt Management &amp; Marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:600;">Welcome, ${name}! 👋</h2>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
                You're now part of a growing community of AI enthusiasts, prompt engineers, and creators. Here's what you can do on PromptVerse:
              </p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${featureRow('📝', 'Manage Prompts', 'Organize, tag, and version your AI prompts in one place.')}
                ${featureRow('🛒', 'Marketplace', 'Sell your best prompts and discover creations from others.')}
                ${featureRow('🤝', 'Collaborate', 'Share projects, follow creators, and grow together.')}
                ${featureRow('✨', 'AI Suggestions', 'Get AI-powered title and tag suggestions for your prompts.')}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.1px;">
                      Go to PromptVerse →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                You received this email because you signed up at <a href="${appUrl}" style="color:#22c55e;text-decoration:none;">promptverse.app</a>.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${appUrl}/#privacy" style="color:#9ca3af;">Privacy Policy</a> &nbsp;·&nbsp;
                <a href="${appUrl}/#terms" style="color:#9ca3af;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function featureRow(emoji: string, title: string, description: string): string {
  return `<tr>
    <td style="padding:10px 0;vertical-align:top;width:40px;font-size:20px;">${emoji}</td>
    <td style="padding:10px 0 10px 12px;vertical-align:top;">
      <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${title}</p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${description}</p>
    </td>
  </tr>`;
}
