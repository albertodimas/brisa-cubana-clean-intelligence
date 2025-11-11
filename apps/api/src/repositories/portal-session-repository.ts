import type { PrismaClient, PortalSession } from "@prisma/client";

export type PortalSessionCreateInput = {
  email: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

export class PortalSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: PortalSessionCreateInput): Promise<PortalSession> {
    return this.prisma.portalSession.create({ data });
  }

  findValidByTokenHash(tokenHash: string): Promise<PortalSession | null> {
    return this.prisma.portalSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revokeById(id: string, reason?: string): Promise<void> {
    await this.prisma.portalSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revocationReason: reason ?? null,
      },
    });
  }

  async revokeByTokenHash(tokenHash: string, reason?: string): Promise<void> {
    await this.prisma.portalSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revocationReason: reason ?? null,
      },
    });
  }

  async revokeAllForEmail(email: string, reason?: string): Promise<void> {
    await this.prisma.portalSession.updateMany({
      where: { email, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revocationReason: reason ?? "manual-revocation",
      },
    });
  }
}
