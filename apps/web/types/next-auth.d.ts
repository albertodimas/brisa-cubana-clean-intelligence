import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role?: string;
      name?: string | null;
      tenant?: {
        id: string;
        slug: string;
        name?: string | null;
      };
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    role: string;
    token: string;
    tenant?: {
      id: string;
      slug: string;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    accessToken?: string;
    tenantId?: string;
    tenantSlug?: string;
    tenantName?: string | null;
  }
}
