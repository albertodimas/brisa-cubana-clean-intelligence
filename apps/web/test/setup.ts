import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const mockedAuth = vi.fn().mockResolvedValue(null);
const mockedSignIn = vi.fn();
const mockedSignOut = vi.fn();
const mockedHandlers = { GET: vi.fn(), POST: vi.fn() };

vi.mock("next-auth", () => {
  class MockAuthError extends Error {
    type: string;
    constructor(type = "CredentialsSignin") {
      super(type);
      this.type = type;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }

  const NextAuth = vi.fn(() => ({
    auth: mockedAuth,
    signIn: mockedSignIn,
    signOut: mockedSignOut,
    handlers: mockedHandlers,
  }));

  return {
    __esModule: true,
    default: NextAuth,
    AuthError: MockAuthError,
  };
});

vi.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: vi.fn((config) => config),
}));

vi.mock("@/auth", () => ({
  auth: mockedAuth,
  signIn: mockedSignIn,
  signOut: mockedSignOut,
  GET: mockedHandlers.GET,
  POST: mockedHandlers.POST,
}));

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
}));
