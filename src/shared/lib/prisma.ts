import { PrismaClient, Prisma } from '../../generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const log: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'development' ? ['query'] : []

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
