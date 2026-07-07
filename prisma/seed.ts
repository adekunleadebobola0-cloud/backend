import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  const users = [
    { id: 'cust1', email: 'modupe.j@email.com', role: 'CUSTOMER' as const, fullName: 'Modupe Jackson', phone: '08012345678', address: '28 Adekunle Street, VI, Lagos' },
    { id: 'cust2', email: 'babajide.m@email.com', role: 'CUSTOMER' as const, fullName: 'Babajide Michael', phone: '08023456789', address: '15 Lekki Phase 1, Lagos' },
    { id: 'cust3', email: 'amaka.d@email.com', role: 'CUSTOMER' as const, fullName: 'Amaka David', phone: '08034567890', address: '7 Yakubu Gowon Crescent, Garki, Abuja' },
    { id: 'hm1', email: 'ade.electric@works.com', role: 'HANDYMAN' as const, fullName: 'Ade Electric Works', phone: '08045678901', address: 'Ikeja, Lagos' },
    { id: 'hm2', email: 'john.plumbing@services.com', role: 'HANDYMAN' as const, fullName: 'John Plumbing Services', phone: '08056789012', address: 'Surulere, Lagos' },
    { id: 'admin1', email: 'admin@handyhub.com', role: 'ADMIN' as const, fullName: 'Super Admin', phone: '08000000000', address: 'HQ' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash }
    });
  }

  // Handyman Profiles
  await prisma.handymanProfile.upsert({
    where: { userId: 'hm1' },
    update: {},
    create: {
      id: 'hp1', userId: 'hm1', category: 'ELECTRICAL_WORKS', description: 'Expert in wiring, lighting, and appliance repairs.',
      experienceYears: 8, hourlyRate: 4000, location: 'Lagos, Nigeria', isVerified: true, averageRating: 4.7, totalReviews: 1905, totalCustomers: 1200
    }
  });

  await prisma.handymanProfile.upsert({
    where: { userId: 'hm2' },
    update: {},
    create: {
      id: 'hp2', userId: 'hm2', category: 'PLUMBING', description: 'Specializing in installations, repairs, and maintenance.',
      experienceYears: 8, hourlyRate: 8000, location: 'Lagos, Nigeria', isVerified: true, averageRating: 4.9, totalReviews: 150, totalCustomers: 100
    }
  });

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { id: 'c1', code: 'WELCOME10', discountType: 'PERCENTAGE', value: 10, expiresAt: new Date('2026-12-31T23:59:59Z') }
  });
  await prisma.coupon.upsert({
    where: { code: 'SAVE500' },
    update: {},
    create: { id: 'c2', code: 'SAVE500', discountType: 'FIXED', value: 500, expiresAt: new Date('2026-08-01T23:59:59Z') }
  });

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
  });
