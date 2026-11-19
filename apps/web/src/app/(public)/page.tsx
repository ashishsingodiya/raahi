import Link from "next/link";
import { redirect } from "next/navigation";

import { canAccessStudio } from "@raahi/auth/permissions";
import { Button } from "@raahi/ui/components/button";

import { getSession } from "~/auth/server";
import { UserMenu } from "~/features/auth/components/user-menu";

export default async function Home() {
  const session = await getSession();
  if (session && canAccessStudio(session.user.role)) redirect("/studio");

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-3xl font-bold tracking-tight">Raahi Studio</h1>
      {session ? (
        <>
          <p className="text-muted-foreground">
            This account doesn’t have admin access. Students use the Raahi
            Android app.
          </p>
          <UserMenu user={session.user} variant="full" />
        </>
      ) : (
        <>
          <p className="text-muted-foreground">
            Sign in with your admin account to review student profiles.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/login?callbackUrl=/studio" />}
          >
            Admin sign-in
          </Button>
        </>
      )}
    </main>
  );
}
