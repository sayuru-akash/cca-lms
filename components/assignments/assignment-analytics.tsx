"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { isDeadlinePassed } from "@/lib/utils";
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AnalyticsData {
  assignment: {
    id: string;
    title: string;
    dueDate: string;
    maxPoints: number;
  };
  overview: {
    totalStudents: number;
    totalSubmissions: number;
    submissionRate: number;
    notSubmittedCount: number;
    gradedSubmissions: number;
    pendingGrading: number;
    gradingRate: number;
    lateSubmissions: number;
    averageGrade: number | null;
  };
  gradeDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  notSubmittedStudents: Student[];
}

interface AssignmentAnalyticsProps {
  assignmentId: string;
}

export function AssignmentAnalytics({
  assignmentId,
}: AssignmentAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/assignments/${assignmentId}/analytics`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch analytics");
      }

      setAnalytics(data);
    } catch (error) {
      toast.error("Failed to Load Analytics", {
        description:
          error instanceof Error ? error.message : "Could not load analytics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  if (isLoading || !analytics) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-terminal-darker animate-pulse rounded-lg" />
        <div className="h-32 bg-terminal-darker animate-pulse rounded-lg" />
      </div>
    );
  }

  const { overview, gradeDistribution, notSubmittedStudents } = analytics;
  const dueDate = new Date(analytics.assignment.dueDate);
  const isOverdue = isDeadlinePassed(dueDate);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-terminal-accent/10 rounded-lg">
              <Users className="h-5 w-5 text-terminal-accent" />
            </div>
            <div>
              <p className="text-sm text-terminal-text-muted">
                Enrolled Students
              </p>
              <p className="text-2xl font-bold">{overview.totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-terminal-text-muted">Submissions</p>
              <p className="text-2xl font-bold">{overview.totalSubmissions}</p>
              <p className="text-xs text-terminal-text-muted">
                {overview.submissionRate}% submitted
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-terminal-text-muted">
                Pending Grading
              </p>
              <p className="text-2xl font-bold">{overview.pendingGrading}</p>
              <p className="text-xs text-terminal-text-muted">
                {overview.gradingRate}% graded
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-terminal-text-muted">Average Grade</p>
              <p className="text-2xl font-bold">
                {overview.averageGrade !== null
                  ? `${overview.averageGrade}/${analytics.assignment.maxPoints}`
                  : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Submission Progress */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Submission Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Submitted</span>
              <span className="font-medium">
                {overview.totalSubmissions} / {overview.totalStudents}
              </span>
            </div>
            <Progress value={overview.submissionRate} />
          </div>

          {overview.lateSubmissions > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span>{overview.lateSubmissions} late submission(s)</span>
            </div>
          )}

          {isOverdue && overview.notSubmittedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                {overview.notSubmittedCount} student(s) missed the deadline
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Grade Distribution */}
      {overview.gradedSubmissions > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="success">Excellent</Badge>
                <span className="text-sm text-terminal-text-muted">≥ 90%</span>
              </div>
              <span className="font-medium">{gradeDistribution.excellent}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="info">Good</Badge>
                <span className="text-sm text-terminal-text-muted">70-89%</span>
              </div>
              <span className="font-medium">{gradeDistribution.good}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="warning">Average</Badge>
                <span className="text-sm text-terminal-text-muted">50-69%</span>
              </div>
              <span className="font-medium">{gradeDistribution.average}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="danger">Needs Improvement</Badge>
                <span className="text-sm text-terminal-text-muted">
                  &lt; 50%
                </span>
              </div>
              <span className="font-medium">{gradeDistribution.poor}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Students Not Submitted */}
      {notSubmittedStudents.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Students Not Submitted ({notSubmittedStudents.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const emails = notSubmittedStudents
                  .map((s: Student) => s.email)
                  .join(", ");
                navigator.clipboard.writeText(emails);
                toast.success("Copied!", {
                  description: "Email addresses copied to clipboard",
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Copy Emails
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notSubmittedStudents.map((student: Student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-terminal-darker rounded-md"
              >
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-terminal-text-muted">
                    {student.email}
                  </p>
                </div>
                <Badge variant="outline">Not submitted</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Assignment Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-terminal-accent" />
          <h3 className="text-lg font-semibold">
            {analytics.assignment.title}
          </h3>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-terminal-text-muted">Due Date:</span>
            <span className="font-medium">{dueDate.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-text-muted">Maximum Points:</span>
            <span className="font-medium">
              {analytics.assignment.maxPoints}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-text-muted">Status:</span>
            <Badge variant={isOverdue ? "danger" : "success"}>
              {isOverdue ? "Closed" : "Open"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
