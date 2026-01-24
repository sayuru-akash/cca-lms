"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Terminal,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Home,
  FileText,
  LogOut,
  GraduationCap,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

// Role-based navigation items
const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/programmes", label: "Programmes", icon: BookOpen },
  { href: "/users", label: "Users", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const lecturerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/programmes", label: "My Programmes", icon: BookOpen },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/settings", label: "Settings", icon: Settings },
];

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/my-programmes", label: "My Programmes", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Determine nav items based on user role
  const getNavItems = () => {
    if (!session?.user?.role) return [];

    switch (session.user.role) {
      case "ADMIN":
        return adminNavItems;
      case "LECTURER":
        return lecturerNavItems;
      case "STUDENT":
        return studentNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-terminal-green/20 bg-terminal-darker/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Terminal className="h-8 w-8 text-terminal-green transition-all group-hover:scale-110" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Terminal className="h-8 w-8 text-terminal-green" />
              </div>
            </div>
            <span className="font-mono text-xl font-bold text-terminal-green terminal-glow">
              CCA_LMS
            </span>
            <span className="hidden sm:inline font-mono text-sm text-terminal-text-muted">
              v2.0.0
            </span>
          </Link>

          {/* Navigation Links - Only show when logged in */}
          {session?.user && navItems.length > 0 && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md font-mono text-sm transition-all",
                      isActive
                        ? "bg-terminal-green/20 text-terminal-green border border-terminal-green/40 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                        : "text-terminal-text-muted hover:text-terminal-green hover:bg-terminal-green/10 hover:border-terminal-green/20 border border-transparent",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-terminal-green animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {session?.user && (
              <button
                onClick={handleLogout}
                className="flex h-9 items-center gap-2 px-3 rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] font-mono text-sm text-terminal-text-muted hover:text-terminal-green"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Only show when logged in */}
      {session?.user && navItems.length > 0 && (
        <div className="md:hidden border-t border-terminal-green/20 px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs whitespace-nowrap transition-all",
                    isActive
                      ? "bg-terminal-green/20 text-terminal-green border border-terminal-green/40"
                      : "text-terminal-text-muted hover:text-terminal-green hover:bg-terminal-green/10 border border-transparent",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
