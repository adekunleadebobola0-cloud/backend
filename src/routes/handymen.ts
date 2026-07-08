import { Router } from 'express';
import { prisma } from "../prisma"

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, location, minRating, maxPrice } = req.query;

    const filters: any = {};

    if (category) filters.category = category;
    if (location) filters.location = { contains: location as string, mode: 'insensitive' };
    if (minRating) filters.averageRating = { gte: parseFloat(minRating as string) };
    if (maxPrice) filters.hourlyRate = { lte: parseFloat(maxPrice as string) };

    const handymen = await prisma.handymanProfile.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    const formattedHandymen = handymen.map((h) => ({
      id: h.id,
      userId: h.userId,
      fullName: h.user.fullName,
      category: h.category,
      averageRating: h.averageRating,
      hourlyRate: h.hourlyRate,
      location: h.location,
      isVerified: h.isVerified,
    }));

    res.json({ handymen: formattedHandymen });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id as string;

    const handyman = await prisma.handymanProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true },
        },
        services: true,
        reviews: true,
      },
    });

    if (!handyman) {
      return res.status(404).json({ error: 'Handyman not found' });
    }

    res.json({
      handyman: {
        id: handyman.id,
        userId: handyman.userId,
        fullName: handyman.user.fullName,
        phone: handyman.user.phone,
        category: handyman.category,
        description: handyman.description,
        experienceYears: handyman.experienceYears,
        hourlyRate: handyman.hourlyRate,
        location: handyman.location,
        isVerified: handyman.isVerified,
        averageRating: handyman.averageRating,
        totalReviews: handyman.totalReviews,
      },
      services: handyman.services,
      workingHours: handyman.workingHours,
      reviews: handyman.reviews,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
