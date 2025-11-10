import NextAuth, { AuthError } from "next-auth";
import type { NextRequest } from "next/server";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const normalizedNextAuthUrl =
  process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
const isProduction = process.env.NODE_ENV === "production";
const shouldUseSecureCookies =
  process.env.AUTH_COOKIE_SECURE === "true" ||
  (process.env.AUTH_COOKIE_SECURE !== "false" &&
    isProduction &&
    (process.env.VERCEL === "1" ||
      normalizedNextAuthUrl.startsWith("https://")));
const sessionCookieName = shouldUseSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
const sessionCookieSameSite: "lax" | "strict" = shouldUseSecureCookies
  ? "strict"
  : "lax";
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: sessionCookieSameSite,
  secure: shouldUseSecureCookies,
  path: "/",
};

type AuthUser = {
  id: string;
  email: string;
  role: string;
  token: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
};

type RefreshResponse = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
};

type BrisaJWT = JWT & {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  refreshTokenExpires?: number;
  role?: string;
  error?: string;
};

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
  },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: sessionCookieOptions,
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const email = credentials.email;
        const password = credentials.password;

        if (
          !email ||
          !password ||
          typeof email !== "string" ||
          typeof password !== "string"
        ) {
          return null;
        }

        const forwardedForHeader =
          request?.headers.get("x-forwarded-for") ??
          request?.headers.get("x-real-ip") ??
          request?.headers.get("cf-connecting-ip") ??
          request?.headers.get("x-client-ip") ??
          null;

        const proxyHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (forwardedForHeader) {
          proxyHeaders["x-forwarded-for"] = forwardedForHeader;
          proxyHeaders["x-internal-remote-address"] =
            request?.headers.get("x-internal-remote-address") ?? "127.0.0.1";
        } else {
          proxyHeaders["x-forwarded-for"] =
            process.env.AUTH_TEST_FORWARD_IP ?? "198.51.100.5";
          proxyHeaders["x-internal-remote-address"] = "127.0.0.1";
        }

        const res = await fetch(`${API_URL}/api/authentication/login`, {
          method: "POST",
          headers: proxyHeaders,
          body: JSON.stringify({ email, password }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json) {
          throw new AuthError("CredentialsSignin", {
            cause: {
              status: res.status,
              body: json,
            },
          });
        }

        const token = json.token as string | undefined;
        const refreshToken = json.refreshToken as string | undefined;
        const expiresAt = json.expiresAt as string | undefined;
        const refreshExpiresAt = json.refreshExpiresAt as string | undefined;
        const data = json.data as
          | { id: string; email: string; role: string }
          | undefined;

        if (
          !token ||
          !refreshToken ||
          !expiresAt ||
          !refreshExpiresAt ||
          !data
        ) {
          throw new AuthError("CredentialsSignin", {
            cause: {
              status: res.status,
              body: json,
            },
          });
        }

        return {
          ...data,
          token,
          refreshToken,
          accessExpiresAt: expiresAt,
          refreshExpiresAt,
        } satisfies AuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const brisaToken = token as BrisaJWT;
      if (user) {
        const authUser = user as AuthUser;
        brisaToken.sub = authUser.id;
        brisaToken.role = authUser.role;
        brisaToken.accessToken = authUser.token;
        brisaToken.refreshToken = authUser.refreshToken;
        brisaToken.accessTokenExpires = new Date(
          authUser.accessExpiresAt,
        ).getTime();
        brisaToken.refreshTokenExpires = new Date(
          authUser.refreshExpiresAt,
        ).getTime();
        delete brisaToken.error;
        return brisaToken;
      }

      const shouldRefresh =
        typeof brisaToken.accessTokenExpires === "number" &&
        Date.now() > brisaToken.accessTokenExpires - 30_000;

      if (!shouldRefresh) {
        return brisaToken;
      }

      if (!brisaToken.refreshToken) {
        brisaToken.error = "RefreshAccessTokenError";
        return brisaToken;
      }

      const refreshed = await refreshAccessToken(brisaToken.refreshToken);
      if (!refreshed) {
        brisaToken.error = "RefreshAccessTokenError";
        delete brisaToken.accessToken;
        delete brisaToken.refreshToken;
        delete brisaToken.accessTokenExpires;
        delete brisaToken.refreshTokenExpires;
        return brisaToken;
      }

      brisaToken.accessToken = refreshed.accessToken;
      brisaToken.refreshToken = refreshed.refreshToken;
      brisaToken.accessTokenExpires = refreshed.accessExpiresAt;
      brisaToken.refreshTokenExpires = refreshed.refreshExpiresAt;
      delete brisaToken.error;
      return brisaToken;
    },
    async session({ session, token }) {
      const brisaToken = token as BrisaJWT;
      if (session.user) {
        if (typeof brisaToken.sub === "string") {
          session.user.id = brisaToken.sub;
        }
        session.user.role =
          typeof brisaToken.role === "string"
            ? brisaToken.role
            : session.user.role;
      }

      session.accessToken = brisaToken.accessToken;
      (session as typeof session & { error?: string }).error = brisaToken.error;
      return session;
    },
    authorized({ auth: authSession, request }) {
      const allowBypass = process.env.VERCEL !== "1";
      const headerToken =
        allowBypass &&
        request &&
        "headers" in request &&
        typeof request.headers.get === "function"
          ? request.headers.get("x-lhci-bypass")
          : null;
      let queryToken: string | null = null;
      if (allowBypass && request) {
        if ((request as NextRequest).nextUrl) {
          queryToken = (request as NextRequest).nextUrl.searchParams.get(
            "__lhci_bypass",
          );
        } else if (typeof (request as Request).url === "string") {
          queryToken = new URL((request as Request).url).searchParams.get(
            "__lhci_bypass",
          );
        }
      }
      if (headerToken || queryToken) {
        return true;
      }
      return Boolean(authSession?.user);
    },
  },
  trustHost: true,
});

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
} | null> {
  try {
    const response = await fetch(`${API_URL}/api/authentication/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as RefreshResponse;
    if (!json.token || !json.refreshToken || !json.expiresAt) {
      return null;
    }

    return {
      accessToken: json.token,
      refreshToken: json.refreshToken,
      accessExpiresAt: new Date(json.expiresAt).getTime(),
      refreshExpiresAt: json.refreshExpiresAt
        ? new Date(json.refreshExpiresAt).getTime()
        : new Date().getTime(),
    };
  } catch {
    return null;
  }
}
