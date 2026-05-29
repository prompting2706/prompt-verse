import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { requireAuth, escapeHtml, EMAIL_RE } from './_auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'PromptVerse <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL ?? 'https://promptverse.app';

interface OrderItem {
  title: string;
  price: number;
}

interface OrderPayload {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
}

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

  const body = req.body as Partial<OrderPayload>;

  if (!body.buyerEmail || !EMAIL_RE.test(body.buyerEmail)) {
    return res.status(400).json({ error: 'Valid buyerEmail is required' });
  }

  if (!body.orderId || typeof body.orderId !== 'string') {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: 'items are required' });
  }

  if (typeof body.total !== 'number' || isNaN(body.total) || body.total < 0) {
    return res.status(400).json({ error: 'total must be a non-negative number' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ skipped: true });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: body.buyerEmail,
      subject: `Order Confirmed — PromptVerse #${body.orderId.slice(0, 8).toUpperCase()}`,
      html: buildOrderHtml(body as OrderPayload, APP_URL),
    });

    if (error) {
      console.error('[order-confirmation] resend error', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[order-confirmation] handler error', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

function buildOrderHtml(order: OrderPayload, appUrl: string): string {
  const safeName = escapeHtml(order.buyerName || 'there');
  const safeOrderId = escapeHtml(order.orderId.slice(0, 8).toUpperCase());

  const itemRows = order.items
    .map((item) => {
      const safeTitle = escapeHtml(String(item.title));
      const safePrice = typeof item.price === 'number' && !isNaN(item.price)
        ? item.price.toFixed(2)
        : '0.00';
      return `
      <tr>
        <td style="padding:10px 0;font-size:14px;color:#111827;border-bottom:1px solid #f3f4f6;">${safeTitle}</td>
        <td style="padding:10px 0;font-size:14px;color:#111827;text-align:right;border-bottom:1px solid #f3f4f6;">$${safePrice}</td>
      </tr>`;
    })
    .join('');

  const safeTotal = order.total.toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">PromptVerse</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Order Confirmation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:600;">Thanks for your purchase, ${safeName}! 🎉</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
                Order ID: <span style="font-family:monospace;color:#374151;">#${safeOrderId}</span>
              </p>

              <!-- Items table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <th style="text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">Item</th>
                  <th style="text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#9ca3af;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">Price</th>
                </tr>
                ${itemRows}
                <tr>
                  <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#111827;">Total</td>
                  <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#22c55e;text-align:right;">$${safeTotal}</td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/#orders" style="display:inline-block;background:#22c55e;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;">
                      View My Purchases →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Questions? Contact us at <a href="mailto:support@promptverse.app" style="color:#22c55e;text-decoration:none;">support@promptverse.app</a>
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
