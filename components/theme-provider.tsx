"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

type ThemeProviderProps = React.ComponentPropsWithoutRef<
  typeof NextThemesProvider
>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      themes={[
        "light",
        "dark",
        "purple-light",
        "purple-dark",
        "pink-light",
        "pink-dark",
      ]}
      enableSystem={false}
      {...props}
    >
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        duration={4000}
        closeButton
        theme="dark"
        toastOptions={{
          classNames: {
            toast: "font-mono",
            title: "font-semibold",
            description: "text-sm opacity-90",
            error: "border-red-500/20 bg-red-500/10",
            success: "border-terminal-green/20 bg-terminal-green/10",
            warning: "border-yellow-500/20 bg-yellow-500/10",
            info: "border-blue-500/20 bg-blue-500/10",
          },
        }}
      />
    </NextThemesProvider>
  );
}
