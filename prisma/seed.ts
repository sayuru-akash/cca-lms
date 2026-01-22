import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Create Prisma client with direct connection for seeding
const seedPrisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  }),
});

// Create a direct PostgreSQL connection for RLS setup
const pool = new Pool({
  connectionString: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
});

async function enableRLS() {
  console.log('🔒 Enabling Row-Level Security...');
  
  try {
    const rlsSQL = readFileSync(
      join(__dirname, 'migrations', 'enable_rls.sql'),
      'utf-8'
    );
    
    await pool.query(rlsSQL);
    console.log('✅ RLS enabled successfully!');
  } catch (error) {
    console.error('❌ Error enabling RLS:', error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Seeding database...');

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

  console.log('✅ Seeding complete!');
  
  // Enable RLS after seeding
  await enableRLS();
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await seedPrisma.$disconnect();
    await pool.end();
  });
