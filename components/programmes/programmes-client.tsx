"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Loader2,
  Eye,
  Edit,
  Archive,
  MoreVertical,
  Users,
  FolderTree,
  Calendar,
  User,
  X,
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

interface Programme {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  lecturerId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    enrollments: number;
    modules: number;
  };
}

interface ProgrammeDetails extends Programme {
  lecturer: {
    id: string;
    name: string | null;
    email: string;
  };
  modules: Array<{
    id: string;
    title: string;
    order: number;
    _count: {
      lessons: number;
    };
  }>;
}

interface Lecturer {
  id: string;
  name: string | null;
  email: string;
}

export default function ProgrammesClient() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View dialog
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingProgramme, setViewingProgramme] = useState<ProgrammeDetails | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    lecturerId: "",
    status: "",
  });

  useEffect(() => {
    fetchProgrammes();
    fetchLecturers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, statusFilter]);

  const fetchProgrammes = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter.toUpperCase() }),
      });

      const response = await fetch(`/api/admin/programmes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch programmes");

      const data = await response.json();
      setProgrammes(data.programmes);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching programmes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLecturers = async () => {
    try {
      const response = await fetch("/api/admin/users?role=LECTURER&limit=100");
      if (!response.ok) throw new Error("Failed to fetch lecturers");

      const data = await response.json();
      setLecturers(data.users);
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    }
  };

  const handleViewProgramme = async (programme: Programme) => {
    setViewingProgramme(null);
    setShowViewDialog(true);
    setIsLoadingView(true);

    try {
      const response = await fetch(`/api/admin/programmes/${programme.id}`);
      if (!response.ok) throw new Error("Failed to fetch programme details");

      const data = await response.json();
      setViewingProgramme(data.programme);
    } catch (error) {
      console.error("Error fetching programme details:", error);
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleEditProgramme = (programme: Programme) => {
    setEditingProgramme(programme);
    setEditForm({
      title: programme.title,
      description: programme.description || "",
      lecturerId: programme.lecturerId,
      status: programme.status,
    });
    setEditError("");
    setShowEditDialog(true);
  };

  const handleUpdateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgramme) return;

    setEditError("");
    setIsEditing(true);

    try {
      const response = await fetch(`/api/admin/programmes/${editingProgramme.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update programme");
      }

      fetchProgrammes();
      setShowEditDialog(false);
      setEditingProgramme(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsEditing(false);
    }
  };

  const handleArchiveProgramme = async (programme: Programme) => {
    if (!confirm(`Are you sure you want to archive "${programme.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/programmes/${programme.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to archive programme");
      }

      fetchProgrammes();
    } catch (error) {
      console.error("Error archiving programme:", error);
      alert(error instanceof Error ? error.message : "Failed to archive programme");
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "PUBLISHED":
        return "default";
      case "DRAFT":
        return "secondary";
      case "ARCHIVED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-terminal-green" />
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                $ programmes --list
              </h1>
            </div>
            <p className="font-mono text-sm text-terminal-text-muted">
              Manage all learning programmes
            </p>
          </div>
          <Button
            className="gap-2"
            onClick={() => router.push("/programmes/new")}
          >
            <Plus className="h-4 w-4" />
            New Programme
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder="$ search programmes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-45">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Programme Directory</CardTitle>
            </CardHeader>
            <CardContent>
              {programmes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-terminal-text-muted mx-auto mb-4" />
                  <p className="font-mono text-terminal-text-muted">
                    No programmes found
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/programmes/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Programme
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {programmes.map((programme) => (
                    <div
                      key={programme.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 hover:border-terminal-green/40 transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg border-2 border-terminal-green bg-terminal-green/10 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-terminal-green" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono font-semibold text-terminal-text">
                              {programme.title}
                            </h3>
                            <Badge
                              variant={getStatusColor(programme.status)}
                              className="text-[10px]"
                            >
                              {programme.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-mono text-terminal-text-muted line-clamp-1">
                            {programme.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-muted mt-1">
                            <span>Created {formatDate(programme.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs font-mono text-terminal-text-muted mb-1">
                            Students
                          </p>
                          <p className="text-lg font-mono font-bold text-terminal-green">
                            {programme._count.enrollments}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-mono text-terminal-text-muted mb-1">
                            Modules
                          </p>
                          <p className="text-lg font-mono font-bold text-terminal-green">
                            {programme._count.modules}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleViewProgramme(programme)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditProgramme(programme)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Programme
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/programmes/${programme.id}`)
                              }
                            >
                              <FolderTree className="h-4 w-4 mr-2" />
                              Manage Content
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleArchiveProgramme(programme)}
                              className="text-destructive"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="font-mono text-sm text-terminal-text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Programme Details</DialogTitle>
            <DialogDescription>
              View complete programme information and structure
            </DialogDescription>
          </DialogHeader>

          {isLoadingView ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
            </div>
          ) : viewingProgramme ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg border-2 border-terminal-green bg-terminal-green/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-8 w-8 text-terminal-green" />
                </div>
                <div className="flex-1">
                  <h3 className="font-mono text-xl font-bold text-terminal-text mb-1">
                    {viewingProgramme.title}
                  </h3>
                  <p className="font-mono text-sm text-terminal-text-muted mb-2">
                    {viewingProgramme.description || "No description"}
                  </p>
                  <Badge variant={getStatusColor(viewingProgramme.status)}>
                    {viewingProgramme.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Lecturer
                  </Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-terminal-green" />
                    <p className="font-mono text-sm">
                      {viewingProgramme.lecturer.name || "Unknown"}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-terminal-text-muted pl-6">
                    {viewingProgramme.lecturer.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Created
                  </Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-terminal-green" />
                    <p className="font-mono text-sm">
                      {formatDateTime(viewingProgramme.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Students Enrolled
                  </Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-terminal-green" />
                    <p className="font-mono text-sm font-bold text-terminal-green">
                      {viewingProgramme._count.enrollments}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Total Modules
                  </Label>
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-terminal-green" />
                    <p className="font-mono text-sm font-bold text-terminal-green">
                      {viewingProgramme._count.modules}
                    </p>
                  </div>
                </div>
              </div>

              {viewingProgramme.modules.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Modules</Label>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {viewingProgramme.modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center justify-between p-2 rounded border border-terminal-green/20 bg-terminal-darker/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-terminal-text-muted">
                            #{module.order}
                          </span>
                          <span className="font-mono text-sm">
                            {module.title}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-terminal-text-muted">
                          {module._count.lessons} lessons
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditProgramme(viewingProgramme);
                  }}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Programme
                </Button>
                <Button
                  onClick={() =>
                    router.push(`/programmes/${viewingProgramme.id}`)
                  }
                  variant="outline"
                  className="flex-1"
                >
                  <FolderTree className="h-4 w-4 mr-2" />
                  Manage Content
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-terminal-text-muted">
              Failed to load programme details
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Programme</DialogTitle>
            <DialogDescription>
              Update programme information and settings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProgramme} className="space-y-4">
            {editError && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {editError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-title">Programme Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="e.g., Introduction to Computer Science"
                required
                disabled={isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Brief description of the programme..."
                rows={4}
                disabled={isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-lecturer">Assigned Lecturer *</Label>
              <Select
                value={editForm.lecturerId}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, lecturerId: value })
                }
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map((lecturer) => (
                    <SelectItem key={lecturer.id} value={lecturer.id}>
                      {lecturer.name || lecturer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
                disabled={isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isEditing} className="flex-1">
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isEditing}
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
