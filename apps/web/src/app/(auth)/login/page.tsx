import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { GoogleSignInButton } from "~/features/auth/components/google-sign-in-button";
import { safeCallbackUrl } from "~/features/auth/utils/safe-callback-url";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl);

  const session = await getSession();
  if (session) redirect(callbackUrl);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to RideMate
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to continue</p>
      </div>
      <GoogleSignInButton callbackUrl={callbackUrl} />
    </main>
  );
}
