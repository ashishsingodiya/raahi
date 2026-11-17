import Link from "next/link";
import { User } from "lucide-react";

import type { Session } from "@raahi/auth";
import { Button } from "@raahi/ui/components/button";

import { UserMenu } from "~/features/auth/components/user-menu";

export function HomeHeader({ session }: { session: Session | null }) {
  return (
    <header className="relative z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground sm:size-9"
          >
            R
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Raahi
          </span>
        </Link>

        {session ? (
          <UserMenu
            user={session.user}
            variant="compact"
            className="ring-1 ring-border hover:bg-accent"
          />
        ) : (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
            className="h-auto gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground/90 sm:gap-2 sm:px-5 sm:text-sm"
          >
            <User className="size-3.5 text-muted-foreground sm:size-4" />
            <span>Login</span>
          </Button>
        )}
      </div>
    </header>
  );
}
