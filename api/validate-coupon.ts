import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from './_auth';

// Kupon kodları yalnızca sunucu tarafında — browser bundle'a dahil edilmez (BUG-027)
const COUPONS = [
  { code: 'HOSGELDIN',     type: 'percent' as const, value: 20, minOrderAmount: 5,  description: 'İlk alışverişe %20 indirim' },
  { code: 'PROMPTVERSE10', type: 'fixed'   as const, value: 2,  minOrderAmount: 10, description: '$2 indirim kuponu' },
  { code: 'CREATOR50',     type: 'percent' as const, value: 50,                      description: 'Creator üyelerine özel %50 indirim' },
  { code: 'BUNDLE5',       type: 'fixed'   as const, value: 5,  minOrderAmount: 20, description: 'Paket alışverişine $5 indirim' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Sadece oturum açmış kullanıcılar kupon doğrulayabilir
  if (!(await requireAuth(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body as { code?: unknown; subtotal?: unknown };

  if (!body.code || typeof body.code !== 'string') {
    return res.status(400).json({ error: 'Geçersiz istek.' });
  }

  if (typeof body.subtotal !== 'number' || isNaN(body.subtotal) || body.subtotal < 0) {
    return res.status(400).json({ error: 'Geçersiz istek.' });
  }

  const code = body.code.trim().toUpperCase();
  const subtotal = body.subtotal as number;

  const coupon = COUPONS.find(c => c.code === code);

  if (!coupon) {
    return res.status(404).json({ error: 'Geçersiz kupon kodu.' });
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      error: `Bu kupon en az $${coupon.minOrderAmount.toFixed(2)} tutarındaki siparişlerde geçerlidir.`,
    });
  }

  return res.status(200).json({ coupon });
}
