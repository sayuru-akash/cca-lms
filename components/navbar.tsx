"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, BookOpen, Users, BarChart3, Settings, Home, FileText, Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/students", label: "Students", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/resources", label: "Resources", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

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
              v1.0.0
            </span>
          </Link>

          {/* Navigation Links */}
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
                      : "text-terminal-text-muted hover:text-terminal-green hover:bg-terminal-green/10 hover:border-terminal-green/20 border border-transparent"
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

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]">
              <Bell className="h-4 w-4 text-terminal-green" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terminal-green text-[10px] font-bold text-terminal-dark">
                3
              </span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
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
                    : "text-terminal-text-muted hover:text-terminal-green hover:bg-terminal-green/10 border border-transparent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
