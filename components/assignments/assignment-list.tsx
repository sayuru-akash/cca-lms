"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { isDeadlinePassed } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  FileText,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { AssignmentForm } from "./assignment-form";
import { SubmissionGrading } from "./submission-grading";
import { AssignmentAnalytics } from "./assignment-analytics";
import { BulkSubmissionActions } from "./bulk-submission-actions";

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueDate: string;
  maxPoints: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  maxFiles: number;
  allowLateSubmission: boolean;
  _count?: { assignmentSubmissions: number };
}

interface Submission {
  id: string;
  submittedAt: string;
  grade: number | null;
  user?: { id: string; name: string | null; email: string };
  attachments?: {
    id: string;
    fileKey: string;
    fileName: string;
    fileSize?: number;
  }[];
}

interface AssignmentWithSubmissions extends Assignment {
  submissions?: Submission[];
}

interface AssignmentListProps {
  lessonId: string;
  role: "ADMIN" | "LECTURER" | "STUDENT";
}

export function AssignmentList({ lessonId, role }: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  );
  const [viewingSubmissions, setViewingSubmissions] =
    useState<AssignmentWithSubmissions | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null,
  );
  const [viewingAnalytics, setViewingAnalytics] = useState<string | null>(null);

  const isInstructor = role === "ADMIN" || role === "LECTURER";

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/assignments?lessonId=${lessonId}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch assignments");
      }

      setAssignments(data.assignments || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load assignments";
      toast.error("Load Failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const confirm = useConfirm();

  const handleDelete = async (assignmentId: string, forceDelete = false) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    const submissionCount = assignment?._count?.assignmentSubmissions || 0;

    // If not force delete, show initial confirmation
    if (!forceDelete) {
      const confirmed = await confirm({
        title: "Delete Assignment",
        description:
          submissionCount > 0
            ? `This assignment has ${submissionCount} submission(s). Deleting it will permanently remove all student submissions and uploaded files.`
            : "Are you sure you want to delete this assignment? This action cannot be undone.",
        variant: "danger",
        confirmText: "Delete",
        details:
          submissionCount > 0
            ? [
                `Assignment: ${assignment?.title}`,
                `Submissions: ${submissionCount}`,
              ]
            : undefined,
      });

      if (!confirmed) return;
    }

    try {
      const url = forceDelete
        ? `/api/admin/assignments/${assignmentId}?force=true`
        : `/api/admin/assignments/${assignmentId}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        // If deletion failed due to submissions and not already force deleting
        if (data.error?.includes("submissions") && !forceDelete) {
          const forceConfirmed = await confirm({
            title: "Assignment Has Submissions",
            description: `This assignment has ${data.submissionCount || "existing"} submission(s). To delete it, you must confirm by typing "DELETE" below.`,
            variant: "danger",
            confirmText: "Force Delete",
            requireTypedConfirmation: "DELETE",
            details: [
              `All ${data.submissionCount || ""} submissions will be permanently deleted`,
              "All uploaded files will be removed from storage",
              "This action cannot be undone",
            ],
          });

          if (forceConfirmed) {
            return handleDelete(assignmentId, true);
          }
          return;
        }
        throw new Error(data.error || "Failed to delete assignment");
      }

      toast.success("Assignment Deleted", {
        description: forceDelete
          ? `Assignment and ${data.deletedSubmissions || 0} submissions removed`
          : "Assignment removed successfully",
      });

      fetchAssignments();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Deletion failed";
      toast.error("Delete Failed", { description: message });
    }
  };

  const viewSubmissions = async (assignment: Assignment) => {
    try {
      const response = await fetch(`/api/admin/assignments/${assignment.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch submissions");
      }

      setViewingSubmissions({
        ...data.assignment,
        submissions: data.assignment.assignmentSubmissions,
      });
    } catch {
      toast.error("Load Failed", {
        description: "Could not load submissions",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isInstructor && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Assignments</h3>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      )}

      {assignments.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-terminal-text-muted" />
          <p className="text-terminal-text-muted">
            {isInstructor
              ? "No assignments yet. Create one to get started."
              : "No assignments available for this lesson."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const isOverdue = isDeadlinePassed(dueDate);
            const hasSubmission =
              (assignment._count?.assignmentSubmissions ?? 0) > 0;

            return (
              <Card key={assignment.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">
                        {assignment.title}
                      </h4>
                      <Badge variant={isOverdue ? "danger" : "default"}>
                        {isOverdue ? "Overdue" : "Active"}
                      </Badge>
                      {hasSubmission && (
                        <Badge variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-terminal-text-muted mb-3">
                        {assignment.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-terminal-text-muted">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Due {dueDate.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{assignment.maxPoints} points</span>
                      </div>
                      {isInstructor && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {assignment._count?.assignmentSubmissions || 0}{" "}
                            submissions
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isInstructor ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewSubmissions(assignment)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Submissions
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingAnalytics(assignment.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingAssignment(assignment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role === "ADMIN" && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `/learn/assignment/${assignment.id}`;
                        }}
                      >
                        {hasSubmission ? "View Submission" : "Submit Work"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingAssignment}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingAssignment(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? "Edit Assignment" : "Create Assignment"}
            </DialogTitle>
          </DialogHeader>
          <AssignmentForm
            lessonId={lessonId}
            existingAssignment={editingAssignment || undefined}
            userRole={role as "ADMIN" | "LECTURER"}
            onSuccess={() => {
              setShowCreateDialog(false);
              setEditingAssignment(null);
              fetchAssignments();
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingAssignment(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog
        open={!!viewingSubmissions}
        onOpenChange={(open) => {
          if (!open) {
            setViewingSubmissions(null);
            setSelectedSubmission(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission ? "Grade Submission" : "Submissions"}
            </DialogTitle>
          </DialogHeader>

          {selectedSubmission ? (
            <SubmissionGrading
              submissionId={selectedSubmission}
              onGraded={() => {
                setSelectedSubmission(null);
                if (viewingSubmissions) {
                  viewSubmissions(viewingSubmissions);
                }
              }}
            />
          ) : (
            <div className="space-y-4">
              {/* Bulk Actions */}
              {viewingSubmissions &&
                viewingSubmissions.submissions &&
                viewingSubmissions.submissions.length > 0 && (
                  <BulkSubmissionActions
                    assignmentId={viewingSubmissions.id}
                    assignmentTitle={viewingSubmissions.title}
                    dueDate={viewingSubmissions.dueDate}
                    maxPoints={viewingSubmissions.maxPoints}
                    submissions={viewingSubmissions.submissions}
                  />
                )}

              {!viewingSubmissions?.submissions?.length ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-terminal-text-muted" />
                  <p className="text-terminal-text-muted">
                    No submissions yet for this assignment
                  </p>
                </div>
              ) : (
                viewingSubmissions?.submissions?.map(
                  (submission: Submission) => {
                    const submittedDate = new Date(submission.submittedAt);
                    const dueDate = new Date(viewingSubmissions.dueDate);
                    const isLate = submittedDate > dueDate;
                    const hasGrade = submission.grade !== null;

                    return (
                      <Card key={submission.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">
                                {submission.user?.name || "Unknown Student"}
                              </h4>
                              {hasGrade && (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {submission.grade}/
                                  {viewingSubmissions.maxPoints}
                                </Badge>
                              )}
                              {isLate && <Badge variant="danger">Late</Badge>}
                            </div>
                            <div className="text-sm text-terminal-text-muted space-y-1">
                              <p>Submitted: {submittedDate.toLocaleString()}</p>
                              <p>
                                Files: {submission.attachments?.length || 0}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setSelectedSubmission(submission.id)}
                          >
                            {hasGrade ? "View/Update" : "Grade"}
                          </Button>
                        </div>
                      </Card>
                    );
                  },
                )
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog
        open={!!viewingAnalytics}
        onOpenChange={() => setViewingAnalytics(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-terminal-text">
                Assignment Analytics
              </h2>
              <p className="text-sm text-terminal-text-muted">
                Track submission progress and performance metrics
              </p>
            </div>
            {viewingAnalytics && (
              <AssignmentAnalytics assignmentId={viewingAnalytics} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
