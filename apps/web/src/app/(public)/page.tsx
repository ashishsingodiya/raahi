import { connection } from "next/server";

import { getSession } from "~/auth/server";
import { HomeHeader } from "~/features/home/components/home-header";
import { HomeHero } from "~/features/home/components/home-hero";

export default async function Home() {
  // Render per request so the header reflects the current auth session.
  await connection();
  const session = await getSession();

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <HomeHeader session={session} />
      <main className="flex flex-1 flex-col">
        <HomeHero />
      </main>
    </div>
  );
}
