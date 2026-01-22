"use client";

import {
  BookOpen,
  Users,
  Activity,
  Terminal,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminDashboardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "ADMIN" | "LECTURER" | "STUDENT";
  };
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const stats = [
    {
      title: "Active Programmes",
      value: "12",
      icon: BookOpen,
      color: "text-terminal-green",
    },
    {
      title: "Total Students",
      value: "342",
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Active Lecturers",
      value: "18",
      icon: Users,
      color: "text-yellow-400",
    },
    {
      title: "Total Enrolments",
      value: "456",
      icon: Activity,
      color: "text-purple-400",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: "Alice Johnson",
      action: "enrolled in",
      target: "Web Development Programme",
      time: "5 minutes ago",
      type: "info" as const,
    },
    {
      id: 2,
      user: "Bob Smith",
      action: "completed",
      target: "JavaScript Fundamentals Module",
      time: "12 minutes ago",
      type: "success" as const,
    },
    {
      id: 3,
      user: "Dr. Carol White",
      action: "published",
      target: "Advanced React Patterns Lesson",
      time: "25 minutes ago",
      type: "info" as const,
    },
    {
      id: 4,
      user: "David Brown",
      action: "submitted",
      target: "Final Project Assignment",
      time: "1 hour ago",
      type: "warning" as const,
    },
  ];

  const quickActions = [
    { label: "New Programme", icon: BookOpen, href: "/programmes/new" },
    { label: "Add Student", icon: Users, href: "/students/new" },
    { label: "View Audit Logs", icon: Activity, href: "/audit" },
  ];

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ admin-dashboard
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="group hover:scale-105 transition-transform"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                    <div className="text-3xl font-bold font-mono text-terminal-green">
                      {stat.value}
                    </div>
                  </div>
                  <p className="font-mono text-sm text-terminal-text-muted">
                    {stat.title}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-terminal-green/10 bg-terminal-darker/30 hover:bg-terminal-green/5 transition-all"
                  >
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-terminal-green"
                          : activity.type === "warning"
                          ? "bg-yellow-400"
                          : "bg-blue-400"
                      } animate-pulse shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-terminal-text">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        <span className="text-terminal-text-muted">
                          {activity.action}
                        </span>{" "}
                        <span className="text-terminal-green">
                          {activity.target}
                        </span>
                      </p>
                      <p className="text-xs font-mono text-terminal-text-muted mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 gap-2">
                View All Activity
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <Icon className="h-5 w-5 text-terminal-green" />
                    <span className="font-mono">{action.label}</span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-sm space-y-1">
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23
                14:32:15] System: Operational
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23
                14:32:16] Database: Connected
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23
                14:32:17] Active Sessions: 23
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
