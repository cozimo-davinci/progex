import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient();
};

type GlobalWithPrisma = typeof globalThis & {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

// Export the Prisma client, reusing it in production, creating new in dev
export const prisma = (globalThis as GlobalWithPrisma).prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') (globalThis as GlobalWithPrisma).prisma = prisma;
