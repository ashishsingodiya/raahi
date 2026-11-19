"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";

import type { Session } from "@ridemate/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@ridemate/ui/components/sidebar";

import { UserMenu } from "~/features/auth/components/user-menu";

interface NavItem {
  label: string;
  href: string;
  Icon: typeof House;
  exact?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Student approvals", href: "/studio", Icon: House, exact: true },
];

export function StudioSidebar({ user }: { user: Session["user"] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link
          href="/studio"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground"
          >
            R
          </span>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            RideMate
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map(({ label, href, Icon, exact }) => {
                const isActive = exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      size="lg"
                      isActive={isActive}
                      onClick={() => setOpenMobile(false)}
                      render={<Link href={href} />}
                      className="h-10 gap-3 rounded-lg px-3 text-sidebar-foreground/75 data-active:bg-sidebar-primary data-active:font-semibold data-active:text-sidebar-primary-foreground data-active:shadow-xs data-active:hover:bg-sidebar-primary/90 data-active:hover:text-sidebar-primary-foreground"
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <UserMenu user={user} variant="full" />
      </SidebarFooter>
    </Sidebar>
  );
}
