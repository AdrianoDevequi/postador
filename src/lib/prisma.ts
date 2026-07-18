import { PrismaClient } from "@prisma/client";

/**
 * Caps the pool so a shared MySQL host with a low `max_user_connections`
 * isn't exhausted by concurrent serverless invocations (Prisma P2037).
 */
function databaseUrl(): string | undefined {
    const url = process.env.DATABASE_URL;
    if (!url || url.includes("connection_limit")) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}connection_limit=3&pool_timeout=20`;
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"],
        datasources: { db: { url: databaseUrl() } },
    });

// Reuse across warm invocations in every environment (fewer connections).
globalForPrisma.prisma = prisma;
