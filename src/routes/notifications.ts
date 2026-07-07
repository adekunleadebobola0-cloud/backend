import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
