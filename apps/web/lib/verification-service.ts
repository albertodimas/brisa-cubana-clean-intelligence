import type {
  PublicAuthUser,
  RegisterResult,
  RequestPasswordResetResult,
  ResendVerificationResult,
  ResetPasswordResult,
  VerificationSummary,
  VerifyRegistrationResult,
} from "@brisa/core";
import { API_URL } from "./api";

interface ApiUserPayload {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiVerificationPayload {
  expiresAt: string;
  code?: string;
}

interface ApiRegisterSuccess {
  data: {
    user: ApiUserPayload;
    verification: ApiVerificationPayload;
  };
  message?: string;
}

interface ApiGenericMessage {
  message?: string;
  data?: unknown;
  error?: string;
}

type RegisterAccountPayload = {
  email: string;
  password: string;
  fullName?: string;
  role?: "CLIENT" | "COORDINATOR";
};

function isApiUserPayload(value: unknown): value is ApiUserPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiUserPayload>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.isActive === "boolean"
  );
}

function isVerificationPayload(
  value: unknown,
): value is ApiVerificationPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiVerificationPayload>;
  return typeof candidate.expiresAt === "string";
}

function deserializeUser(input: ApiUserPayload): PublicAuthUser {
  return {
    id: input.id,
    email: input.email,
    fullName: input.fullName,
    role: input.role as PublicAuthUser["role"],
    isActive: input.isActive,
    createdAt: new Date(input.createdAt),
    updatedAt: new Date(input.updatedAt),
  };
}

function toVerificationSummary(
  payload?: ApiVerificationPayload,
): VerificationSummary | undefined {
  if (!payload) {
    return undefined;
  }
  return {
    code: payload.code,
    expiresAt: new Date(payload.expiresAt),
  };
}

async function postJson(
  path: string,
  payload: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    credentials: "include",
  });
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function registerAccount(
  payload: RegisterAccountPayload,
): Promise<RegisterResult> {
  const res = await postJson("/api/authentication/register", payload);
  const body = await parseJson<ApiRegisterSuccess & ApiGenericMessage>(res);

  if (res.status === 201 && body?.data?.user && body.data.verification) {
    return {
      status: "pending-verification",
      user: deserializeUser(body.data.user),
      verification: toVerificationSummary(body.data.verification)!,
    } as RegisterResult;
  }

  if (res.status === 409 && body) {
    if (isApiUserPayload(body.data)) {
      return {
        status: "already-active",
        user: deserializeUser(body.data),
      };
    }
    return { status: "email-taken" };
  }

  return { status: "email-taken" };
}

export async function verifyRegistrationCode(params: {
  email: string;
  code: string;
}): Promise<VerifyRegistrationResult> {
  const res = await postJson("/api/authentication/register/verify", params);
  const body = await parseJson<ApiGenericMessage & { data?: ApiUserPayload }>(
    res,
  );

  if (res.status === 200 && body?.data) {
    const message = body.message?.toLowerCase() ?? "";
    return {
      status: message.includes("already") ? "already-active" : "verified",
      user: deserializeUser(body.data),
    };
  }

  if (res.status === 410) {
    return { status: "expired-code" };
  }

  return { status: "invalid-code" };
}

export async function resendRegistrationCode(params: {
  email: string;
}): Promise<ResendVerificationResult> {
  const res = await postJson("/api/authentication/register/resend", params);
  const body = await parseJson<
    ApiGenericMessage & { data?: ApiUserPayload | ApiVerificationPayload }
  >(res);

  if (res.status === 200 && body) {
    const message = body.message?.toLowerCase() ?? "";
    if (message.includes("already verified") && isApiUserPayload(body.data)) {
      return {
        status: "already-active",
        user: deserializeUser(body.data),
      };
    }

    const verification = isVerificationPayload(body.data)
      ? toVerificationSummary(body.data)
      : undefined;

    return {
      status: "sent",
      verification,
    };
  }

  if (res.status === 400) {
    return { status: "sent" };
  }

  return { status: "sent" };
}

export async function requestPasswordReset(params: {
  email: string;
}): Promise<RequestPasswordResetResult> {
  const res = await postJson("/api/authentication/forgot-password", params);
  const body = await parseJson<
    ApiGenericMessage & { data?: ApiVerificationPayload }
  >(res);

  const verification = body?.data
    ? toVerificationSummary(body.data)
    : undefined;

  return {
    status: "sent",
    verification,
  };
}

export async function resetPassword(params: {
  email: string;
  code: string;
  password: string;
}): Promise<ResetPasswordResult> {
  const res = await postJson("/api/authentication/reset-password", params);
  const body = await parseJson<ApiGenericMessage & { data?: ApiUserPayload }>(
    res,
  );

  if (res.status === 200 && body?.data) {
    return {
      status: "reset",
      user: deserializeUser(body.data),
    };
  }

  if (res.status === 410) {
    return { status: "expired-code" };
  }

  if (res.status === 404) {
    return { status: "not-found" };
  }

  return { status: "invalid-code" };
}
