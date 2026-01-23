"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  Activity,
  Terminal,
  Clock,
  ArrowRight,
  GraduationCap,
  Loader2,
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
import type { $Enums } from "@prisma/client";

interface AdminDashboardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: $Enums.UserRole;
  };
}

interface DashboardStats {
  totalStudents: number;
  totalLecturers: number;
  totalAdmins: number;
  totalProgrammes: number;
  totalEnrollments: number;
  activeUsersToday: number;
  activeUsersWeek: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  metadata: any;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/dashboard-stats");

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Format action text for display
  const formatAction = (action: string): string => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Get time ago text
  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-terminal-green">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="font-mono text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-mono font-semibold text-destructive mb-1">
                  Error Loading Dashboard
                </h3>
                <p className="text-sm text-terminal-text-muted mb-4">{error}</p>
                <Button
                  onClick={fetchDashboardData}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Programmes",
      value: stats?.totalProgrammes || 0,
      icon: BookOpen,
      color: "text-terminal-green",
    },
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Active Lecturers",
      value: stats?.totalLecturers || 0,
      icon: GraduationCap,
      color: "text-yellow-400",
    },
    {
      title: "Total Enrolments",
      value: stats?.totalEnrollments || 0,
      icon: Activity,
      color: "text-purple-400",
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
          {statCards.map((stat, index) => {
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
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-terminal-text-muted font-mono text-sm">
                  No recent activity
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-md border border-terminal-green/10 bg-terminal-darker/30 hover:bg-terminal-green/5 transition-all"
                      >
                        <div
                          className={`mt-1 h-2 w-2 rounded-full ${
                            activity.action.includes("LOGIN")
                              ? "bg-terminal-green"
                              : activity.action.includes("CREATE")
                                ? "bg-blue-400"
                                : "bg-yellow-400"
                          } animate-pulse shrink-0`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-terminal-text">
                            <span className="font-semibold">
                              {activity.user?.name || "System"}
                            </span>{" "}
                            <span className="text-terminal-text-muted">
                              {formatAction(activity.action)}
                            </span>
                            {activity.entityType && (
                              <>
                                {" "}
                                <span className="text-terminal-green">
                                  {activity.entityType}
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-xs font-mono text-terminal-text-muted mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 gap-2">
                    View All Activity
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
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
                <span className="text-terminal-green">$</span> [
                {new Date().toISOString().split("T")[0]}{" "}
                {new Date().toTimeString().split(" ")[0]}] System: Operational
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Database:
                Connected
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Active Users
                Today: {stats?.activeUsersToday || 0}
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> Active Users (7
                days): {stats?.activeUsersWeek || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
