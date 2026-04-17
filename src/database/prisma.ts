// import { PrismaClient } from "@prisma/client";
// import 'dotenv/config';

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// import { PrismaPg } from '@prisma/adapter-pg'

// const connectionString = `${process.env.DATABASE_URL}`

// const adapter = new PrismaPg({ connectionString })
// const prisma = new PrismaClient({ adapter })

// export { prisma }

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
