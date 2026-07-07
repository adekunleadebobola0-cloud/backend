import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        handymanProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { fullName, phone, address } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { fullName, phone, address },
      include: {
        handymanProfile: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
