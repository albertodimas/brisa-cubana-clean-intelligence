import type {
  Clock,
  VerificationCodeGenerator,
  VerificationCodeKind,
  VerificationCodeRepository,
  VerificationConsumeResult,
  VerificationIssueResult,
  VerificationService,
  VerificationVerifyResult,
} from "./types.js";

const DEFAULT_TTL_MINUTES = 15;

const defaultGenerator: VerificationCodeGenerator = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return String(random);
};

const defaultClock: Clock = () => new Date();

export interface VerificationServiceOptions {
  repository: VerificationCodeRepository;
  codeGenerator?: VerificationCodeGenerator;
  clock?: Clock;
  defaultTtlMinutes?: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function resolveTtl(inputTtl: number | undefined, fallbackTtl: number): number {
  if (
    typeof inputTtl === "number" &&
    Number.isFinite(inputTtl) &&
    inputTtl > 0
  ) {
    return inputTtl;
  }
  if (Number.isFinite(fallbackTtl) && fallbackTtl > 0) {
    return fallbackTtl;
  }
  return DEFAULT_TTL_MINUTES;
}

export function createVerificationService(
  options: VerificationServiceOptions,
): VerificationService {
  const {
    repository,
    codeGenerator = defaultGenerator,
    clock = defaultClock,
    defaultTtlMinutes = DEFAULT_TTL_MINUTES,
  } = options;

  async function generate(input: {
    email: string;
    kind: VerificationCodeKind;
    ttlMinutes?: number;
    metadata?: Record<string, unknown> | null;
  }): Promise<VerificationIssueResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const ttlMinutes = resolveTtl(input.ttlMinutes, defaultTtlMinutes);
    const issuedAt = clock();
    const expiresAt = new Date(issuedAt.getTime() + ttlMinutes * 60 * 1000);
    const code = codeGenerator();

    await repository.deleteByEmailKind(normalizedEmail, input.kind);

    const record = await repository.create({
      email: normalizedEmail,
      code,
      kind: input.kind,
      expiresAt,
      metadata: input.metadata,
    });

    return { status: "issued", record };
  }

  async function verify(input: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
    consume?: boolean;
  }): Promise<VerificationVerifyResult> {
    const normalizedEmail = normalizeEmail(input.email);
    const record = await repository.findActive({
      email: normalizedEmail,
      code: input.code,
      kind: input.kind,
    });

    if (!record) {
      return { status: "not_found" };
    }

    const now = clock();
    if (record.expiresAt.getTime() <= now.getTime()) {
      return { status: "expired", record };
    }

    if (input.consume) {
      await repository.markConsumed(record.id);
      return {
        status: "verified",
        record: { ...record, consumedAt: now },
      };
    }

    return { status: "verified", record };
  }

  async function consume(input: {
    email: string;
    code: string;
    kind: VerificationCodeKind;
  }): Promise<VerificationConsumeResult> {
    const result = await verify({ ...input, consume: true });
    if (result.status === "verified") {
      return { status: "consumed", record: result.record };
    }

    if (result.status === "expired") {
      return { status: "expired", record: result.record };
    }

    return { status: "not_found" };
  }

  async function getLatest(input: {
    email: string;
    kind: VerificationCodeKind;
  }) {
    const normalizedEmail = normalizeEmail(input.email);
    return repository.findLatest({
      email: normalizedEmail,
      kind: input.kind,
    });
  }

  return {
    generate,
    verify,
    consume,
    getLatest,
  } satisfies VerificationService;
}
