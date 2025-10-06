import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyUserCredentials } from "./dal";
import { findFakeUser, isFakeDataEnabled } from "@/server/utils/fake";

const sessionMaxAgeSeconds = 60 * 60 * 8; // 8 horas

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST },
} = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAgeSeconds,
  },
  jwt: {
    maxAge: sessionMaxAgeSeconds,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        if (isFakeDataEnabled()) {
          const user = findFakeUser(
            String(credentials.email),
            String(credentials.password),
          );
          if (!user) {
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? user.email,
            role: user.role ?? "CLIENT",
          };
        }

        const user = await verifyUserCredentials(
          String(credentials.email),
          String(credentials.password),
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role ?? "CLIENT",
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: "brisa_session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
