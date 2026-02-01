"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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

interface BulkActionsProps {
  assignmentId: string;
  assignmentTitle: string;
  dueDate: string;
  maxPoints: number;
  submissions: Submission[];
}

interface DownloadProgress {
  phase: "preparing" | "downloading" | "zipping" | "complete" | "error";
  currentBatch: number;
  totalBatches: number;
  filesDownloaded: number;
  totalFiles: number;
  currentFileName?: string;
  zipProgress?: number;
  errorMessage?: string;
}

export function BulkSubmissionActions({
  assignmentId,
  assignmentTitle,
  dueDate,
  maxPoints,
  submissions,
}: BulkActionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Export submissions to XLSX
  const exportToExcel = useCallback(async () => {
    if (!submissions.length) {
      toast.error("No submissions to export");
      return;
    }

    setIsExporting(true);
    try {
      const dueDateObj = new Date(dueDate);

      // Prepare data for Excel
      const excelData = submissions.map((sub, index) => {
        const submittedDate = new Date(sub.submittedAt);
        const isLate = submittedDate > dueDateObj;
        const fileNames =
          sub.attachments?.map((a) => a.fileName).join(", ") || "No files";

        return {
          "#": index + 1,
          "Student Name": sub.user?.name || "Unknown",
          Email: sub.user?.email || "N/A",
          "Submitted At": submittedDate.toLocaleString(),
          Status: isLate ? "Late" : "On Time",
          Grade:
            sub.grade !== null ? `${sub.grade}/${maxPoints}` : "Not Graded",
          "Grade (Points)": sub.grade ?? "",
          "Files Count": sub.attachments?.length || 0,
          "File Names": fileNames,
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Assignment Submissions Report"],
        [""],
        ["Assignment", assignmentTitle],
        ["Due Date", new Date(dueDate).toLocaleString()],
        ["Max Points", maxPoints],
        [""],
        ["Total Submissions", submissions.length],
        ["Graded", submissions.filter((s) => s.grade !== null).length],
        ["Pending", submissions.filter((s) => s.grade === null).length],
        [
          "Late Submissions",
          submissions.filter((s) => new Date(s.submittedAt) > dueDateObj)
            .length,
        ],
        [""],
        ["Report Generated", new Date().toLocaleString()],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // Submissions sheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 5 }, // #
        { wch: 25 }, // Student Name
        { wch: 30 }, // Email
        { wch: 22 }, // Submitted At
        { wch: 10 }, // Status
        { wch: 12 }, // Grade
        { wch: 12 }, // Grade (Points)
        { wch: 12 }, // Files Count
        { wch: 50 }, // File Names
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Submissions");

      // Generate and download
      const fileName = `${assignmentTitle.replace(/[^a-z0-9]/gi, "_")}_submissions_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Export Complete", {
        description: `Downloaded ${fileName}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export Failed", {
        description: "Could not generate Excel file",
      });
    } finally {
      setIsExporting(false);
    }
  }, [submissions, assignmentTitle, dueDate, maxPoints]);

  // Cancel ongoing download
  const cancelDownload = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setDownloadProgress(null);
    toast.info("Download cancelled");
  }, [abortController]);

  // Download all files as ZIP (batched)
  const downloadAllFiles = useCallback(async () => {
    const totalFiles = submissions.reduce(
      (acc, sub) => acc + (sub.attachments?.length || 0),
      0,
    );

    if (totalFiles === 0) {
      toast.error("No files to download");
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    setDownloadProgress({
      phase: "preparing",
      currentBatch: 0,
      totalBatches: 0,
      filesDownloaded: 0,
      totalFiles,
    });

    try {
      const zip = new JSZip();
      const BATCH_SIZE = 5; // Files per batch to avoid overwhelming
      let filesDownloaded = 0;
      let currentBatch = 0;

      // Get first batch to know total batches
      const firstResponse = await fetch(
        `/api/admin/assignments/${assignmentId}/bulk-download?batch=0&batchSize=${BATCH_SIZE}`,
        { signal: controller.signal },
      );

      if (!firstResponse.ok) {
        throw new Error("Failed to prepare download");
      }

      const firstData = await firstResponse.json();
      const totalBatches = firstData.batch.total;

      setDownloadProgress((prev) => ({
        ...prev!,
        phase: "downloading",
        totalBatches,
      }));

      // Process all batches
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (controller.signal.aborted) break;

        currentBatch = batchIndex;

        // Fetch batch (skip first if already fetched)
        const batchData =
          batchIndex === 0
            ? firstData
            : await fetch(
                `/api/admin/assignments/${assignmentId}/bulk-download?batch=${batchIndex}&batchSize=${BATCH_SIZE}`,
                { signal: controller.signal },
              ).then((r) => r.json());

        // Download files in this batch
        for (const file of batchData.files) {
          if (controller.signal.aborted) break;

          setDownloadProgress((prev) => ({
            ...prev!,
            currentBatch,
            currentFileName: file.fileName,
          }));

          try {
            // Download file content via our proxy endpoint
            // fileKey is like "submissions/timestamp-file.pdf" - don't encode the slash
            const fileResponse = await fetch(`/api/download/${file.fileKey}`, {
              signal: controller.signal,
            });
            if (!fileResponse.ok) {
              console.warn(`Failed to download: ${file.fileName}`);
              continue;
            }

            const blob = await fileResponse.blob();

            // Organize by student: StudentName_Email/filename
            const studentFolder = `${file.studentName.replace(/[^a-z0-9]/gi, "_")}_${file.studentEmail.split("@")[0]}`;
            zip.file(`${studentFolder}/${file.fileName}`, blob);

            filesDownloaded++;
            setDownloadProgress((prev) => ({
              ...prev!,
              filesDownloaded,
            }));
          } catch (fileError) {
            if ((fileError as Error).name === "AbortError") throw fileError;
            console.warn(`Error downloading ${file.fileName}:`, fileError);
          }
        }

        // Small delay between batches to prevent overwhelming
        if (batchIndex < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (controller.signal.aborted) return;

      // Generate ZIP
      setDownloadProgress((prev) => ({
        ...prev!,
        phase: "zipping",
        zipProgress: 0,
      }));

      const zipBlob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          setDownloadProgress((prev) => ({
            ...prev!,
            zipProgress: Math.round(metadata.percent),
          }));
        },
      );

      // Download ZIP
      const zipFileName = `${assignmentTitle.replace(/[^a-z0-9]/gi, "_")}_submissions_${new Date().toISOString().split("T")[0]}.zip`;
      saveAs(zipBlob, zipFileName);

      setDownloadProgress({
        phase: "complete",
        currentBatch: totalBatches,
        totalBatches,
        filesDownloaded,
        totalFiles,
      });

      toast.success("Download Complete", {
        description: `Downloaded ${filesDownloaded} files as ${zipFileName}`,
      });

      // Clear progress after a delay
      setTimeout(() => setDownloadProgress(null), 3000);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return; // User cancelled
      }
      console.error("Bulk download error:", error);
      setDownloadProgress((prev) => ({
        ...prev!,
        phase: "error",
        errorMessage:
          error instanceof Error ? error.message : "Download failed",
      }));
      toast.error("Download Failed", {
        description: "Could not download all files. Please try again.",
      });
    } finally {
      setAbortController(null);
    }
  }, [assignmentId, assignmentTitle, submissions]);

  const totalFiles = submissions.reduce(
    (acc, sub) => acc + (sub.attachments?.length || 0),
    0,
  );

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={exportToExcel}
          disabled={isExporting || !!downloadProgress}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          Export to Excel
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={downloadAllFiles}
          disabled={totalFiles === 0 || !!downloadProgress}
        >
          <Package className="h-4 w-4 mr-2" />
          Download All Files ({totalFiles})
        </Button>
      </div>

      {/* Download Progress */}
      {downloadProgress && (
        <Card className="p-4 bg-terminal-darker">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {downloadProgress.phase === "complete" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : downloadProgress.phase === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-terminal-accent" />
                )}
                <span className="font-medium">
                  {downloadProgress.phase === "preparing" &&
                    "Preparing download..."}
                  {downloadProgress.phase === "downloading" &&
                    "Downloading files..."}
                  {downloadProgress.phase === "zipping" &&
                    "Creating ZIP archive..."}
                  {downloadProgress.phase === "complete" &&
                    "Download complete!"}
                  {downloadProgress.phase === "error" && "Download failed"}
                </span>
              </div>
              {downloadProgress.phase !== "complete" &&
                downloadProgress.phase !== "error" && (
                  <Button size="sm" variant="ghost" onClick={cancelDownload}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
            </div>

            {downloadProgress.phase === "downloading" && (
              <>
                <Progress
                  value={
                    (downloadProgress.filesDownloaded /
                      downloadProgress.totalFiles) *
                    100
                  }
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-terminal-text-muted">
                  <span>
                    {downloadProgress.filesDownloaded} /{" "}
                    {downloadProgress.totalFiles} files
                  </span>
                  <span>
                    Batch {downloadProgress.currentBatch + 1} /{" "}
                    {downloadProgress.totalBatches}
                  </span>
                </div>
                {downloadProgress.currentFileName && (
                  <p className="text-xs text-terminal-text-muted truncate">
                    Downloading: {downloadProgress.currentFileName}
                  </p>
                )}
              </>
            )}

            {downloadProgress.phase === "zipping" && (
              <>
                <Progress
                  value={downloadProgress.zipProgress || 0}
                  className="h-2"
                />
                <p className="text-xs text-terminal-text-muted">
                  Compressing... {downloadProgress.zipProgress}%
                </p>
              </>
            )}

            {downloadProgress.phase === "error" &&
              downloadProgress.errorMessage && (
                <p className="text-xs text-red-400">
                  {downloadProgress.errorMessage}
                </p>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}
