import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, createdAt: true }
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all bookings
router.get('/bookings', authenticate, requireAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { fullName: true } },
        handyman: { select: { user: { select: { fullName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
