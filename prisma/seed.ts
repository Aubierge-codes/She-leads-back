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

const DEFAULT_DEV_PASSWORD = 'ChangeMe123!';

// Runs on every deploy (postdeploy), so it must never overwrite a password the
// organization has since changed in the dashboard. The password is only set
// when creating the admin, or when SEED_ADMIN_PASSWORD is explicitly provided
// (the supported way to reset a forgotten admin password).
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@ecogirlscollective.org';
  const explicitPassword = process.env.SEED_ADMIN_PASSWORD;
  const isProduction = process.env.NODE_ENV === 'production';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (explicitPassword) {
      await prisma.user.update({
        where: { email },
        data: {
          password: await bcrypt.hash(explicitPassword, 10),
          role: Role.ADMIN,
          isActive: true,
          deletedAt: null,
        },
      });
      console.log(`Admin password reset from SEED_ADMIN_PASSWORD: ${email}`);
    } else {
      console.log(`Admin already exists, password left unchanged: ${email}`);
    }
    return;
  }

  if (!explicitPassword && isProduction) {
    throw new Error(
      'SEED_ADMIN_PASSWORD must be set to create the first admin in production.',
    );
  }

  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(explicitPassword ?? DEFAULT_DEV_PASSWORD, 10),
      name: 'Default Admin',
      role: Role.ADMIN,
    },
  });

  if (explicitPassword) {
    console.log(`Admin user created: ${email}`);
  } else {
    console.warn(
      `Admin user created with the default dev password (${DEFAULT_DEV_PASSWORD}): ${email}. Change it after first login.`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
