"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Programme {
  id: string;
  title: string;
}

interface EnrollmentPreview {
  userId: string;
  userName: string;
  userEmail: string;
  programmeId: string;
  programmeTitle: string;
  status: "valid" | "error" | "duplicate";
  error?: string;
}

export default function BulkEnrollClient() {
  const [userType, setUserType] = useState<"STUDENT" | "LECTURER">("STUDENT");
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EnrollmentPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      const response = await fetch("/api/admin/programmes?perPage=1000");
      if (!response.ok) throw new Error("Failed to fetch programmes");
      const data = await response.json();
      setProgrammes(data.programmes);
    } catch (error) {
      console.error("Failed to fetch programmes:", error);
      setError("Failed to load programmes");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/bulk-enroll/template?userType=${userType}`,
      );
      if (!response.ok) throw new Error("Failed to download template");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-enroll-${userType.toLowerCase()}-template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download template",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setPreview([]);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("userType", userType);

      const response = await fetch("/api/admin/bulk-enroll/preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to preview enrollments");
      }

      setPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitEnrollments = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const validEnrollments = preview.filter((p) => p.status === "valid");

      const response = await fetch("/api/admin/bulk-enroll/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollments: validEnrollments,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create enrollments");
      }

      alert(
        `Successfully enrolled ${data.created} ${userType.toLowerCase()}(s) to programmes!\n${data.skipped > 0 ? `Skipped ${data.skipped} duplicate(s).` : ""}`,
      );

      // Reset form
      setFile(null);
      setPreview([]);
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit enrollments",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = preview.filter((p) => p.status === "valid").length;
  const errorCount = preview.filter((p) => p.status === "error").length;
  const duplicateCount = preview.filter((p) => p.status === "duplicate").length;

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow mb-2">
            $ bulk-enroll
          </h1>
          <p className="font-mono text-sm text-terminal-text-muted">
            Bulk enroll students or lecturers to programmes via CSV upload
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-500 bg-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="font-mono text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Download Template */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-mono text-terminal-green">
              Step 1: Download CSV Template
            </CardTitle>
            <CardDescription className="font-mono">
              Select user type and download the template with all users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={userType}
                onValueChange={(value) =>
                  setUserType(value as "STUDENT" | "LECTURER")
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Students</SelectItem>
                  <SelectItem value="LECTURER">Lecturers</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="font-mono"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </>
                )}
              </Button>
            </div>

            <div className="bg-terminal-darker p-4 rounded-md border border-terminal-border">
              <p className="font-mono text-sm text-terminal-text-muted mb-2">
                Template will include:
              </p>
              <ul className="font-mono text-xs text-terminal-text-muted space-y-1 list-disc list-inside">
                <li>All active {userType.toLowerCase()}s (ID, Name, Email)</li>
                <li>
                  Programme ID column (leave empty for users you don&apos;t want
                  to enroll)
                </li>
                <li>Programme Title column (for reference only)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Fill Template */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-mono text-terminal-green">
              Step 2: Fill the Template
            </CardTitle>
            <CardDescription className="font-mono">
              Open the CSV and add Programme IDs for enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-terminal-darker p-4 rounded-md border border-terminal-border">
              <p className="font-mono text-sm text-terminal-text-muted mb-2">
                Instructions:
              </p>
              <ol className="font-mono text-xs text-terminal-text-muted space-y-1 list-decimal list-inside">
                <li>
                  Open the downloaded CSV in Excel, Google Sheets, or any text
                  editor
                </li>
                <li>
                  For each user, enter the Programme ID in the &quot;Programme
                  ID&quot; column
                </li>
                <li>
                  Leave the row empty if you don&apos;t want to enroll that user
                </li>
                <li>
                  You can find Programme IDs in the template or from the
                  Programmes page
                </li>
                <li>Save the file as CSV</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Upload Filled Template */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-mono text-terminal-green">
              Step 3: Upload Filled CSV
            </CardTitle>
            <CardDescription className="font-mono">
              Upload your CSV file to preview enrollments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-terminal-green text-terminal-dark font-mono text-sm rounded hover:bg-terminal-green/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
                {file ? "Change File" : "Choose CSV File"}
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {file && (
                <span className="font-mono text-sm text-terminal-text-muted">
                  {file.name}
                </span>
              )}
            </div>

            {isUploading && (
              <div className="flex items-center gap-2 text-terminal-green">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-mono text-sm">Processing CSV...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Preview & Submit */}
        {preview.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-mono text-terminal-green">
                Step 4: Review & Submit
              </CardTitle>
              <CardDescription className="font-mono">
                Review the enrollments and submit when ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="font-mono">
                  <CheckCircle2 className="mr-1 h-3 w-3 text-green-500" />
                  {validCount} Valid
                </Badge>
                {duplicateCount > 0 && (
                  <Badge variant="outline" className="font-mono">
                    <AlertCircle className="mr-1 h-3 w-3 text-yellow-500" />
                    {duplicateCount} Duplicates
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="outline" className="font-mono">
                    <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                    {errorCount} Errors
                  </Badge>
                )}
              </div>

              <div className="border border-terminal-border rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm font-mono">
                    <thead className="bg-terminal-darker sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-b border-terminal-border">
                          Status
                        </th>
                        <th className="text-left p-2 border-b border-terminal-border">
                          User
                        </th>
                        <th className="text-left p-2 border-b border-terminal-border">
                          Email
                        </th>
                        <th className="text-left p-2 border-b border-terminal-border">
                          Programme
                        </th>
                        <th className="text-left p-2 border-b border-terminal-border">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((item, index) => (
                        <tr
                          key={index}
                          className={
                            item.status === "error"
                              ? "bg-red-500/10"
                              : item.status === "duplicate"
                                ? "bg-yellow-500/10"
                                : ""
                          }
                        >
                          <td className="p-2 border-b border-terminal-border">
                            {item.status === "valid" && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {item.status === "duplicate" && (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            {item.status === "error" && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </td>
                          <td className="p-2 border-b border-terminal-border">
                            {item.userName}
                          </td>
                          <td className="p-2 border-b border-terminal-border text-terminal-text-muted">
                            {item.userEmail}
                          </td>
                          <td className="p-2 border-b border-terminal-border">
                            {item.programmeTitle || "—"}
                          </td>
                          <td className="p-2 border-b border-terminal-border text-terminal-text-muted text-xs">
                            {item.status === "valid" && "Ready to enroll"}
                            {item.status === "duplicate" && "Already enrolled"}
                            {item.status === "error" && item.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-terminal-text-muted">
                  {validCount} enrollment(s) will be created
                  {duplicateCount > 0 && `, ${duplicateCount} will be skipped`}
                </p>
                <Button
                  onClick={handleSubmitEnrollments}
                  disabled={validCount === 0 || isProcessing}
                  className="font-mono"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Enroll {validCount} {userType.toLowerCase()}(s)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Programme Reference */}
        {programmes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-terminal-green">
                Programme Reference
              </CardTitle>
              <CardDescription className="font-mono">
                Available programmes and their IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border border-terminal-border rounded-md overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm font-mono">
                    <thead className="bg-terminal-darker sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-b border-terminal-border">
                          Programme ID
                        </th>
                        <th className="text-left p-2 border-b border-terminal-border">
                          Title
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {programmes.map((prog) => (
                        <tr key={prog.id}>
                          <td className="p-2 border-b border-terminal-border text-terminal-green">
                            {prog.id}
                          </td>
                          <td className="p-2 border-b border-terminal-border">
                            {prog.title}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
