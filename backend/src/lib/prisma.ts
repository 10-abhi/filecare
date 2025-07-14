import { PrismaClient } from "../../generated/prisma"
// If you get a module not found error, try using:
// import { PrismaClient } from "../../generated/prisma"
// or adjust the path based on your project structure.
// The best practice is to import from the root, not relative to dist.
// For most setups, this works:
// import { PrismaClient } from "../../generated/prisma"

const globalForPrisma = global as unknown as { prismaDB: PrismaClient }
export const prismaDB = globalForPrisma.prismaDB || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaDB = prismaDB