"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  UserPlus,
  FileText,
  Settings,
  Shield,
  BarChart3,
  CheckCircle2,
  XCircle,
  Database,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/generated/prisma";

interface AdminDashboardProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
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
  databaseStatus?: "connected" | "disconnected" | "checking";
  systemUptime?: number;
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
  const [databaseStatus, setDatabaseStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");
  const [uptime, setUptime] = useState<number>(0);

  useEffect(() => {
    fetchDashboardData();
    checkDatabaseStatus();

    // Update uptime every second
    const uptimeInterval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);

    // Refresh stats every 30 seconds
    const statsInterval = setInterval(fetchDashboardData, 30000);

    return () => {
      clearInterval(uptimeInterval);
      clearInterval(statsInterval);
    };
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
      setDatabaseStatus("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setDatabaseStatus("disconnected");
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats");
      setDatabaseStatus(response.ok ? "connected" : "disconnected");
    } catch {
      setDatabaseStatus("disconnected");
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
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
    {
      label: "Manage Users",
      icon: Users,
      href: "/users",
      description: "View, add, or edit users",
    },
    {
      label: "Manage Programmes",
      icon: BookOpen,
      href: "/programmes",
      description: "Create and manage programmes",
    },
    {
      label: "Add Lecturer",
      icon: UserPlus,
      href: "/users?tab=lecturer&action=add",
      description: "Register new lecturer",
    },
    {
      label: "View Reports",
      icon: BarChart3,
      href: "/reports",
      description: "Analytics and insights",
    },
    {
      label: "Audit Logs",
      icon: Shield,
      href: "/activity-logs",
      description: "System activity monitoring",
    },
    {
      label: "System Settings",
      icon: Settings,
      href: "/settings",
      description: "Configure system preferences",
    },
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
                  <Link href="/activity-logs">
                    <Button variant="outline" className="w-full mt-4 gap-2">
                      View All Activity
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
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
                  <Link key={index} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-4 hover:bg-terminal-green/10 hover:border-terminal-green transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Icon className="h-5 w-5 text-terminal-green group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                          <div className="font-mono font-semibold text-terminal-text">
                            {action.label}
                          </div>
                          <div className="font-mono text-xs text-terminal-text-muted">
                            {action.description}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-terminal-text-muted group-hover:text-terminal-green group-hover:translate-x-1 transition-all" />
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-terminal-green" />
              System Status
            </CardTitle>
            <CardDescription>
              Real-time system health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Status Indicators */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-terminal-darker/80 border border-terminal-green/20">
                  <div className="flex items-center gap-2">
                    {databaseStatus === "connected" ? (
                      <CheckCircle2 className="h-5 w-5 text-terminal-green animate-pulse" />
                    ) : databaseStatus === "disconnected" ? (
                      <XCircle className="h-5 w-5 text-red-400 animate-pulse" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                    )}
                    <span className="font-mono text-sm text-terminal-text">
                      Database
                    </span>
                  </div>
                  <span className="font-mono text-xs text-terminal-text-muted capitalize">
                    {databaseStatus}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-terminal-darker/80 border border-terminal-green/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-terminal-green animate-pulse" />
                    <span className="font-mono text-sm text-terminal-text">
                      API Service
                    </span>
                  </div>
                  <span className="font-mono text-xs text-terminal-text-muted">
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-terminal-darker/80 border border-terminal-green/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <span className="font-mono text-sm text-terminal-text">
                      Session Uptime
                    </span>
                  </div>
                  <span className="font-mono text-xs text-terminal-text-muted">
                    {formatUptime(uptime)}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-terminal-darker/80 border border-terminal-green/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-terminal-text-muted">
                      Active Users (24h)
                    </span>
                    <span className="font-mono text-sm text-terminal-green font-bold">
                      {stats?.activeUsersToday || 0}
                    </span>
                  </div>
                  <div className="h-1.5 bg-terminal-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terminal-green transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((stats?.activeUsersToday || 0) /
                            (stats?.totalStudents || 1)) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-md bg-terminal-darker/80 border border-terminal-green/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-terminal-text-muted">
                      Active Users (7d)
                    </span>
                    <span className="font-mono text-sm text-blue-400 font-bold">
                      {stats?.activeUsersWeek || 0}
                    </span>
                  </div>
                  <div className="h-1.5 bg-terminal-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((stats?.activeUsersWeek || 0) /
                            (stats?.totalStudents || 1)) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-md bg-terminal-darker/80 border border-terminal-green/20">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-terminal-text-muted">
                      System Time
                    </span>
                    <span className="font-mono text-xs text-terminal-text-muted">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="mt-4 rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-xs space-y-1">
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> system --status
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">→</span> Database:{" "}
                <span
                  className={`font-bold ${
                    databaseStatus === "connected"
                      ? "text-terminal-green"
                      : "text-red-400"
                  }`}
                >
                  {databaseStatus.toUpperCase()}
                </span>
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">→</span> Total Users:{" "}
                <span className="text-terminal-green font-bold">
                  {(stats?.totalStudents || 0) +
                    (stats?.totalLecturers || 0) +
                    (stats?.totalAdmins || 0)}
                </span>
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">→</span> Total Programmes:{" "}
                <span className="text-terminal-green font-bold">
                  {stats?.totalProgrammes || 0}
                </span>
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">→</span> Total
                Enrollments:{" "}
                <span className="text-terminal-green font-bold">
                  {stats?.totalEnrollments || 0}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
