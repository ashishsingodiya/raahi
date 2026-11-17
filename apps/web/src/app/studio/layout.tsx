import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { canAccessStudio } from "@raahi/auth/permissions";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@raahi/ui/components/sidebar";

import { getSession } from "~/auth/server";
import { StudioSidebar } from "~/features/studio/components/studio-sidebar";

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s | Raahi Studio" },
  robots: { index: false, follow: false },
};

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/studio");
  if (!canAccessStudio(session.user.role)) redirect("/");

  return (
    <SidebarProvider>
      <StudioSidebar user={session.user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 md:hidden">
          <SidebarTrigger />
          <span className="font-semibold tracking-tight">Raahi</span>
        </header>
        <div className="flex flex-1 flex-col p-6 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
