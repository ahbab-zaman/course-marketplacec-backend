import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hashValue } from "../src/utils/hash";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SeedUser {
  name: string;
  email: string;
  password: string;
  role: Role;
}

function loadSeedUsers(): SeedUser[] {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPass = process.env.SEED_ADMIN_PASSWORD;
  const instructorEmail = process.env.SEED_INSTRUCTOR_EMAIL;
  const instructorPass = process.env.SEED_INSTRUCTOR_PASSWORD;

  if (!adminEmail || !adminPass || !instructorEmail || !instructorPass) {
    throw new Error(
      "[Seed] Missing required seed credentials in environment variables.",
    );
  }

  return [
    {
      name: "Admin",
      email: adminEmail,
      password: adminPass,
      role: Role.ADMIN,
    },
    {
      name: "Instructor",
      email: instructorEmail,
      password: instructorPass,
      role: Role.INSTRUCTOR,
    },
  ];
}

const log = {
  info: (msg: string) => console.log(`[seed] ${msg}`),
  success: (msg: string) => console.log(`[seed] ${msg}`),
  skip: (msg: string) => console.log(`[seed] ${msg}`),
  error: (msg: string) => console.error(`[seed] ${msg}`),
  banner: (msg: string) => console.log(`\n${"=".repeat(50)}\n${msg}\n${"=".repeat(50)}`),
};

export async function runSeeder(): Promise<void> {
  log.banner("Course Marketplace Backend Database Seeder");

  try {
    const users = loadSeedUsers();
    await prisma.$connect();
    log.info("Connected to database");

    for (const user of users) {
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, email: true, role: true },
      });

      if (existing) {
        const hashedPassword = await hashValue(user.password);

        await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: user.name,
            password: hashedPassword,
            role: user.role,
            provider: "LOCAL",
            isEmailVerified: true,
          },
        });

        const existingAccount = await prisma.account.findFirst({
          where: {
            userId: existing.id,
            providerId: "credential",
          },
          select: { id: true },
        });

        if (existingAccount) {
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              accountId: existing.id,
              providerId: "credential",
              password: hashedPassword,
            },
          });
        } else {
          await prisma.account.create({
            data: {
              userId: existing.id,
              accountId: existing.id,
              providerId: "credential",
              password: hashedPassword,
            },
          });
        }

        log.success(`Synced ${user.role} auth account -> ${user.email}`);
        continue;
      }

      const hashedPassword = await hashValue(user.password);

      const created = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            provider: "LOCAL",
            isEmailVerified: true,
          },
          select: { id: true, email: true, role: true },
        });

        await tx.account.create({
          data: {
            userId: createdUser.id,
            accountId: createdUser.id,
            providerId: "credential",
            password: hashedPassword,
          },
        });

        return createdUser;
      });

      log.success(`Created ${created.role} -> ${created.email}`);
    }

    log.banner("Seeding complete");
  } catch (err) {
    log.error(
      `Seeding failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    throw err;
  } finally {
    await prisma.$disconnect();
    log.info("Disconnected from database");
  }
}

if (import.meta.url.endsWith("seed.ts")) {
  runSeeder().catch(() => process.exit(1));
}
