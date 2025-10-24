import {
  Prisma,
  PrismaClient,
  VerificationCode as PrismaVerificationCode,
  VerificationCodeType as PrismaVerificationCodeType,
} from "@prisma/client";
import type {
  VerificationCodeKind,
  VerificationCodeRecord,
  VerificationCodeRepository as CoreVerificationCodeRepository,
} from "@brisa/core";

const KIND_TO_PRISMA: Record<VerificationCodeKind, PrismaVerificationCodeType> =
  {
    register: "REGISTER",
    "reset-password": "RESET_PASSWORD",
  };

const PRISMA_TO_KIND: Record<PrismaVerificationCodeType, VerificationCodeKind> =
  {
    REGISTER: "register",
    RESET_PASSWORD: "reset-password",
  };

function toRecord(model: PrismaVerificationCode): VerificationCodeRecord {
  return {
    id: model.id,
    email: model.email,
    code: model.code,
    kind: PRISMA_TO_KIND[model.type],
    metadata: (model.metadata as Record<string, unknown> | null) ?? null,
    expiresAt: model.expiresAt,
    consumedAt: model.consumedAt,
    createdAt: model.createdAt,
  } satisfies VerificationCodeRecord;
}

export class VerificationCodeRepository
  implements CoreVerificationCodeRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async deleteByEmailKind(
    email: string,
    kind: VerificationCodeKind,
  ): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        type: KIND_TO_PRISMA[kind],
        consumedAt: null,
      },
    });
  }

  async create(input: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
    expiresAt: Date;
    metadata?: Record<string, unknown> | null;
  }): Promise<VerificationCodeRecord> {
    const created = await this.prisma.verificationCode.create({
      data: {
        email: input.email,
        code: input.code,
        type: KIND_TO_PRISMA[input.kind],
        metadata:
          input.metadata === null
            ? Prisma.DbNull
            : (input.metadata as Prisma.InputJsonValue | undefined),
        expiresAt: input.expiresAt,
      },
    });

    return toRecord(created);
  }

  async findActive(params: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null> {
    const found = await this.prisma.verificationCode.findFirst({
      where: {
        email: params.email,
        code: params.code,
        type: KIND_TO_PRISMA[params.kind],
        consumedAt: null,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return found ? toRecord(found) : null;
  }

  async findLatest(params: {
    email: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null> {
    const found = await this.prisma.verificationCode.findFirst({
      where: {
        email: params.email,
        type: KIND_TO_PRISMA[params.kind],
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return found ? toRecord(found) : null;
  }

  async markConsumed(id: string): Promise<void> {
    await this.prisma.verificationCode.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
