"use client";

import { useState } from "react";
import {
  Terminal,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
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

export default function FirstLoginPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { text: "At least 8 characters", met: newPassword.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(newPassword) },
    { text: "Contains number", met: /[0-9]/.test(newPassword) },
    {
      text: "Contains special character",
      met: /[^A-Za-z0-9]/.test(newPassword),
    },
    {
      text: "Passwords match",
      met: newPassword === confirmPassword && newPassword.length > 0,
    },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet) return;
    setIsLoading(true);
    // TODO: Implement password change
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Terminal className="h-12 w-12 text-terminal-green" />
          </div>
          <h1 className="font-mono text-2xl font-bold text-terminal-green terminal-glow mb-2">
            $ first-login --required
          </h1>
          <p className="font-mono text-sm text-terminal-text-muted">
            Set a new secure password
          </p>
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Change Required
            </CardTitle>
            <CardDescription>
              Create a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-mono text-terminal-text-muted">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="$ ••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-muted hover:text-terminal-green transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-mono text-terminal-text-muted">
                  Confirm Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="$ ••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Requirements */}
              <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 space-y-2">
                <p className="font-mono text-xs text-terminal-text-muted mb-2">
                  Password Requirements:
                </p>
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 font-mono text-xs"
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-terminal-green" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-terminal-text-muted" />
                    )}
                    <span
                      className={
                        req.met
                          ? "text-terminal-green"
                          : "text-terminal-text-muted"
                      }
                    >
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={!allRequirementsMet || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-terminal-dark border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Set Password &amp; Continue
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="mt-4 rounded-md bg-terminal-darker/50 border border-terminal-green/10 p-3 font-mono text-xs text-terminal-text-muted">
          <p>
            <span className="text-terminal-green">$</span> Your password will be
            securely hashed and stored
          </p>
        </div>
      </div>
    </div>
  );
}
