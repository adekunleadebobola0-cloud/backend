import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/initiate', authenticate, async (req, res) => {
  const { bookingId, method, amount } = req.body;
  try {
    // Mock payment authorization
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        method: method as any,
        amount,
        status: 'SUCCESS',
        transactionId: `txn_${Date.now()}`
      }
    });

    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
