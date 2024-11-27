import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "development") {
  if (!(global as any).prisma) {
    prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
} else {
  prisma = new PrismaClient();
}

export { prisma };
