import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const email =
    process.env.SEED_ADMIN_EMAIL ?? 'admin@ecogirlscollective.org';

  const password =
    process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: Role.ADMIN,
    },
    create: {
      email,
      password: hashed,
      name: 'Default Admin',
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });