"use client";

import { useState } from "react";
import {
  Terminal,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        // Success - use window.location for full page reload to ensure session is loaded
        window.location.href = callbackUrl;
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Terminal className="h-16 w-16 text-terminal-green" />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Terminal className="h-16 w-16 text-terminal-green" />
              </div>
            </div>
          </div>
          <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow mb-2">
            $ cca-lms --login
          </h1>
          <p className="font-mono text-sm text-terminal-text-muted">
            Internal Learning Management System
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm font-mono text-red-500">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-mono text-terminal-text-muted flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="$ user@cca.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-mono text-terminal-text-muted flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="$ ••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-muted hover:text-terminal-green transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/auth/reset-password"
                  className="text-sm font-mono text-terminal-green hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-terminal-dark border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Terminal Status */}
            <div className="mt-6 rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-3 font-mono text-xs space-y-1">
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Status: Awaiting
                credentials
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Session: Inactive
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Security: TLS 1.3
                enabled
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <p className="mt-6 text-center text-xs font-mono text-terminal-text-muted">
          No account? Contact your administrator
        </p>
      </div>
    </div>
  );
}
