"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  BookOpen,
  PlayCircle,
  FileText,
  Video,
  Clock,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  courseId: string;
  _count: {
    lessons: number;
  };
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  type: string;
  duration: number;
  order: number;
  moduleId: string;
  _count: {
    resources: number;
  };
}

interface Programme {
  id: string;
  title: string;
  description: string | null;
  status: string;
  _count: {
    enrollments: number;
    modules: number;
  };
  modules: Module[];
}

export default function ProgrammeContentClient({
  programmeId,
}: {
  programmeId: string;
}) {
  const router = useRouter();
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(),
  );

  // Module dialogs
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isModuleSubmitting, setIsModuleSubmitting] = useState(false);
  const [moduleError, setModuleError] = useState("");
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
  });

  // Lesson dialogs
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [isLessonSubmitting, setIsLessonSubmitting] = useState(false);
  const [lessonError, setLessonError] = useState("");
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    type: "VIDEO",
    duration: 0,
  });

  useEffect(() => {
    fetchProgramme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programmeId]);

  const fetchProgramme = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/programmes/${programmeId}`);
      if (!response.ok) throw new Error("Failed to fetch programme");

      const data = await response.json();
      setProgramme(data.programme);

      // Expand all modules by default
      const moduleIds = new Set(
        data.programme.modules.map((m: Module) => m.id),
      );
      setExpandedModules(moduleIds);
    } catch (error) {
      console.error("Error fetching programme:", error);
      alert("Failed to load programme");
      router.push("/programmes");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Module CRUD
  const openCreateModuleDialog = () => {
    setEditingModule(null);
    setModuleForm({ title: "", description: "" });
    setModuleError("");
    setShowModuleDialog(true);
  };

  const openEditModuleDialog = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || "",
    });
    setModuleError("");
    setShowModuleDialog(true);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModuleError("");
    setIsModuleSubmitting(true);

    try {
      const url = editingModule
        ? `/api/admin/modules/${editingModule.id}`
        : "/api/admin/modules";

      const response = await fetch(url, {
        method: editingModule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...moduleForm,
          ...(editingModule ? {} : { courseId: programmeId }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save module");
      }

      await fetchProgramme();
      setShowModuleDialog(false);
    } catch (err) {
      setModuleError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsModuleSubmitting(false);
    }
  };

  const handleDeleteModule = async (module: Module) => {
    if (module._count.lessons > 0) {
      alert(
        "Cannot delete module with lessons. Please delete all lessons first.",
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${module.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/modules/${module.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete module");
      }

      await fetchProgramme();
    } catch (error) {
      console.error("Error deleting module:", error);
      alert(error instanceof Error ? error.message : "Failed to delete module");
    }
  };

  // Lesson CRUD
  const openCreateLessonDialog = (moduleId: string) => {
    setEditingLesson(null);
    setSelectedModuleId(moduleId);
    setLessonForm({
      title: "",
      description: "",
      content: "",
      type: "VIDEO",
      duration: 0,
    });
    setLessonError("");
    setShowLessonDialog(true);
  };

  const openEditLessonDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedModuleId(lesson.moduleId);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      type: lesson.type,
      duration: lesson.duration,
    });
    setLessonError("");
    setShowLessonDialog(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLessonError("");
    setIsLessonSubmitting(true);

    try {
      const url = editingLesson
        ? `/api/admin/lessons/${editingLesson.id}`
        : "/api/admin/lessons";

      const response = await fetch(url, {
        method: editingLesson ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lessonForm,
          duration: Number(lessonForm.duration),
          ...(editingLesson ? {} : { moduleId: selectedModuleId }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save lesson");
      }

      await fetchProgramme();
      setShowLessonDialog(false);
    } catch (err) {
      setLessonError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete lesson");
      }

      await fetchProgramme();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert(error instanceof Error ? error.message : "Failed to delete lesson");
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "READING":
        return <FileText className="h-4 w-4" />;
      case "QUIZ":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <PlayCircle className="h-4 w-4" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-terminal-text-muted mb-4">Programme not found</p>
            <Button onClick={() => router.push("/programmes")}>
              Back to Programmes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/programmes")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programmes
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-terminal-green" />
                <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                  {programme.title}
                </h1>
                <Badge
                  variant={
                    programme.status === "PUBLISHED" ? "default" : "secondary"
                  }
                >
                  {programme.status}
                </Badge>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted">
                {programme.description || "No description"}
              </p>
              <div className="flex gap-4 mt-2 text-xs font-mono text-terminal-text-muted">
                <span>{programme._count.modules} modules</span>
                <span>{programme._count.enrollments} students enrolled</span>
              </div>
            </div>
            <Button className="gap-2" onClick={openCreateModuleDialog}>
              <Plus className="h-4 w-4" />
              Add Module
            </Button>
          </div>
        </div>

        {/* Content */}
        {programme.modules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-terminal-text-muted mx-auto mb-4" />
              <h3 className="font-mono text-lg font-semibold mb-2">
                No modules yet
              </h3>
              <p className="text-terminal-text-muted mb-4">
                Start building your programme by adding modules
              </p>
              <Button onClick={openCreateModuleDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {programme.modules.map((module, index) => (
              <Card key={module.id} className="overflow-hidden">
                <CardHeader className="bg-terminal-darker/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleModule(module.id)}
                        className="p-0 h-auto"
                      >
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-terminal-text-muted">
                            Module {index + 1}
                          </span>
                          <h3 className="font-mono font-semibold text-terminal-text">
                            {module.title}
                          </h3>
                        </div>
                        {module.description && (
                          <p className="text-xs text-terminal-text-muted">
                            {module.description}
                          </p>
                        )}
                        <p className="text-xs text-terminal-text-muted mt-1">
                          {module._count.lessons} lessons
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCreateLessonDialog(module.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Lesson
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditModuleDialog(module)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Module
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteModule(module)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Module
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {expandedModules.has(module.id) && (
                  <CardContent className="pt-4">
                    {!module.lessons || module.lessons.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-terminal-text-muted mb-3">
                          No lessons in this module yet
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreateLessonDialog(module.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add First Lesson
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-terminal-green/20 bg-terminal-darker/30 hover:bg-terminal-green/5 transition-colors group"
                          >
                            <div className="flex items-center gap-2 text-terminal-text-muted">
                              {getLessonIcon(lesson.type)}
                              <span className="font-mono text-xs">
                                {lessonIndex + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-mono text-sm font-medium">
                                {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-xs text-terminal-text-muted line-clamp-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {lesson.duration > 0 && (
                                <div className="flex items-center gap-1 text-xs text-terminal-text-muted">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(lesson.duration)}
                                </div>
                              )}
                              <Badge variant="outline" className="text-[10px]">
                                {lesson.type}
                              </Badge>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openEditLessonDialog(lesson)
                                      }
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Lesson
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteLesson(lesson)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Lesson
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Edit Module" : "Create New Module"}
            </DialogTitle>
            <DialogDescription>
              {editingModule
                ? "Update module information"
                : "Add a new module to your programme"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModuleSubmit} className="space-y-4">
            {moduleError && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {moduleError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="module-title">Module Title *</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) =>
                  setModuleForm({ ...moduleForm, title: e.target.value })
                }
                placeholder="e.g., Introduction to Programming"
                required
                disabled={isModuleSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="module-description">Description</Label>
              <Textarea
                id="module-description"
                value={moduleForm.description}
                onChange={(e) =>
                  setModuleForm({
                    ...moduleForm,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of the module..."
                rows={3}
                disabled={isModuleSubmitting}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isModuleSubmitting}
                className="flex-1"
              >
                {isModuleSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingModule ? "Update Module" : "Create Module"}</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModuleDialog(false)}
                disabled={isModuleSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? "Edit Lesson" : "Create New Lesson"}
            </DialogTitle>
            <DialogDescription>
              {editingLesson
                ? "Update lesson information"
                : "Add a new lesson to the module"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLessonSubmit} className="space-y-4">
            {lessonError && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {lessonError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, title: e.target.value })
                }
                placeholder="e.g., Variables and Data Types"
                required
                disabled={isLessonSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-type">Lesson Type</Label>
                <Select
                  value={lessonForm.type}
                  onValueChange={(value) =>
                    setLessonForm({ ...lessonForm, type: value })
                  }
                  disabled={isLessonSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="READING">Reading</SelectItem>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min="0"
                  value={lessonForm.duration}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isLessonSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description</Label>
              <Textarea
                id="lesson-description"
                value={lessonForm.description}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    description: e.target.value,
                  })
                }
                placeholder="Brief description of the lesson..."
                rows={2}
                disabled={isLessonSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-content">Content</Label>
              <Textarea
                id="lesson-content"
                value={lessonForm.content}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, content: e.target.value })
                }
                placeholder="Lesson content, video URL, or reading material..."
                rows={4}
                disabled={isLessonSubmitting}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isLessonSubmitting}
                className="flex-1"
              >
                {isLessonSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingLesson ? "Update Lesson" : "Create Lesson"}</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLessonDialog(false)}
                disabled={isLessonSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
