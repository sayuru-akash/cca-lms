"use client";

import { useState } from "react";
import { Terminal, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isLoading}
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
                    in 15 minutes
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
