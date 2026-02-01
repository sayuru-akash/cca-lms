"use client";

import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface StudentSubmissionProps {
  assignmentId: string;
}

export function StudentSubmission({ assignmentId }: StudentSubmissionProps) {
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [enrollmentError, setEnrollmentError] = useState(false);
  const [serverCanSubmit, setServerCanSubmit] = useState(true);
  const [serverIsOverdue, setServerIsOverdue] = useState(false);

  const fetchAssignmentAndSubmission = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/student/assignments/${assignmentId}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.error?.includes("not enrolled")) {
          setEnrollmentError(true);
        }
        throw new Error(data.error || "Failed to fetch assignment");
      }

      setAssignment(data.assignment);
      setSubmission(data.submission);
      setServerCanSubmit(data.canSubmit);
      setServerIsOverdue(data.isOverdue);
      setNotes(data.submission?.notes || "");
      setEnrollmentError(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load assignment";
      toast.error("Load Failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentAndSubmission();
  }, [assignmentId]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const maxFiles = assignment?.maxFiles || 5;
      const maxFileSize = assignment?.maxFileSize || 10485760;
      const allowedTypes = assignment?.allowedFileTypes || [];

      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error("Too Many Files", {
          description: `You can only upload ${maxFiles} file${maxFiles > 1 ? "s" : ""}`,
        });
        return;
      }

      const invalidFiles = acceptedFiles.filter((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (!extension || !allowedTypes.includes(extension)) {
          toast.error("Invalid File Type", {
            description: `${file.name} is not an allowed file type`,
          });
          return true;
        }
        if (file.size > maxFileSize) {
          toast.error("File Too Large", {
            description: `${file.name} exceeds ${(maxFileSize / 1048576).toFixed(0)}MB limit`,
          });
          return true;
        }
        return false;
      });

      const validFiles = acceptedFiles.filter(
        (file) => !invalidFiles.includes(file),
      );
      setFiles([...files, ...validFiles]);
    },
    [files, assignment],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isSubmitting || !serverCanSubmit || !!submission,
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("No Files", {
        description: "Please select at least one file to upload",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      formData.append("notes", notes);
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/student/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit assignment");
      }

      toast.success("Submission Complete!", {
        description: "Your assignment has been submitted successfully",
        duration: 5000,
      });

      setFiles([]);
      setNotes("");
      await fetchAssignmentAndSubmission();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed";
      toast.error("Submission Failed", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadFile = async (attachment: { id: string; fileKey: string }) => {
    // Open via our proxy endpoint to show our domain URL
    // fileKey is like "submissions/timestamp-file.pdf" - don't encode the slash
    window.open(`/api/download/${attachment.fileKey}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-accent" />
      </div>
    );
  }

  if (enrollmentError) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-terminal-accent" />
          <h3 className="text-lg font-semibold mb-2">Cannot Submit</h3>
          <p className="text-terminal-text-muted">
            You are not enrolled in this course
          </p>
        </div>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-terminal-accent" />
        <p className="text-terminal-text-muted">Assignment not found</p>
      </Card>
    );
  }

  const dueDate = new Date(assignment.dueDate);
  const isOverdue = serverIsOverdue; // Use server-calculated value from API response root
  const canSubmit = serverCanSubmit; // Use server's canSubmit from API response root
  const canDownload = submission && !isOverdue;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{assignment.title}</h2>
            {assignment.description && (
              <p className="text-terminal-text-muted mt-2">
                {assignment.description}
              </p>
            )}
          </div>
          <Badge variant={isOverdue ? "danger" : "default"}>
            {isOverdue ? "Overdue" : "Active"}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div>
            <Label className="text-terminal-text-muted">Due Date</Label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              <span>
                {dueDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div>
            <Label className="text-terminal-text-muted">Maximum Points</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-semibold">
                {assignment.maxPoints}
              </span>
            </div>
          </div>
        </div>

        {assignment.instructions && (
          <div className="mb-6">
            <Label>Instructions</Label>
            <div className="mt-2 p-4 bg-terminal-darker border border-terminal-border rounded-md">
              <p className="whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Allowed File Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {assignment.allowedFileTypes.map((type: string) => (
                <Badge key={type} variant="outline">
                  .{type}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <span className="text-terminal-text-muted">Max file size:</span>{" "}
              <span className="font-medium">
                {(assignment.maxFileSize / 1048576).toFixed(0)}MB
              </span>
            </div>
            <div>
              <span className="text-terminal-text-muted">Max files:</span>{" "}
              <span className="font-medium">{assignment.maxFiles}</span>
            </div>
          </div>
        </div>
      </Card>

      {submission ? (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Submission Complete</h3>
              <p className="text-sm text-terminal-text-muted">
                Submitted on {new Date(submission.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {submission.notes && (
            <div className="mb-6">
              <Label>Your Notes</Label>
              <div className="mt-2 p-3 bg-terminal-darker border border-terminal-border rounded-md">
                <p className="whitespace-pre-wrap">{submission.notes}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <Label>Submitted Files</Label>
            <div className="mt-2 space-y-2">
              {submission.attachments?.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-terminal-darker border border-terminal-border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-terminal-accent" />
                    <div>
                      <p className="font-medium">{attachment.fileName}</p>
                      <p className="text-sm text-terminal-text-muted">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  {canDownload ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Download locked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            {!canDownload && isOverdue && (
              <p className="text-xs text-terminal-text-muted mt-2">
                Downloads are locked after the deadline expires
              </p>
            )}
          </div>

          {submission.grade !== null ? (
            <div className="p-4 bg-terminal-accent/10 border border-terminal-accent rounded-md">
              <div className="flex items-center justify-between mb-3">
                <Label>Grade</Label>
                <span className="text-2xl font-bold">
                  {submission.grade} / {assignment.maxPoints}
                </span>
              </div>
              {submission.feedback && (
                <div>
                  <Label>Feedback</Label>
                  <p className="mt-2 whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                </div>
              )}
              <p className="text-sm text-terminal-text-muted mt-3">
                Graded on {new Date(submission.gradedAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-terminal-darker border border-terminal-border rounded-md text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-terminal-text-muted" />
              <p className="text-terminal-text-muted">Awaiting grading</p>
              {canSubmit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSubmission(null);
                    setFiles([]);
                    setNotes("");
                  }}
                >
                  Resubmit Assignment
                </Button>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          {!canSubmit ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-terminal-accent" />
              <h3 className="text-lg font-semibold mb-2">Cannot Submit</h3>
              <p className="text-terminal-text-muted">
                The deadline has passed and late submissions are not allowed
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-4">Submit Your Work</h3>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-terminal-accent bg-terminal-accent/10"
                    : "border-terminal-border hover:border-terminal-accent/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-terminal-text-muted" />
                {isDragActive ? (
                  <p className="text-terminal-text">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-terminal-text mb-2">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-sm text-terminal-text-muted">
                      Max {assignment.maxFiles} files, up to{" "}
                      {(assignment.maxFileSize / 1048576).toFixed(0)}MB each
                    </p>
                  </div>
                )}
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-terminal-darker border border-terminal-border rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-terminal-accent" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-terminal-text-muted">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any comments or notes about your submission..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || files.length === 0}
                className="w-full mt-6"
                size="lg"
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Submit Assignment
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
