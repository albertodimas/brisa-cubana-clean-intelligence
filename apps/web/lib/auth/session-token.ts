import { jwtVerify } from "jose";

const AUTH_COOKIE_CANDIDATES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
];

const encoder = new TextEncoder();

const getSecret = () =>
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? null;

type CookieJar = {
  get(name: string): { value: string } | undefined;
};

/**
 * Obtiene el token de sesión emitido por NextAuth desde las cookies del request.
 */
export const extractSessionToken = (cookies: CookieJar): string | null => {
  for (const name of AUTH_COOKIE_CANDIDATES) {
    const value = cookies.get(name)?.value;
    if (value) {
      return value;
    }
  }
  return null;
};

/**
 * Valida el token JWT de sesión emitido por NextAuth.
 * Retorna `true` sólo si la firma es válida.
 */
export const validateSessionToken = async (token: string): Promise<boolean> => {
  const secret = getSecret();
  if (!secret) {
    return false;
  }

  try {
    await jwtVerify(token, encoder.encode(secret));
    return true;
  } catch {
    return false;
  }
};
