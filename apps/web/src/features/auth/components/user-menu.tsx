"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import type { Session } from "@ridemate/auth";
import { canAccessStudio } from "@ridemate/auth/permissions";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ridemate/ui/components/avatar";
import { Button } from "@ridemate/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ridemate/ui/components/dropdown-menu";
import { cn } from "@ridemate/ui/lib/utils";

import { authClient } from "~/auth/client";

export interface UserMenuProps {
  user: Session["user"];
  variant?: "compact" | "full";
  className?: string;
}

const THEME_OPTIONS = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "System theme", Icon: Monitor },
] as const;

const emptySubscribe = () => () => undefined;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRole(role: string | null | undefined): string {
  if (!role) return "Member";
  const primary = role.split(",")[0]?.trim();
  if (!primary) return "Member";
  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

function UserAvatar({
  user,
  className,
}: {
  user: Session["user"];
  className?: string;
}) {
  const initials = getInitials(user.name);

  return (
    <Avatar className={className}>
      {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
      <AvatarFallback className="text-xs font-medium">
        {initials || <User className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserMenu({
  user,
  variant = "compact",
  className,
}: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const inStudio = pathname.startsWith("/studio");
  const showStudioLink = !inStudio && canAccessStudio(user.role);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      {variant === "full" ? (
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className={cn(
                "h-auto w-full justify-start gap-2.5 rounded-lg px-2 py-1.5 text-left",
                className,
              )}
            />
          }
        >
          <UserAvatar user={user} className="size-8" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {formatRole(user.role)}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open user menu"
              className={cn("size-8 rounded-full p-0 sm:size-9", className)}
            />
          }
        >
          <UserAvatar user={user} className="size-8 sm:size-9" />
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent
        align="end"
        side={variant === "full" ? "top" : "bottom"}
        sideOffset={8}
        className="w-56 min-w-(--anchor-width)"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2.5 px-1.5 py-1.5 text-left text-sm">
              <UserAvatar user={user} className="size-8" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {inStudio ? (
            <DropdownMenuItem render={<Link href="/" />}>
              <ArrowLeft />
              <span>Back to Home</span>
            </DropdownMenuItem>
          ) : showStudioLink ? (
            <DropdownMenuItem render={<Link href="/studio" />}>
              <LayoutDashboard />
              <span>Studio</span>
            </DropdownMenuItem>
          ) : null}

          {inStudio || showStudioLink ? <DropdownMenuSeparator /> : null}

          <div className="flex items-center justify-between px-1.5 py-1 text-sm">
            <span className="text-muted-foreground">Theme</span>
            <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
              {THEME_OPTIONS.map(({ value, label, Icon }) => {
                const active = isMounted && theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-sm transition-colors",
                      active
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
          <DropdownMenuSeparator />

          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
