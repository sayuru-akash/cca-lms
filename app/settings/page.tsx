"use client";

import { Settings as SettingsIcon, User, Bell, Shield, Database, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ settings --config
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            System configuration and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                  Full Name
                </label>
                <Input placeholder="$ enter name..." defaultValue="Admin User" />
              </div>
              <div>
                <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                  Email Address
                </label>
                <Input type="email" placeholder="$ enter email..." defaultValue="admin@cca-lms.com" />
              </div>
              <div>
                <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                  Role
                </label>
                <Badge variant="success">Administrator</Badge>
              </div>
              <Button className="w-full">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div>
                  <p className="font-mono text-sm text-terminal-text">Email Notifications</p>
                  <p className="font-mono text-xs text-terminal-text-muted">Receive updates via email</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-terminal-green border-2 border-terminal-green relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-terminal-dark transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div>
                  <p className="font-mono text-sm text-terminal-text">Course Updates</p>
                  <p className="font-mono text-xs text-terminal-text-muted">Notify on new courses</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-terminal-green border-2 border-terminal-green relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-terminal-dark transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div>
                  <p className="font-mono text-sm text-terminal-text">Student Activity</p>
                  <p className="font-mono text-xs text-terminal-text-muted">Track student progress</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-terminal-darker border-2 border-terminal-green/30 relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-terminal-text-muted transition-transform" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div>
                  <p className="font-mono text-sm text-terminal-text">System Alerts</p>
                  <p className="font-mono text-xs text-terminal-text-muted">Important system messages</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-terminal-green border-2 border-terminal-green relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-terminal-dark transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Manage security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                  Current Password
                </label>
                <Input type="password" placeholder="$ enter current password..." />
              </div>
              <div>
                <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                  New Password
                </label>
                <Input type="password" placeholder="$ enter new password..." />
              </div>
              <div>
                <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                  Confirm Password
                </label>
                <Input type="password" placeholder="$ confirm password..." />
              </div>
              <Button className="w-full">Update Password</Button>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>Platform settings and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-terminal-text">Database Status</p>
                    <p className="font-mono text-xs text-terminal-text-muted">PostgreSQL 16.1</p>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-terminal-text">API Version</p>
                    <p className="font-mono text-xs text-terminal-text-muted">v2.4.1</p>
                  </div>
                  <Badge variant="info">Latest</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-terminal-text">Cache Server</p>
                    <p className="font-mono text-xs text-terminal-text-muted">Redis 7.2</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Run System Diagnostics
              </Button>
              <Button variant="danger" className="w-full">
                Clear Cache
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Terminal Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Platform details and version info</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-sm space-y-1">
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Platform: CCA_LMS v1.0.0
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Environment: Production
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Node Version: 20.11.0
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Framework: Next.js 16.1.4
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Database: PostgreSQL 16.1
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Last Deployed: 2026-01-23 14:32:15 UTC
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
