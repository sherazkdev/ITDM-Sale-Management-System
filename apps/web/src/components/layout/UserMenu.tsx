"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LogOut, Moon, Settings, Sun, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { PermissionKeys } from "@/lib/permissions";
import { fetchUserProfile, userAvatarSrc } from "@/lib/api/user-profile";

export function UserMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { session, loading, signOut, hasPermission } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: fetchUserProfile,
    enabled: session.status === "authenticated",
    staleTime: 120_000,
  });

  if (loading) {
    return (
      <div className="flex items-center gap-2 pl-1.5 pr-2 h-10">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="hidden lg:block h-4 w-24" />
      </div>
    );
  }

  if (session.status !== "authenticated") {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const { user } = session;
  const avatarSrc = profileQuery.data?.avatarUrl ? userAvatarSrc(true) : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 max-w-full gap-2 pl-1.5 pr-2" aria-label={`${user.displayName} account`}>
          <UserAvatar name={user.displayName} src={avatarSrc} size={32} />
          <div className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
            <span className="max-w-[9rem] truncate text-sm font-medium">{user.displayName}</span>
            <span className="max-w-[9rem] truncate text-[11px] text-muted-foreground">{user.username}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <UserIcon className="h-4 w-4" /> Profile & settings
          </Link>
        </DropdownMenuItem>
        {hasPermission(PermissionKeys.usersManage) ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Settings className="h-4 w-4" /> Administration
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
          }}
        >
          {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          <span className="ml-auto text-[10px] uppercase text-muted-foreground">{theme}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
