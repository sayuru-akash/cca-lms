"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Terminal,
  Play,
  Loader2,
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/generated/prisma";
import { formatDistanceToNow } from "date-fns";

interface StudentDashboardProps {
  user: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface Programme {
  id: string;
  title: string;
  progress: number;
  status: string;
  totalLessons: number;
  completedLessons: number;
  nextLesson: {
    id: string;
    title: string;
    moduleTitle: string;
  } | null;
}

interface Activity {
  id: string;
  type: string;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
  timestamp: string;
}

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  maxPoints: number;
  courseTitle: string;
  lessonTitle: string;
  courseId: string;
  lessonId: string;
  isOverdue: boolean;
  daysUntilDue: number;
}

interface DashboardData {
  programmes: Programme[];
  recentActivity: Activity[];
  upcomingAssignments: Assignment[];
  stats: {
    totalEnrolled: number;
    totalCompleted: number;
    inProgress: number;
    averageProgress: number;
  };
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/student/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
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

  if (!data) return null;

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ student-dashboard
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Welcome back, {user.name || user.email}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-terminal-text-muted mb-1">
                    Enrolled
                  </p>
                  <p className="text-2xl font-bold font-mono text-terminal-green">
                    {data.stats.totalEnrolled}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-terminal-green/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-terminal-text-muted mb-1">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold font-mono text-blue-400">
                    {data.stats.inProgress}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-terminal-text-muted mb-1">
                    Completed
                  </p>
                  <p className="text-2xl font-bold font-mono text-terminal-green">
                    {data.stats.totalCompleted}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-terminal-green/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-terminal-text-muted mb-1">
                    Avg. Progress
                  </p>
                  <p className="text-2xl font-bold font-mono text-terminal-green">
                    {data.stats.averageProgress}%
                  </p>
                </div>
                <Clock className="h-8 w-8 text-terminal-green/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Enrolled Programmes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      My Programmes
                    </CardTitle>
                    <CardDescription>Continue your learning</CardDescription>
                  </div>
                  <Link href="/my-programmes">
                    <Button variant="outline" size="sm">
                      Browse All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.programmes.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-terminal-text-muted mx-auto mb-4" />
                    <p className="font-mono text-terminal-text-muted mb-4">
                      You&apos;re not enrolled in any programmes yet
                    </p>
                    <Link href="/my-programmes">
                      <Button>Browse Programmes</Button>
                    </Link>
                  </div>
                ) : (
                  data.programmes.map((programme) => (
                    <div
                      key={programme.id}
                      className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-mono font-semibold text-terminal-text">
                          {programme.title}
                        </h3>
                        <Badge
                          variant={
                            programme.status === "COMPLETED"
                              ? "success"
                              : "info"
                          }
                        >
                          {Math.round(programme.progress)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                          <div
                            className="h-full bg-terminal-green rounded-full transition-all"
                            style={{ width: `${programme.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono text-terminal-text-muted">
                          <span>
                            {programme.completedLessons}/
                            {programme.totalLessons} lessons
                          </span>
                          {programme.status === "COMPLETED" && (
                            <CheckCircle2 className="h-4 w-4 text-terminal-green" />
                          )}
                        </div>
                        {programme.nextLesson && (
                          <p className="text-sm font-mono text-terminal-text-muted">
                            Next: {programme.nextLesson.title}
                          </p>
                        )}
                      </div>
                      <Link href={`/learn/${programme.id}`}>
                        <Button className="w-full mt-3 gap-2">
                          <Play className="h-4 w-4" />
                          {programme.status === "COMPLETED"
                            ? "Review"
                            : "Continue Learning"}
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your learning history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <div className="text-center py-12 text-terminal-text-muted font-mono text-sm">
                  No recent activity yet
                </div>
              ) : (
                data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-terminal-green/10 bg-terminal-darker/30"
                  >
                    <CheckCircle2 className="h-4 w-4 text-terminal-green shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-mono text-terminal-text">
                        Completed: {activity.lessonTitle}
                      </p>
                      <p className="text-xs font-mono text-terminal-text-muted mt-1">
                        {activity.courseTitle} → {activity.moduleTitle}
                      </p>
                      <p className="text-xs font-mono text-terminal-text-muted mt-1">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upcoming Assignments
              </CardTitle>
              <CardDescription>
                Assignments due soon - stay on track!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingAssignments?.length === 0 ? (
                <div className="text-center py-12 text-terminal-text-muted font-mono text-sm">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No upcoming assignments
                </div>
              ) : (
                data.upcomingAssignments?.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-start justify-between p-3 rounded-md border border-terminal-green/10 bg-terminal-darker/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-mono font-semibold text-terminal-text">
                          {assignment.title}
                        </h4>
                        <Badge
                          variant={
                            assignment.daysUntilDue <= 1
                              ? "danger"
                              : assignment.daysUntilDue <= 3
                                ? "warning"
                                : "default"
                          }
                        >
                          {assignment.daysUntilDue === 0
                            ? "Due today"
                            : assignment.daysUntilDue === 1
                              ? "Due tomorrow"
                              : `${assignment.daysUntilDue} days left`}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-terminal-text-muted mb-1">
                        {assignment.courseTitle} → {assignment.lessonTitle}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {assignment.maxPoints} points
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/learn/assignment/${assignment.id}`}
                      className="shrink-0"
                    >
                      <Button size="sm" className="gap-1">
                        <FileText className="h-3 w-3" />
                        Submit
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
