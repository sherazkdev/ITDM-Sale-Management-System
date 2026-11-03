"use client";

import Link from "next/link";
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

export function UserMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { session, loading, signOut, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 pl-1.5 pr-2 h-10">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="hidden md:block h-4 w-24" />
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 pl-1.5 pr-2">
          <UserAvatar name={user.displayName} size={32} />
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{user.displayName}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">{user.username}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon className="h-4 w-4" /> {user.username}
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
