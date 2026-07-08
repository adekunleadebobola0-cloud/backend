import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get list of recent messages grouped by user (mock list)
router.get('/', authenticate, async (req, res) => {
  try {
    // In a real app we would use aggregate or distinct, but for demo we just fetch messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }] },
      orderBy: { createdAt: 'desc' }
    });
    
    // Convert DB fields to 'me' if they match the current user, so the frontend UI logic matches
    const mapped = messages.map(m => ({
      ...m,
      senderId: m.senderId === req.user!.id ? 'me' : m.senderId,
      receiverId: m.receiverId === req.user!.id ? 'me' : m.receiverId,
    }));
    res.json({ messages: mapped });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chat with specific user
router.get('/:userId', authenticate, async (req, res) => {
  const userId = req.params.userId as string;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user!.id, receiverId: userId },
          { senderId: userId, receiverId: req.user!.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    const mapped = messages.map(m => ({
      ...m,
      senderId: m.senderId === req.user!.id ? 'me' : m.senderId,
      receiverId: m.receiverId === req.user!.id ? 'me' : m.receiverId,
    }));
    
    // Mark as read
    await prisma.message.updateMany({
      where: { senderId: userId, receiverId: req.user!.id, isRead: false },
      data: { isRead: true }
    });

    res.json({ messages: mapped });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', authenticate, async (req, res) => {
  const { receiverId, content, bookingId } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        content,
        bookingId
      }
    });

    // Notify via Socket.io will be done in the socket handler, but we can also emit here using app.get('io') if needed.
    // For simplicity, we assume polling or socket listeners will just re-fetch or receive the socket event.
    
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
