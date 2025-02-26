import { PrismaClient } from '@prisma/client';

// Singleton pattern to reuse the Prisma client across requests
const prismaClientSingleton = () => {
    return new PrismaClient();
};

// Extend the globalThis interface to include the prisma property
declare global {
    interface GlobalThis {
        prisma?: ReturnType<typeof prismaClientSingleton>;
    }
}

// Export the Prisma client, reusing it in production, creating new in dev
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;