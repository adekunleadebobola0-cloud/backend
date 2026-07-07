import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId: req.user!.id,
        handymanId: booking.handymanId,
        rating,
        comment
      }
    });

    // Update handyman average rating
    const allReviews = await prisma.review.findMany({ where: { handymanId: booking.handymanId } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await prisma.handymanProfile.update({
      where: { id: booking.handymanId },
      data: { averageRating: avgRating, totalReviews: allReviews.length }
    });

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
