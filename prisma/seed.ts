import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Create Prisma client with direct connection for seeding
const seedPrisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await seedPrisma.user.upsert({
    where: { email: 'admin@codezela.com' },
    update: {},
    create: {
      email: 'admin@codezela.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });
  console.log('Created admin user:', admin.email);

  // Create lecturer user
  const lecturerPassword = await bcrypt.hash('Lecturer123!', 10);
  const lecturer = await seedPrisma.user.upsert({
    where: { email: 'lecturer@codezela.com' },
    update: {},
    create: {
      email: 'lecturer@codezela.com',
      name: 'Lecturer User',
      password: lecturerPassword,
      role: 'LECTURER',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });
  console.log('Created lecturer user:', lecturer.email);

  // Create student user
  const studentPassword = await bcrypt.hash('Student123!', 10);
  const student = await seedPrisma.user.upsert({
    where: { email: 'student@codezela.com' },
    update: {},
    create: {
      email: 'student@codezela.com',
      name: 'Student User',
      password: studentPassword,
      role: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });
  console.log('Created student user:', student.email);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await seedPrisma.$disconnect();
  });
