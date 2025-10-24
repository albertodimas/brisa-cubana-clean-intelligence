import { describe, it, expect, beforeEach } from "vitest";
import { createVerificationService } from "../verification.service.js";
import type {
  VerificationCodeKind,
  VerificationCodeRecord,
  VerificationCodeRepository,
} from "../types.js";

class InMemoryRepository implements VerificationCodeRepository {
  private store: VerificationCodeRecord[] = [];
  private counter = 0;

  async deleteByEmailKind(email: string, kind: VerificationCodeKind) {
    this.store = this.store.filter(
      (item) =>
        !(item.email === email && item.kind === kind && !item.consumedAt),
    );
  }

  async create(record: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
    expiresAt: Date;
    metadata?: Record<string, unknown> | null;
  }): Promise<VerificationCodeRecord> {
    const created: VerificationCodeRecord = {
      id: `vc_${(this.counter += 1)}`,
      email: record.email,
      code: record.code,
      kind: record.kind,
      expiresAt: record.expiresAt,
      metadata: record.metadata,
      consumedAt: null,
      createdAt: new Date(),
    };
    this.store.push(created);
    return created;
  }

  async findActive(params: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null> {
    return (
      this.store.find(
        (item) =>
          item.email === params.email &&
          item.kind === params.kind &&
          item.code === params.code &&
          item.consumedAt === null,
      ) ?? null
    );
  }

  async findLatest(params: {
    email: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationCodeRecord | null> {
    return (
      [...this.store]
        .filter(
          (item) => item.email === params.email && item.kind === params.kind,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
      null
    );
  }

  async markConsumed(id: string): Promise<void> {
    const target = this.store.find((item) => item.id === id);
    if (target) {
      target.consumedAt = new Date();
    }
  }
}

describe("createVerificationService", () => {
  let repository: InMemoryRepository;

  beforeEach(() => {
    repository = new InMemoryRepository();
  });

  it("generates codes and invalidates previous ones", async () => {
    const service = createVerificationService({ repository });
    const first = await service.generate({
      email: "TEST@example.com",
      kind: "register",
    });
    expect(first.record.code).toHaveLength(6);

    const latestBefore = await repository.findLatest({
      email: "test@example.com",
      kind: "register",
    });
    expect(latestBefore?.id).toBe(first.record.id);

    const second = await service.generate({
      email: "test@example.com",
      kind: "register",
    });
    expect(second.record.id).not.toBe(first.record.id);

    const former = await repository.findActive({
      email: "test@example.com",
      kind: "register",
      code: first.record.code,
    });
    expect(former).toBeNull();
  });

  it("returns not_found when code absent", async () => {
    const service = createVerificationService({ repository });
    const result = await service.verify({
      email: "missing@example.com",
      kind: "reset-password",
      code: "000000",
    });
    expect(result.status).toBe("not_found");
  });

  it("identifies expired codes", async () => {
    const service = createVerificationService({
      repository,
      defaultTtlMinutes: 1,
      clock: () => new Date(2025, 0, 1, 10, 0, 0),
    });
    const { record } = await service.generate({
      email: "user@example.com",
      kind: "register",
    });

    const result = await service.verify({
      email: "user@example.com",
      kind: "register",
      code: record.code,
      consume: false,
    });
    expect(result.status).toBe("verified");

    const expired = await service.verify({
      email: "user@example.com",
      kind: "register",
      code: record.code,
      consume: false,
    });
    expect(expired.status).toBe("verified");

    // Advance clock beyond expiry
    const lateService = createVerificationService({
      repository,
      clock: () => new Date(2025, 0, 1, 10, 2, 0),
      defaultTtlMinutes: 1,
    });

    const expiredResult = await lateService.verify({
      email: "user@example.com",
      kind: "register",
      code: record.code,
      consume: false,
    });
    expect(expiredResult.status).toBe("expired");
  });

  it("consumes codes atomically", async () => {
    const service = createVerificationService({ repository });
    const { record } = await service.generate({
      email: "user@example.com",
      kind: "reset-password",
    });

    const consumed = await service.consume({
      email: "user@example.com",
      kind: "reset-password",
      code: record.code,
    });
    expect(consumed.status).toBe("consumed");

    const reused = await service.consume({
      email: "user@example.com",
      kind: "reset-password",
      code: record.code,
    });
    expect(reused.status).toBe("not_found");
  });
});
