"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  lessonId: string;
  onSuccess?: (resource: any) => void;
  onCancel?: () => void;
}

export function FileUpload({ lessonId, onSuccess, onCancel }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("FILE");
  const [visibility, setVisibility] = useState<string>("PUBLIC");
  const [downloadable, setDownloadable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [externalUrl, setExternalUrl] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [textContent, setTextContent] = useState("");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        if (!title) {
          setTitle(selectedFile.name);
        }
      }
    },
    [title],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const removeFile = () => {
    setFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "FILE" && !file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!title) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      if (file) {
        formData.append("file", file);
      }

      formData.append("lessonId", lessonId);
      formData.append("title", title);
      formData.append("description", description || "");
      formData.append("type", type);
      formData.append("visibility", visibility);
      formData.append("downloadable", downloadable.toString());

      if (type === "EXTERNAL_LINK") {
        formData.append("externalUrl", externalUrl);
      }

      if (type === "EMBEDDED") {
        formData.append("embedCode", embedCode);
      }

      if (type === "TEXT_NOTE") {
        formData.append("textContent", textContent);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/admin/resources", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const resource = await response.json();
      toast.success("Resource uploaded successfully!");
      onSuccess?.(resource);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload resource");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Resource Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FILE">File Upload</SelectItem>
            <SelectItem value="EXTERNAL_LINK">External Link</SelectItem>
            <SelectItem value="EMBEDDED">Embedded Content</SelectItem>
            <SelectItem value="TEXT_NOTE">Text Note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "FILE" && (
        <div>
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? "Drop the file here..."
                  : "Drag & drop a file here, or click to select"}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Maximum file size: 500MB
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {type === "EXTERNAL_LINK" && (
        <div>
          <Label htmlFor="externalUrl">External URL</Label>
          <Input
            id="externalUrl"
            type="url"
            placeholder="https://example.com/resource"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            required
          />
        </div>
      )}

      {type === "EMBEDDED" && (
        <div>
          <Label htmlFor="embedCode">Embed Code</Label>
          <Textarea
            id="embedCode"
            placeholder="<iframe>...</iframe>"
            value={embedCode}
            onChange={(e) => setEmbedCode(e.target.value)}
            rows={4}
            required
          />
        </div>
      )}

      {type === "TEXT_NOTE" && (
        <div>
          <Label htmlFor="textContent">Content</Label>
          <Textarea
            id="textContent"
            placeholder="Enter text content..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={6}
            required
          />
        </div>
      )}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Resource title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this resource..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="HIDDEN">Hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "FILE" && (
          <div className="flex items-center space-x-2 pt-8">
            <input
              type="checkbox"
              id="downloadable"
              checked={downloadable}
              onChange={(e) => setDownloadable(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="downloadable" className="font-normal">
              Allow downloads
            </Label>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-center text-gray-600">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Resource"
          )}
        </Button>
      </div>
    </form>
  );
}
