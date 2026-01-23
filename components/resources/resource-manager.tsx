"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  ExternalLink,
  FileIcon,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Edit,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "./file-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: "FILE" | "EXTERNAL_LINK" | "EMBEDDED" | "TEXT_NOTE";
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  externalUrl: string | null;
  embedCode: string | null;
  textContent: string | null;
  visibility: "PUBLIC" | "SCHEDULED" | "HIDDEN";
  downloadable: boolean;
  order: number;
  createdAt: string;
}

interface ResourceManagerProps {
  lessonId: string;
  canEdit?: boolean;
}

export function ResourceManager({
  lessonId,
  canEdit = false,
}: ResourceManagerProps) {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, [lessonId]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/resources?lessonId=${lessonId}`);
      if (!response.ok) throw new Error("Failed to fetch resources");
      const data = await response.json();
      // API returns array directly, not wrapped in { resources: [...] }
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to load resources");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    setDeleting(resourceId);
    try {
      const response = await fetch(`/api/admin/resources/${resourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete resource");

      toast.success("Resource deleted successfully");
      fetchResources();
    } catch (error) {
      toast.error("Failed to delete resource");
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (!resource.fileKey) return;

    try {
      const response = await fetch(
        `/api/admin/resources/${resource.id}/download`,
      );
      if (!response.ok) throw new Error("Failed to get download URL");

      const data = await response.json();
      window.open(data.url, "_blank");
    } catch (error) {
      toast.error("Failed to download file");
      console.error(error);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getResourceIcon = (type: Resource["type"]) => {
    switch (type) {
      case "FILE":
        return <FileIcon className="h-5 w-5 text-terminal-green" />;
      case "EXTERNAL_LINK":
        return <ExternalLink className="h-5 w-5 text-terminal-green" />;
      case "EMBEDDED":
        return <Eye className="h-5 w-5 text-terminal-green" />;
      case "TEXT_NOTE":
        return <FileIcon className="h-5 w-5 text-terminal-green" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      {canEdit && (
        <div className="flex items-center justify-end">
          <Button onClick={() => setShowUpload(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Resource
          </Button>
        </div>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-terminal-text-muted opacity-50" />
            <p className="text-terminal-text-muted">
              No resources available yet
            </p>
            {canEdit && (
              <Button
                onClick={() => setShowUpload(true)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Resource
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="border-terminal-green/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getResourceIcon(resource.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-terminal-text truncate">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-sm text-terminal-text-muted mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-terminal-text-muted">
                          <span className="font-mono uppercase">
                            {resource.type.replace("_", " ")}
                          </span>
                          {resource.fileName && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(resource.fileSize)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDate(resource.createdAt)}</span>
                          {resource.visibility !== "PUBLIC" && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-500">
                                {resource.visibility}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {resource.type === "FILE" && resource.downloadable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(resource)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {resource.type === "EXTERNAL_LINK" &&
                          resource.externalUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(resource.externalUrl!, "_blank")
                              }
                              title="Open Link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        {resource.type === "TEXT_NOTE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View Note"
                            onClick={() => {
                              // Could open a modal to show full text
                              toast.info("View note functionality coming soon");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(resource.id)}
                            disabled={deleting === resource.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Delete"
                          >
                            {deleting === resource.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Embedded Content Preview */}
                    {resource.type === "EMBEDDED" && resource.embedCode && (
                      <div
                        className="mt-3 rounded border border-terminal-green/20 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: resource.embedCode }}
                      />
                    )}

                    {/* Text Note Preview */}
                    {resource.type === "TEXT_NOTE" && resource.textContent && (
                      <div className="mt-3 p-3 rounded border border-terminal-green/20 bg-terminal-darker/50">
                        <p className="text-sm text-terminal-text-muted line-clamp-3">
                          {resource.textContent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Upload a file, add a link, or embed content for this lesson
            </DialogDescription>
          </DialogHeader>
          <FileUpload
            lessonId={lessonId}
            onSuccess={() => {
              setShowUpload(false);
              fetchResources();
            }}
            onCancel={() => setShowUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
