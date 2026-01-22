"use client";

import { useState } from "react";
import {
  BookOpen,
  Users,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Terminal,
  Play,
  FileText,
  Award,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const stats = [
  {
    title: "Total Students",
    value: "1,234",
    change: "+12.5%",
    icon: Users,
    color: "text-terminal-green",
  },
  {
    title: "Active Courses",
    value: "42",
    change: "+3",
    icon: BookOpen,
    color: "text-blue-400",
  },
  {
    title: "Completion Rate",
    value: "87.5%",
    change: "+5.2%",
    icon: TrendingUp,
    color: "text-yellow-400",
  },
  {
    title: "Total Lessons",
    value: "342",
    change: "+24",
    icon: Activity,
    color: "text-purple-400",
  },
];

const recentCourses = [
  {
    id: 1,
    title: "Advanced JavaScript Patterns",
    students: 234,
    progress: 78,
    status: "active",
    lastUpdated: "2 hours ago",
  },
  {
    id: 2,
    title: "Python for Data Science",
    students: 456,
    progress: 92,
    status: "active",
    lastUpdated: "5 hours ago",
  },
  {
    id: 3,
    title: "System Design Fundamentals",
    students: 189,
    progress: 45,
    status: "active",
    lastUpdated: "1 day ago",
  },
  {
    id: 4,
    title: "Machine Learning Basics",
    students: 567,
    progress: 63,
    status: "active",
    lastUpdated: "2 days ago",
  },
];

const activityFeed = [
  {
    id: 1,
    user: "Alice Johnson",
    action: "completed",
    target: "Advanced Algorithms Module",
    time: "5 minutes ago",
    type: "success",
  },
  {
    id: 2,
    user: "Bob Smith",
    action: "enrolled in",
    target: "Web Development Bootcamp",
    time: "12 minutes ago",
    type: "info",
  },
  {
    id: 3,
    user: "Carol White",
    action: "submitted",
    target: "Final Project Assignment",
    time: "25 minutes ago",
    type: "warning",
  },
  {
    id: 4,
    user: "David Brown",
    action: "commented on",
    target: "React Hooks Discussion",
    time: "1 hour ago",
    type: "info",
  },
  {
    id: 5,
    user: "Eve Davis",
    action: "achieved",
    target: "Python Master Badge",
    time: "2 hours ago",
    type: "success",
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ dashboard --status=active
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            System overview and recent activity
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="$ search courses, students, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-terminal-green/30 bg-terminal-darker px-1.5 font-mono text-[10px] font-medium text-terminal-text-muted">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="group hover:scale-105 transition-transform">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-terminal-green">
                    {stat.value}
                  </div>
                  <p className="text-xs font-mono text-terminal-text-muted mt-1">
                    <span className="text-terminal-green">{stat.change}</span> from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Recent Courses */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Active Courses
                  </CardTitle>
                  <CardDescription>Your most active learning modules</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="group flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 hover:border-terminal-green/40 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-mono font-semibold text-terminal-text">
                        {course.title}
                      </h3>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono text-terminal-text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {course.students} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.lastUpdated}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                          <div
                            className="h-full bg-terminal-green rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-terminal-green font-semibold min-w-12 text-right">
                          {course.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Activity
              </CardTitle>
              <CardDescription>Recent system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-terminal-green/10 bg-terminal-darker/30 hover:bg-terminal-green/5 transition-all"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-terminal-green"
                          : activity.type === "warning"
                          ? "bg-yellow-400"
                          : "bg-blue-400"
                      } animate-pulse`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-terminal-text">
                        <span className="font-semibold">{activity.user}</span>{" "}
                        <span className="text-terminal-text-muted">{activity.action}</span>{" "}
                        <span className="text-terminal-green">{activity.target}</span>
                      </p>
                      <p className="text-xs font-mono text-terminal-text-muted mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-sm">Create Course</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Add Student</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">New Assignment</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>Platform health monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-terminal-green animate-pulse" />
                  <span className="font-mono text-sm text-terminal-text">Database</span>
                </div>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-terminal-green animate-pulse" />
                  <span className="font-mono text-sm text-terminal-text">API Server</span>
                </div>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-terminal-green animate-pulse" />
                  <span className="font-mono text-sm text-terminal-text">File Storage</span>
                </div>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-yellow-500/20 bg-terminal-darker/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="font-mono text-sm text-terminal-text">Email Service</span>
                </div>
                <Badge variant="warning">Degraded</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terminal Output Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              System Logs
            </CardTitle>
            <CardDescription>Recent system output</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-terminal-darker/80 border border-terminal-green/20 p-4 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23 14:32:15] System initialized successfully
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23 14:32:16] Connected to database: PostgreSQL 16.1
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23 14:32:17] Loaded 42 active courses
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23 14:32:18] Authenticated 234 active users
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-blue-400">$</span> [2026-01-23 14:33:42] New enrollment: Alice Johnson → Advanced JavaScript
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23 14:35:12] Assignment submitted: Final Project by Bob Smith
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-yellow-400">$</span> [2026-01-23 14:36:05] Warning: Email service latency detected
              </p>
              <p className="text-terminal-text-muted">
                <span className="text-terminal-green">$</span> [2026-01-23 14:37:23] Course completed: Carol White (87.5% grade)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
