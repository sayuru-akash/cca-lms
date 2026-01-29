"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Terminal,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  // Request reset state
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestTurnstileToken, setRequestTurnstileToken] = useState<
    string | null
  >(null);

  // Reset password state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetTurnstileToken, setResetTurnstileToken] = useState<string | null>(
    null,
  );

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken: requestTurnstileToken }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        // Still show success to not reveal if email exists
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Reset request error:", error);
      // Still show success to not reveal if email exists
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          turnstileToken: resetTurnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setResetSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If there's a token, show the reset form
  if (token) {
    if (resetSuccess) {
      return (
        <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Terminal className="h-12 w-12 text-terminal-green" />
              </div>
              <h1 className="font-mono text-2xl font-bold text-terminal-green terminal-glow mb-2">
                $ password-reset-complete
              </h1>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-terminal-green" />
                </div>
                <CardTitle className="text-center">
                  Password Reset Successfully!
                </CardTitle>
                <CardDescription className="text-center">
                  You can now login with your new password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-sm space-y-2">
                  <p className="text-terminal-text-muted">
                    <span className="text-terminal-green">$</span> Redirecting
                    to login page...
                  </p>
                </div>

                <Link href="/auth/login" className="block">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Go to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Terminal className="h-12 w-12 text-terminal-green" />
            </div>
            <h1 className="font-mono text-2xl font-bold text-terminal-green terminal-glow mb-2">
              $ set-new-password
            </h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Set New Password
              </CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-red-500/10 border border-red-500/40 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-mono text-terminal-text-muted">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="$ Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-muted hover:text-terminal-green"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-mono text-terminal-text-muted">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="$ Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-muted hover:text-terminal-green"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-3 font-mono text-xs text-terminal-text-muted">
                  <p className="mb-1">Password requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Choose a strong, unique password</li>
                  </ul>
                </div>

                {/* Turnstile CAPTCHA */}
                <div className="space-y-2">
                  <div
                    className="cf-turnstile"
                    data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    data-callback={(token: string) =>
                      setResetTurnstileToken(token)
                    }
                    data-theme="dark"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isLoading || !resetTurnstileToken}
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-terminal-dark border-t-transparent rounded-full animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>

                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Otherwise, show the request reset form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        // Still show success to not reveal if email exists
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Reset request error:", error);
      // Still show success to not reveal if email exists
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Terminal className="h-12 w-12 text-terminal-green" />
          </div>
          <h1 className="font-mono text-2xl font-bold text-terminal-green terminal-glow mb-2">
            $ reset-password
          </h1>
        </div>

        {/* Reset Card */}
        <Card>
          {!isSuccess ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Password Reset
                </CardTitle>
                <CardDescription>
                  Enter your email to receive a reset link
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-mono text-terminal-text-muted">
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

                  {/* Turnstile CAPTCHA */}
                  <div className="space-y-2">
                    <div
                      className="cf-turnstile"
                      data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      data-callback={(token: string) =>
                        setRequestTurnstileToken(token)
                      }
                      data-theme="dark"
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isLoading || !requestTurnstileToken}
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-terminal-dark border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Send Reset Link
                        </>
                      )}
                    </Button>

                    <Link href="/auth/login" className="block">
                      <Button variant="outline" className="w-full gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-terminal-green" />
                </div>
                <CardTitle className="text-center">Email Sent!</CardTitle>
                <CardDescription className="text-center">
                  Check your inbox for the reset link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-sm space-y-2">
                  <p className="text-terminal-text-muted">
                    <span className="text-terminal-green">$</span> Reset link
                    sent to:
                  </p>
                  <p className="text-terminal-green">{email}</p>
                  <p className="text-terminal-text-muted">
                    <span className="text-terminal-green">$</span> Link expires
                    in 1 hour
                  </p>
                </div>

                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>

        {/* Security Note */}
        <div className="mt-4 rounded-md bg-terminal-darker/50 border border-terminal-green/10 p-3 font-mono text-xs text-terminal-text-muted">
          <p>
            <span className="text-terminal-green">$</span> Security: If no
            account exists with this email, no email will be sent
          </p>
        </div>
      </div>
    </div>
  );
}
