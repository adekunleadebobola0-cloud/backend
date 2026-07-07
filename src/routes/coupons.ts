import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validate a coupon
router.post('/validate', authenticate, async (req, res) => {
  const { code } = req.body;
  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    
    if (new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
