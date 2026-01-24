"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  Users,
  BookOpen,
  FileText,
  Award,
  Clock,
  CheckCircle2,
  Target,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface AnalyticsData {
  overview: {
    totalProgrammes: number;
    activeProgrammes: number;
    totalStudents: number;
    totalLecturers: number;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    enrollmentTrend: number;
    averageProgress: number;
  };
  engagement: {
    activeStudentsToday: number;
    activeStudentsWeek: number;
    totalLogins: number;
    loginTrend: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    submissionGradingRate: number;
  };
  programmes: {
    topByEnrollment: Array<{
      id: string;
      title: string;
      status: string;
      enrollments: number;
    }>;
    performance: Array<{
      id: string;
      title: string;
      totalEnrollments: number;
      completedEnrollments: number;
      completionRate: number;
      averageProgress: number;
    }>;
  };
  content: {
    totalModules: number;
    totalLessons: number;
    totalResources: number;
    lessonTypeDistribution: Array<{
      type: string;
      count: number;
    }>;
  };
  trends: {
    dailyEnrollments: Array<{ date: Date; count: number }>;
    dailyLogins: Array<{ date: Date; count: number }>;
    weeklyActiveUsers: Array<{ week: Date; count: number }>;
  };
  recentActivity: {
    recentCompletions: Array<{
      id: string;
      completedAt: Date;
      studentName: string;
      programmeTitle: string;
    }>;
  };
  filters: {
    startDate: Date;
    endDate: Date;
    programmeId: string | null;
  };
}

interface Programme {
  id: string;
  title: string;
  status: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedProgramme, setSelectedProgramme] = useState<string>("all");

  useEffect(() => {
    fetchProgrammes();
  }, []);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, selectedProgramme]);

  const fetchProgrammes = async () => {
    try {
      const response = await fetch("/api/admin/programmes");
      if (!response.ok) throw new Error("Failed to fetch programmes");
      const data = await response.json();
      setProgrammes(data.programmes || []);
    } catch (err) {
      console.error("Failed to fetch programmes:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("endDate", dateRange.to.toISOString());
      }
      if (selectedProgramme !== "all") {
        params.append("programmeId", selectedProgramme);
      }

      const response = await fetch(`/api/admin/analytics?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-terminal-green";
    if (trend < 0) return "text-red-400";
    return "text-terminal-text-muted";
  };

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-terminal-green">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="font-mono text-lg">Loading analytics...</span>
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
                  Error Loading Analytics
                </h3>
                <p className="text-sm text-terminal-text-muted mb-4">{error}</p>
                <Button onClick={fetchAnalytics} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ analytics --report=comprehensive
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Real-time performance metrics and insights
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  Date Range
                </label>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
              <div>
                <label className="text-xs font-mono text-terminal-text-muted mb-2 block">
                  Programme
                </label>
                <Select
                  value={selectedProgramme}
                  onValueChange={setSelectedProgramme}
                >
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="All Programmes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programmes</SelectItem>
                    {programmes.map((programme) => (
                      <SelectItem key={programme.id} value={programme.id}>
                        {programme.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(dateRange || selectedProgramme !== "all") && (
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM dd, yyyy")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                    : "Last 30 days"}
                </Badge>
                {selectedProgramme !== "all" && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {programmes.find((p) => p.id === selectedProgramme)?.title}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange(undefined);
                    setSelectedProgramme("all");
                  }}
                  className="ml-auto text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview Metrics */}
        <div className="mb-6">
          <h2 className="font-mono text-lg font-semibold text-terminal-green mb-4">
            Overview
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:scale-105 transition-transform">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Total Programmes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {analytics.overview.totalProgrammes}
                </div>
                <p className="text-xs text-terminal-text-muted font-mono mt-1">
                  {analytics.overview.activeProgrammes} active
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {analytics.overview.totalStudents}
                </div>
                <p className="text-xs text-terminal-text-muted font-mono mt-1">
                  {analytics.overview.totalLecturers} lecturers
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold font-mono text-terminal-green">
                    {analytics.overview.activeEnrollments}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-mono ${getTrendColor(analytics.overview.enrollmentTrend)}`}
                  >
                    {getTrendIcon(analytics.overview.enrollmentTrend)}
                    {Math.abs(analytics.overview.enrollmentTrend).toFixed(1)}%
                  </div>
                </div>
                <p className="text-xs text-terminal-text-muted font-mono mt-1">
                  {analytics.overview.totalEnrollments} total
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {analytics.overview.completionRate}%
                </div>
                <p className="text-xs text-terminal-text-muted font-mono mt-1">
                  {analytics.overview.completedEnrollments} completed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="mb-6">
          <h2 className="font-mono text-lg font-semibold text-terminal-green mb-4">
            Student Engagement
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold font-mono text-terminal-green">
                      {analytics.engagement.activeStudentsToday}
                    </div>
                    <p className="text-xs text-terminal-text-muted font-mono">
                      Today (last 24 hours)
                    </p>
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-blue-400">
                      {analytics.engagement.activeStudentsWeek}
                    </div>
                    <p className="text-xs text-terminal-text-muted font-mono">
                      This week (last 7 days)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Login Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between mb-2">
                  <div className="text-2xl font-bold font-mono text-terminal-green">
                    {analytics.engagement.totalLogins}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-mono ${getTrendColor(analytics.engagement.loginTrend)}`}
                  >
                    {getTrendIcon(analytics.engagement.loginTrend)}
                    {Math.abs(analytics.engagement.loginTrend).toFixed(1)}%
                  </div>
                </div>
                <p className="text-xs text-terminal-text-muted font-mono">
                  Total logins in period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium font-mono text-terminal-text-muted flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-terminal-green mb-2">
                  {analytics.engagement.totalSubmissions}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-terminal-text-muted font-mono">
                    {analytics.engagement.gradedSubmissions} graded
                  </p>
                  <Badge variant="success" className="font-mono text-xs">
                    {analytics.engagement.submissionGradingRate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          {/* Top Programmes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Programmes by Enrollment
              </CardTitle>
              <CardDescription>
                Most popular programmes in period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.programmes.topByEnrollment.length === 0 ? (
                <div className="text-center py-8 text-terminal-text-muted font-mono text-sm">
                  No enrollments in this period
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.programmes.topByEnrollment.map(
                    (programme, index) => (
                      <div
                        key={programme.id}
                        className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full border border-terminal-green bg-terminal-green/10 font-mono font-bold text-terminal-green text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-semibold text-terminal-text text-sm truncate">
                              {programme.title}
                            </p>
                            <p className="font-mono text-xs text-terminal-text-muted">
                              {programme.status}
                            </p>
                          </div>
                        </div>
                        <Badge variant="success" className="font-mono">
                          {programme.enrollments}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Programme Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Programme Performance
              </CardTitle>
              <CardDescription>Completion rates and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.programmes.performance.length === 0 ? (
                <div className="text-center py-8 text-terminal-text-muted font-mono text-sm">
                  No performance data available
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.programmes.performance
                    .slice(0, 5)
                    .map((programme) => (
                      <div
                        key={programme.id}
                        className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-mono font-semibold text-terminal-text text-sm truncate flex-1">
                            {programme.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {programme.completionRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between text-xs font-mono text-terminal-text-muted mb-1">
                              <span>
                                Progress: {programme.averageProgress.toFixed(1)}
                                %
                              </span>
                              <span>
                                {programme.completedEnrollments}/
                                {programme.totalEnrollments}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                              <div
                                className="h-full bg-terminal-green rounded-full transition-all"
                                style={{
                                  width: `${programme.averageProgress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Statistics */}
        <div className="mb-6">
          <h2 className="font-mono text-lg font-semibold text-terminal-green mb-4">
            Content Statistics
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono text-terminal-green">
                      {analytics.content.totalModules}
                    </div>
                    <p className="text-xs font-mono text-terminal-text-muted mt-1">
                      Modules
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
                    <div className="text-2xl font-bold font-mono text-terminal-green">
                      {analytics.content.totalLessons}
                    </div>
                    <p className="text-xs font-mono text-terminal-text-muted mt-1">
                      Lessons
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold font-mono text-terminal-green">
                      {analytics.content.totalResources}
                    </div>
                    <p className="text-xs font-mono text-terminal-text-muted mt-1">
                      Resources
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-yellow-400/50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-xs font-mono text-terminal-text-muted mb-2">
                    Lesson Types
                  </p>
                  <div className="space-y-1">
                    {analytics.content.lessonTypeDistribution.map((item) => (
                      <div
                        key={item.type}
                        className="flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-terminal-text-muted">
                          {item.type}
                        </span>
                        <span className="text-terminal-green font-semibold">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Trends */}
        <div className="mb-6">
          <h2 className="font-mono text-lg font-semibold text-terminal-green mb-4">
            Activity Trends
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Enrollments Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily Enrollments
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.trends.dailyEnrollments.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-terminal-text-muted font-mono text-sm">
                    No enrollment data available
                  </div>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-1 p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                    {analytics.trends.dailyEnrollments
                      .slice(-30)
                      .map((day, index) => {
                        const maxCount = Math.max(
                          ...analytics.trends.dailyEnrollments.map(
                            (d) => d.count,
                          ),
                        );
                        const height =
                          maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center gap-1 group relative"
                          >
                            <div
                              className="w-full bg-terminal-green rounded-t-md hover:bg-terminal-green-light transition-all cursor-pointer min-h-0.5"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                <Badge variant="success" className="text-xs">
                                  {day.count}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Logins Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Daily Active Users
                </CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.trends.dailyLogins.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-terminal-text-muted font-mono text-sm">
                    No login data available
                  </div>
                ) : (
                  <div className="h-48 flex items-end justify-between gap-1 p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                    {analytics.trends.dailyLogins
                      .slice(-30)
                      .map((day, index) => {
                        const maxCount = Math.max(
                          ...analytics.trends.dailyLogins.map((d) => d.count),
                        );
                        const height =
                          maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                        return (
                          <div
                            key={index}
                            className="flex-1 flex flex-col items-center gap-1 group relative"
                          >
                            <div
                              className="w-full bg-blue-400 rounded-t-md hover:bg-blue-300 transition-all cursor-pointer min-h-0.5"
                              style={{ height: `${Math.max(height, 2)}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                <Badge variant="info" className="text-xs">
                                  {day.count}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Completions */}
        {analytics.recentActivity.recentCompletions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Completions
              </CardTitle>
              <CardDescription>Latest programme completions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.recentCompletions.map(
                  (completion) => (
                    <div
                      key={completion.id}
                      className="flex items-center justify-between p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-terminal-green" />
                        <div>
                          <p className="font-mono font-semibold text-terminal-text text-sm">
                            {completion.studentName}
                          </p>
                          <p className="font-mono text-xs text-terminal-text-muted">
                            {completion.programmeTitle}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {format(
                          new Date(completion.completedAt),
                          "MMM dd, yyyy",
                        )}
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
