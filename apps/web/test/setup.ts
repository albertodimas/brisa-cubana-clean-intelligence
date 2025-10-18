import "@testing-library/jest-dom/vitest";
import { createElement, type MouseEvent, type ReactNode } from "react";
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

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    href,
    ...rest
  }: {
    children: ReactNode;
    onClick?: (event: MouseEvent) => void;
    href?: string;
  } & Record<string, any>) =>
    createElement(
      "a",
      {
        href: typeof href === "string" ? href : "#",
        onClick: (event: MouseEvent) => {
          if (typeof onClick === "function") {
            onClick(event);
          }
          if (!event.defaultPrevented) {
            event.preventDefault();
          }
        },
        ...rest,
      },
      children,
    ),
}));
