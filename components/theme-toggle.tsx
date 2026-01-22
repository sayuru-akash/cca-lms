"use client";

import * as React from "react";
import { Moon, Sun, Terminal } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker">
        <Terminal className="h-4 w-4 text-terminal-green" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="group relative flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 text-terminal-green transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 text-terminal-green transition-all dark:rotate-0 dark:scale-100" />
      <span className="absolute -bottom-8 right-0 rounded bg-terminal-darker px-2 py-1 text-xs text-terminal-green opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap border border-terminal-green/20">
        {theme === "dark" ? "Light" : "Dark"} Mode
      </span>
    </button>
  );
}
