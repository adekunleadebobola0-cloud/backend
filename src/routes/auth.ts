import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role, category, address } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        address,
        passwordHash,
        role: role || 'CUSTOMER',
      },
    });

    if (user.role === 'HANDYMAN') {
      if (!category) {
        return res.status(400).json({ error: 'Category is required for Handyman' });
      }
      await prisma.handymanProfile.create({
        data: {
          userId: user.id,
          category,
          description: '',
          experienceYears: 0,
          hourlyRate: 0,
          location: address || '',
          isVerified: false,
          gallery: [],
        },
      });
    }

    const { token, refreshToken } = generateTokens(user.id, user.role);

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({ token, refreshToken, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { token, refreshToken } = generateTokens(user.id, user.role);

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({ token, refreshToken, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded: any = verifyRefreshToken(refreshToken);
    const { token } = generateTokens(decoded.userId, decoded.role);

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;
