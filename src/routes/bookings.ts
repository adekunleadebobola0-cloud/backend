import { Router } from 'express';
import { BookingStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create booking
router.post('/', authenticate, async (req, res) => {
  const { handymanId, serviceId, address, description, dateTime, couponCode } = req.body;
  try {
    const handyman = await prisma.handymanProfile.findUnique({ where: { id: handymanId } });
    if (!handyman) return res.status(404).json({ error: 'Handyman not found' });

    let subtotal = handyman.hourlyRate * 2; // Assuming 2 hrs estimated
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') subtotal -= (subtotal * coupon.value / 100);
        else subtotal -= coupon.value;
      }
    }

    const tax = subtotal * 0.1;
    const totalAmount = subtotal + tax;

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user!.id,
        handymanId,
        serviceId,
        address,
        description,
        dateTime: new Date(dateTime),
        subtotal,
        tax,
        totalAmount,
        couponCode
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: handyman.userId,
        type: 'BOOKING',
        title: 'New Booking Request',
        body: `You have a new request at ${address}.`
      }
    });

    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List bookings
router.get('/', authenticate, async (req, res) => {
  const role = req.query.role || 'customer';
  try {
    const bookings = await prisma.booking.findMany({
      where: role === 'handyman'
        ? { handyman: { userId: req.user!.id } }
        : { customerId: req.user!.id },
      include: {
        customer: true,
        handyman: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get booking details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id as string },
      include: { customer: true, handyman: { include: { user: true } } }
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update status
router.put('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id as string },
      data: { status: status as BookingStatus }
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        type: 'BOOKING',
        title: 'Booking Update',
        body: `Your booking status is now ${status}.`
      }
    });

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
