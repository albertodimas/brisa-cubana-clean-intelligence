import type { PrismaClient } from "@prisma/client";

export type MagicLinkTokenCreateInput = {
  email: string;
  tokenHash: string;
  expiresAt: Date;
};

export class MagicLinkTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: MagicLinkTokenCreateInput) {
    return this.prisma.magicLinkToken.create({
      data,
    });
  }

  async findValidByHash(tokenHash: string) {
    return this.prisma.magicLinkToken.findFirst({
      where: {
        tokenHash,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async consume(id: string) {
    return this.prisma.magicLinkToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async invalidateExpiredForEmail(email: string) {
    await this.prisma.magicLinkToken.updateMany({
      where: {
        email,
        consumedAt: null,
        expiresAt: { lt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
  }
}
