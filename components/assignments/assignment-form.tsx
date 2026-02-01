"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueDate: string | Date;
  maxPoints: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  maxFiles: number;
  allowLateSubmission: boolean;
}

interface AssignmentFormProps {
  lessonId: string;
  existingAssignment?: Assignment;
  onSuccess?: () => void;
  onCancel?: () => void;
  userRole?: "ADMIN" | "LECTURER";
}

const COMMON_FILE_TYPES = {
  documents: ["pdf", "doc", "docx", "txt"],
  spreadsheets: ["xls", "xlsx", "csv"],
  presentations: ["ppt", "pptx"],
  images: ["jpg", "jpeg", "png", "gif"],
  code: ["js", "ts", "py", "java", "cpp", "html", "css", "json"],
  archives: ["zip", "rar", "7z"],
};

export function AssignmentForm({
  lessonId,
  existingAssignment,
  onSuccess,
  onCancel,
  userRole = "ADMIN",
}: AssignmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLecturer = userRole === "LECTURER";
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    maxPoints: 100,
    allowedFileTypes: ["pdf", "docx", "txt", "zip"],
    maxFileSize: 5242880, // 5MB default
    maxFiles: 1, // 1 file default
    allowLateSubmission: false,
  });

  const [customFileType, setCustomFileType] = useState("");

  useEffect(() => {
    if (existingAssignment) {
      const allowedFileTypes = Array.isArray(
        existingAssignment.allowedFileTypes,
      )
        ? existingAssignment.allowedFileTypes
        : ["pdf", "docx", "txt", "zip"];

      setForm({
        title: existingAssignment.title || "",
        description: existingAssignment.description || "",
        instructions: existingAssignment.instructions || "",
        dueDate: existingAssignment.dueDate
          ? new Date(existingAssignment.dueDate).toISOString().slice(0, 16)
          : "",
        maxPoints: existingAssignment.maxPoints || 100,
        allowedFileTypes,
        maxFileSize: existingAssignment.maxFileSize || 10485760,
        maxFiles: existingAssignment.maxFiles || 5,
        allowLateSubmission: existingAssignment.allowLateSubmission || false,
      });
    }
  }, [existingAssignment]);

  const addFileTypes = (types: string[]) => {
    const currentTypes = Array.isArray(form.allowedFileTypes)
      ? form.allowedFileTypes
      : [];
    const newTypes = [...new Set([...currentTypes, ...types])];
    setForm({ ...form, allowedFileTypes: newTypes });
  };

  const removeFileType = (type: string) => {
    const currentTypes = Array.isArray(form.allowedFileTypes)
      ? form.allowedFileTypes
      : [];
    setForm({
      ...form,
      allowedFileTypes: currentTypes.filter((t) => t !== type),
    });
  };

  const addCustomFileType = () => {
    const currentTypes = Array.isArray(form.allowedFileTypes)
      ? form.allowedFileTypes
      : [];
    if (customFileType && !currentTypes.includes(customFileType)) {
      setForm({
        ...form,
        allowedFileTypes: [...currentTypes, customFileType],
      });
      setCustomFileType("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.dueDate) {
      toast.error("Missing Required Fields", {
        description: "Title and due date are required",
      });
      return;
    }

    if (form.allowedFileTypes.length === 0) {
      toast.error("No File Types", {
        description: "Please select at least one allowed file type",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = existingAssignment
        ? `/api/admin/assignments/${existingAssignment.id}`
        : "/api/admin/assignments";

      const response = await fetch(url, {
        method: existingAssignment ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(existingAssignment ? {} : { lessonId }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save assignment");
      }

      toast.success("Assignment Saved!", {
        description: existingAssignment
          ? "Assignment updated successfully"
          : "Assignment created successfully",
      });

      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save assignment";
      toast.error("Save Failed", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title">Assignment Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g., Week 1 - HTML Fundamentals Project"
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief overview of the assignment"
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="Detailed instructions for completing the assignment..."
          rows={6}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dueDate">Due Date & Time *</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="maxPoints">Maximum Points</Label>
          <Input
            id="maxPoints"
            type="number"
            min="1"
            max="1000"
            value={form.maxPoints}
            onChange={(e) =>
              setForm({ ...form, maxPoints: Number(e.target.value) })
            }
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Allowed File Types</Label>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(COMMON_FILE_TYPES).map(([category, types]) => (
              <Button
                key={category}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addFileTypes(types)}
                disabled={isSubmitting}
              >
                <Plus className="h-3 w-3 mr-1" />
                {category}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Custom type (e.g., pdf)"
              value={customFileType}
              onChange={(e) => setCustomFileType(e.target.value.toLowerCase())}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCustomFileType())
              }
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomFileType}
              disabled={isSubmitting}
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 p-3 bg-terminal-darker border border-terminal-border rounded-md min-h-15">
            {!Array.isArray(form.allowedFileTypes) ||
            form.allowedFileTypes.length === 0 ? (
              <p className="text-sm text-terminal-text-muted">
                No file types selected
              </p>
            ) : (
              form.allowedFileTypes.map((type) => (
                <Badge key={type} variant="default" className="gap-1">
                  .{type}
                  <button
                    type="button"
                    onClick={() => removeFileType(type)}
                    disabled={isSubmitting}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="maxFileSize">
            Max File Size (MB)
            {isLecturer && (
              <span className="ml-2 text-xs text-terminal-text-muted">
                (Default: 5MB)
              </span>
            )}
          </Label>
          <Select
            value={form.maxFileSize.toString()}
            onValueChange={(value) =>
              setForm({ ...form, maxFileSize: Number(value) })
            }
            disabled={isSubmitting || isLecturer}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5242880">5 MB</SelectItem>
              <SelectItem value="10485760">10 MB</SelectItem>
              <SelectItem value="20971520">20 MB</SelectItem>
              <SelectItem value="52428800">50 MB</SelectItem>
              <SelectItem value="104857600">100 MB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="maxFiles">
            Maximum Files
            {isLecturer && (
              <span className="ml-2 text-xs text-terminal-text-muted">
                (Default: 1 file)
              </span>
            )}
          </Label>
          <Input
            id="maxFiles"
            type="number"
            min="1"
            max="20"
            value={form.maxFiles}
            onChange={(e) =>
              setForm({ ...form, maxFiles: Number(e.target.value) })
            }
            disabled={isSubmitting || isLecturer}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 border border-terminal-border rounded-md">
        <Switch
          id="allowLateSubmission"
          checked={form.allowLateSubmission}
          onCheckedChange={(checked) =>
            setForm({ ...form, allowLateSubmission: checked })
          }
          disabled={isSubmitting}
        />
        <Label htmlFor="allowLateSubmission" className="cursor-pointer">
          Allow late submissions after deadline
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {existingAssignment ? "Update Assignment" : "Create Assignment"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
