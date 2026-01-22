"use client";

import {
  BarChart3,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { label: "Total Revenue", value: "$45,231", change: "+20.1%", trend: "up" },
  { label: "Active Users", value: "1,234", change: "+12.5%", trend: "up" },
  { label: "Course Completions", value: "892", change: "+8.3%", trend: "up" },
  { label: "Avg. Engagement", value: "78%", change: "-2.1%", trend: "down" },
];

const topCourses = [
  {
    name: "Web Development Bootcamp",
    enrollments: 678,
    revenue: "$13,560",
    growth: "+25%",
  },
  {
    name: "Python for Data Science",
    enrollments: 567,
    revenue: "$11,340",
    growth: "+18%",
  },
  {
    name: "Machine Learning Basics",
    enrollments: 456,
    revenue: "$9,120",
    growth: "+22%",
  },
  {
    name: "Advanced JavaScript",
    enrollments: 345,
    revenue: "$6,900",
    growth: "+15%",
  },
  {
    name: "DevOps Engineering",
    enrollments: 234,
    revenue: "$4,680",
    growth: "+12%",
  },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ analytics --report=monthly
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Performance metrics and insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className="group hover:scale-105 transition-transform"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold font-mono text-terminal-green">
                    {metric.value}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-mono ${metric.trend === "up" ? "text-terminal-green" : "text-red-400"}`}
                  >
                    {metric.trend === "up" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    {metric.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Top Performing Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Performing Courses
              </CardTitle>
              <CardDescription>
                Based on enrollments and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border border-terminal-green bg-terminal-green/10 font-mono font-bold text-terminal-green text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-terminal-text text-sm">
                          {course.name}
                        </p>
                        <p className="font-mono text-xs text-terminal-text-muted">
                          {course.enrollments} enrollments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-terminal-green">
                        {course.revenue}
                      </p>
                      <p className="font-mono text-xs text-terminal-green">
                        {course.growth}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Engagement Statistics
              </CardTitle>
              <CardDescription>User interaction metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-terminal-text-muted">
                    Daily Active Users
                  </span>
                  <Badge variant="success">+15%</Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-terminal-green mb-2">
                  847
                </div>
                <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                  <div
                    className="h-full bg-terminal-green rounded-full"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-terminal-text-muted">
                    Avg. Session Duration
                  </span>
                  <Badge variant="info">23 min</Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-terminal-green mb-2">
                  28:45
                </div>
                <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: "72%" }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-terminal-text-muted">
                    Course Completion Rate
                  </span>
                  <Badge variant="warning">-3%</Badge>
                </div>
                <div className="text-2xl font-bold font-mono text-terminal-green mb-2">
                  68%
                </div>
                <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: "68%" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
            </CardTitle>
            <CardDescription>
              Monthly revenue over the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
              {[45, 67, 58, 72, 85, 92].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-terminal-green rounded-t-md hover:bg-terminal-green-light transition-all cursor-pointer group relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="success">${height * 100}</Badge>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-terminal-text-muted">
                    M{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
