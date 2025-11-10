import type { PrismaClient, UserSession } from "@prisma/client";

export type UserSessionCreateInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export class UserSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: UserSessionCreateInput): Promise<UserSession> {
    return this.prisma.userSession.create({ data });
  }

  findValidByTokenHash(tokenHash: string): Promise<UserSession | null> {
    return this.prisma.userSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeById(id: string, reason?: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revocationReason: reason ?? null,
      },
    });
  }

  async revokeByTokenHash(tokenHash: string, reason?: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revocationReason: reason ?? null,
      },
    });
  }

  async revokeAllForUser(userId: string, reason?: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revocationReason: reason ?? "manual-revocation",
      },
    });
  }
}
