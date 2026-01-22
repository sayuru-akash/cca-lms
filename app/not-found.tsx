import { Terminal, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Terminal className="h-16 w-16 text-terminal-green" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Terminal className="h-16 w-16 text-terminal-green" />
              </div>
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            $ 404 --page-not-found
          </CardTitle>
          <CardDescription className="text-center">
            The requested resource could not be located
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-sm space-y-1">
            <p className="text-terminal-text-muted">
              <span className="text-terminal-green">$</span> Error: ENOENT
            </p>
            <p className="text-terminal-text-muted">
              <span className="text-terminal-green">$</span> Status: 404 Not Found
            </p>
            <p className="text-terminal-text-muted">
              <span className="text-terminal-green">$</span> Message: The page you&apos;re looking for doesn&apos;t exist
            </p>
          </div>

          <Link href="/" className="block">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
