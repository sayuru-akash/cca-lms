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
  GripVertical,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FileUpload } from "./file-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { sanitizeHtml } from "@/lib/security";

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
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const confirm = useConfirm();

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
    const resource = resources.find((r) => r.id === resourceId);

    const confirmed = await confirm({
      title: "Delete Resource",
      description: `Are you sure you want to delete "${resource?.title || "this resource"}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete",
      details: resource
        ? ([
            `Type: ${resource.type.replace("_", " ")}`,
            resource.fileKey
              ? "Associated file will be removed from storage"
              : null,
          ].filter(Boolean) as string[])
        : undefined,
    });

    if (!confirmed) return;

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

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editingResource) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", editingResource.title);
      formData.append("description", editingResource.description || "");
      formData.append("visibility", editingResource.visibility);
      formData.append("downloadable", editingResource.downloadable.toString());

      if (editingResource.externalUrl) {
        formData.append("externalUrl", editingResource.externalUrl);
      }
      if (editingResource.textContent) {
        formData.append("textContent", editingResource.textContent);
      }

      const response = await fetch(
        `/api/admin/resources/${editingResource.id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Failed to update resource");

      toast.success("Resource updated successfully");
      setShowEdit(false);
      setEditingResource(null);
      fetchResources();
    } catch (error) {
      toast.error("Failed to update resource");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newResources = [...resources];
    const draggedItem = newResources[draggedIndex];
    newResources.splice(draggedIndex, 1);
    newResources.splice(index, 0, draggedItem);

    setResources(newResources);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    try {
      // Update order on server
      const updates = resources.map((resource, index) => ({
        id: resource.id,
        order: index,
      }));

      const response = await fetch("/api/admin/resources/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error("Failed to reorder");

      toast.success("Order updated");
    } catch (error) {
      toast.error("Failed to update order");
      fetchResources(); // Revert on error
    } finally {
      setDraggedIndex(null);
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
          {resources.map((resource, index) => (
            <Card
              key={resource.id}
              className="border-terminal-green/20"
              draggable={canEdit}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  {canEdit && (
                    <div className="shrink-0 mt-1 cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-terminal-text-muted" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className="shrink-0 mt-1">
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
                      <div className="flex items-center gap-1 shrink-0">
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
                            onClick={() => handleEdit(resource)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
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
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.embedCode) }}
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

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource details and settings
            </DialogDescription>
          </DialogHeader>
          {editingResource && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingResource.title}
                  onChange={(e) =>
                    setEditingResource({
                      ...editingResource,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingResource.description || ""}
                  onChange={(e) =>
                    setEditingResource({
                      ...editingResource,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              {editingResource.type === "EXTERNAL_LINK" && (
                <div>
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    type="url"
                    value={editingResource.externalUrl || ""}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        externalUrl: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {editingResource.type === "TEXT_NOTE" && (
                <div>
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    value={editingResource.textContent || ""}
                    onChange={(e) =>
                      setEditingResource({
                        ...editingResource,
                        textContent: e.target.value,
                      })
                    }
                    rows={6}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-visibility">Visibility</Label>
                  <Select
                    value={editingResource.visibility}
                    onValueChange={(value: "PUBLIC" | "SCHEDULED" | "HIDDEN") =>
                      setEditingResource({
                        ...editingResource,
                        visibility: value,
                      })
                    }
                  >
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

                {editingResource.type === "FILE" && (
                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      id="edit-downloadable"
                      checked={editingResource.downloadable}
                      onChange={(e) =>
                        setEditingResource({
                          ...editingResource,
                          downloadable: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="edit-downloadable" className="font-normal">
                      Allow downloads
                    </Label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEdit(false);
                    setEditingResource(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
