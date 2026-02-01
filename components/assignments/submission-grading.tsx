"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  Download,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SubmissionGradingProps {
  submissionId: string;
  onGraded?: () => void;
}

export function SubmissionGrading({
  submissionId,
  onGraded,
}: SubmissionGradingProps) {
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch submission");
      }

      setSubmission(data);
      setGrade(data.grade !== null ? data.grade.toString() : "");
      setFeedback(data.feedback || "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load submission";
      toast.error("Load Failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (attachmentId: string) => {
    try {
      const response = await fetch(
        `/api/student/submissions/${submissionId}/download?attachmentId=${attachmentId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to download file");
      }

      window.open(data.url, "_blank");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not download file";
      toast.error("Download Failed", {
        description: message,
      });
    }
  };

  const handleGrade = async () => {
    const gradeNum = Number(grade);

    if (isNaN(gradeNum) || gradeNum < 0) {
      toast.error("Invalid Grade", {
        description: "Please enter a valid grade",
      });
      return;
    }

    if (gradeNum > submission.assignment.maxPoints) {
      toast.error("Grade Too High", {
        description: `Grade cannot exceed ${submission.assignment.maxPoints} points`,
      });
      return;
    }

    setIsGrading(true);

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: gradeNum,
          feedback: feedback.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grade submission");
      }

      toast.success("Grading Complete!", {
        description: "Submission graded successfully",
      });

      await fetchSubmission();
      onGraded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Grading failed";
      toast.error("Grading Failed", {
        description: message,
      });
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-terminal-accent" />
        <p className="text-terminal-text-muted">Submission not found</p>
      </Card>
    );
  }

  const submittedDate = new Date(submission.submittedAt);
  const dueDate = new Date(submission.assignment.dueDate);
  const isLate = submittedDate > dueDate;
  const hasGrade = submission.grade !== null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {submission.assignment.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-terminal-text-muted">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {submission.student.firstName} {submission.student.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Submitted {submittedDate.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={hasGrade ? "default" : "outline"}>
              {hasGrade ? "Graded" : "Pending"}
            </Badge>
            {isLate && <Badge variant="danger">Late</Badge>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div>
            <Label className="text-terminal-text-muted">Due Date</Label>
            <p className="mt-1">{dueDate.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-terminal-text-muted">Maximum Points</Label>
            <p className="mt-1 text-lg font-semibold">
              {submission.assignment.maxPoints}
            </p>
          </div>
        </div>

        {submission.assignment.instructions && (
          <div className="mb-6">
            <Label>Assignment Instructions</Label>
            <div className="mt-2 p-4 bg-terminal-darker border border-terminal-border rounded-md">
              <p className="whitespace-pre-wrap text-sm">
                {submission.assignment.instructions}
              </p>
            </div>
          </div>
        )}

        {submission.notes && (
          <div className="mb-6">
            <Label>Student Notes</Label>
            <div className="mt-2 p-4 bg-terminal-darker border border-terminal-border rounded-md">
              <p className="whitespace-pre-wrap">{submission.notes}</p>
            </div>
          </div>
        )}

        <div>
          <Label className="mb-3 block">Submitted Files</Label>
          <div className="space-y-2">
            {submission.attachments?.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-terminal-darker border border-terminal-border rounded-md"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-terminal-accent" />
                  <div>
                    <p className="font-medium">{attachment.filename}</p>
                    <p className="text-sm text-terminal-text-muted">
                      {(attachment.fileSize / 1024).toFixed(1)} KB •{" "}
                      {new Date(attachment.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadFile(attachment.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {hasGrade ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              Update Grade
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-terminal-accent" />
              Grade Submission
            </>
          )}
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="grade">
              Grade (out of {submission.assignment.maxPoints}) *
            </Label>
            <Input
              id="grade"
              type="number"
              min="0"
              max={submission.assignment.maxPoints}
              step="0.5"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder={`0-${submission.assignment.maxPoints}`}
              disabled={isGrading}
              className="max-w-xs"
            />
          </div>

          <div>
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for the student..."
              rows={6}
              disabled={isGrading}
            />
          </div>

          <Button
            onClick={handleGrade}
            disabled={isGrading || !grade}
            className="w-full"
            size="lg"
          >
            {isGrading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasGrade ? "Update Grade" : "Submit Grade"}
          </Button>
        </div>

        {hasGrade && (
          <div className="mt-6 p-4 bg-terminal-accent/10 border border-terminal-accent rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-terminal-text-muted">
                Previously Graded
              </span>
              <span className="text-xl font-bold">
                {submission.grade} / {submission.assignment.maxPoints}
              </span>
            </div>
            <p className="text-sm text-terminal-text-muted">
              Graded on {new Date(submission.gradedAt).toLocaleString()} by{" "}
              {submission.gradedBy.firstName} {submission.gradedBy.lastName}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
