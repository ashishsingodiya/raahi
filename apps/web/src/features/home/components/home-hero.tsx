import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@raahi/ui/components/button";

const STACK_ITEMS = [
  "Next.js 16",
  "Expo",
  "tRPC v11",
  "Drizzle + Postgres 18",
  "Better Auth",
  "Tailwind v4",
] as const;

export function HomeHero() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 md:py-24 lg:px-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs font-medium text-muted-foreground">
          Monorepo Starter
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Welcome to Raahi
        </h1>

        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          A full-stack TypeScript monorepo baseline for web and mobile apps with
          end-to-end type safety, authentication, and shared UI.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/login" />}
            className="gap-2"
          >
            <span>Get started</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {STACK_ITEMS.map((item) => (
            <li
              key={item}
              className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
