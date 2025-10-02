export interface FakeTokenPayload {
  sub: string;
  email: string;
  role: string;
}

const FAKE_TOKEN_PREFIX = "fake.";
const FAKE_FLAG_ENV_KEYS = [
  "DYLD_USE_FAKE_API_DATA",
  "USE_FAKE_API_DATA",
  "NEXT_PUBLIC_USE_FAKE_API_DATA",
] as const;

function readFakeFlagFromEnv(): boolean {
  const env = globalThis.process?.env;
  if (!env) {
    return false;
  }

  return FAKE_FLAG_ENV_KEYS.some((key) => env[key] === "1");
}

export function isFakeDataEnabled(): boolean {
  if (readFakeFlagFromEnv()) {
    return true;
  }

  const globalFallback =
    typeof globalThis !== "undefined" &&
    (globalThis as unknown as { __USE_FAKE_API_DATA__?: boolean })
      .__USE_FAKE_API_DATA__;

  return Boolean(globalFallback);
}

export function encodeFakeToken(payload: FakeTokenPayload): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  return `${FAKE_TOKEN_PREFIX}${encoded}`;
}

interface DemoUser {
  password: string;
  role: string;
  name: string;
}

const DEMO_USERS: Record<string, DemoUser> = {
  "admin@brisacubanaclean.com": {
    password: "Admin123!",
    role: "ADMIN",
    name: "Admin User",
  },
  "staff@brisacubanaclean.com": {
    password: "Staff123!",
    role: "STAFF",
    name: "Staff Member",
  },
  "client@brisacubanaclean.com": {
    password: "Client123!",
    role: "CLIENT",
    name: "Client Demo",
  },
};

export function findFakeUser(email: string, password: string) {
  const user = DEMO_USERS[email.toLowerCase()];
  if (!user || user.password !== password) {
    return null;
  }

  const id = `fake-${user.role.toLowerCase()}`;
  const token = encodeFakeToken({ sub: id, email, role: user.role });

  return {
    id,
    email,
    name: user.name,
    role: user.role,
    token,
  };
}

export function tryDecodeFakeToken(token: string): FakeTokenPayload | null {
  if (!token.startsWith(FAKE_TOKEN_PREFIX)) {
    return null;
  }
  try {
    const encoded = token.slice(FAKE_TOKEN_PREFIX.length);
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as FakeTokenPayload;
    if (parsed?.sub && parsed?.email && parsed?.role) {
      return parsed;
    }
  } catch (error) {
    console.warn("[auth] failed to decode fake token", error);
  }
  return null;
}

export const FAKE_TOKEN_PREFIX_CONST = FAKE_TOKEN_PREFIX;
