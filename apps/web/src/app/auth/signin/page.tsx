import { SignInForm } from "./signin-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const raw = resolved.callbackUrl;
  const value = Array.isArray(raw) ? raw[0] : (raw as string | undefined);

  const callbackUrl = value ?? "/dashboard";
  return <SignInForm callbackUrl={callbackUrl} />;
}
