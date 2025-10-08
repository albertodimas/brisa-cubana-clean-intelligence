import NextAuth, { AuthError } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = isProduction
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
const sessionCookieSameSite: "lax" | "strict" = isProduction ? "strict" : "lax";
const sessionCookieOptions = {
  httpOnly: true,
  sameSite: sessionCookieSameSite,
  secure: isProduction,
  path: "/",
};

type AuthUser = {
  id: string;
  email: string;
  role: string;
  token: string;
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
      async authorize(credentials) {
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

        const res = await fetch(`${API_URL}/api/authentication/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        const data = json.data as
          | { id: string; email: string; role: string }
          | undefined;

        if (!token || !data) {
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
        } satisfies AuthUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = "role" in user ? user.role : undefined;
        token.accessToken = "token" in user ? user.token : undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }
        session.user.role =
          typeof token.role === "string" ? token.role : session.user.role;
      }

      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      return session;
    },
    authorized({ auth: authSession }) {
      return Boolean(authSession?.user);
    },
  },
  trustHost: true,
});
