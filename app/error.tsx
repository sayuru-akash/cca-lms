"use client";

import { useEffect } from "react";
import { AlertCircle, Terminal, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <AlertCircle className="h-16 w-16 text-red-400" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <AlertCircle className="h-16 w-16 text-red-400" />
              </div>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            $ error --fatal
          </CardTitle>
          <CardDescription className="text-center">
            Something went wrong. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-terminal-darker/80 border border-red-500/20 p-4 font-mono text-sm">
            <p className="text-red-400">
              <span className="text-terminal-green">$</span> {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-terminal-text-muted mt-2">
                <span className="text-terminal-green">$</span> Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={reset} className="flex-1 gap-2">
              <Terminal className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/"} className="flex-1 gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
