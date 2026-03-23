/**
 * Prisma client singleton.
 * Only instantiated when Organization mode is active (DATABASE_URL is set).
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Check if Organization mode is configured (DATABASE_URL exists) */
export function isOrgMode(): boolean {
  return !!process.env.DATABASE_URL;
}
