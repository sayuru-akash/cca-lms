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
  UserPlus,
  Trash2,
  Mail,
  CheckCircle2,
  GraduationCap,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";

interface Programme {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  lecturerId: string | null;
  lecturers?: Lecturer[]; // New: Array of assigned lecturers
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
  } | null;
  lecturers: Lecturer[]; // Array of assigned lecturers
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

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
  };
}

interface AvailableUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
}

export default function ProgrammesClient() {
  const router = useRouter();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // View dialog
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingProgramme, setViewingProgramme] =
    useState<ProgrammeDetails | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    lecturerIds: string[];
    status: string;
  }>({
    title: "",
    description: "",
    lecturerIds: [],
    status: "",
  });

  // Enrollments dialog
  const [showEnrollmentsDialog, setShowEnrollmentsDialog] = useState(false);
  const [enrollmentsProgramme, setEnrollmentsProgramme] =
    useState<Programme | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [enrollmentRoleFilter, setEnrollmentRoleFilter] = useState<
    "all" | "STUDENT" | "LECTURER"
  >("all");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");

  // Add users dialog
  const [showAddUsersDialog, setShowAddUsersDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"STUDENT" | "LECTURER">(
    "STUDENT",
  );
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // Bulk remove
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const [isRemovingBulk, setIsRemovingBulk] = useState(false);

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
      setTotalCount(data.pagination.total);
      setPage(data.pagination.page);
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
      lecturerIds: programme.lecturers?.map((l) => l.id) || [],
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
      const response = await fetch(
        `/api/admin/programmes/${editingProgramme.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editForm.title,
            description: editForm.description,
            status: editForm.status,
            lecturerIds: editForm.lecturerIds,
          }),
        },
      );

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
    const isArchiving = programme.status !== "ARCHIVED";
    const action = isArchiving ? "archive" : "unarchive";
    const newStatus = isArchiving ? "ARCHIVED" : "PUBLISHED";

    if (!confirm(`Are you sure you want to ${action} "${programme.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/programmes/${programme.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} programme`);
      }

      fetchProgrammes();
    } catch (error) {
      console.error(`Error ${action}ing programme:`, error);
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${action} programme`,
      );
    }
  };

  const handleViewEnrollments = (programme: Programme) => {
    setEnrollmentsProgramme(programme);
    setEnrollmentRoleFilter("all");
    setEnrollmentSearch("");
    setSelectedToRemove([]);
    setShowEnrollmentsDialog(true);
    fetchEnrollments(programme.id);
  };

  const fetchEnrollments = async (programmeId: string, role?: string) => {
    try {
      setIsLoadingEnrollments(true);
      const params = new URLSearchParams();
      if (role && role !== "all") {
        params.append("role", role);
      }

      const response = await fetch(
        `/api/admin/programmes/${programmeId}/enrollments?${params}`,
      );
      if (!response.ok) throw new Error("Failed to fetch enrollments");

      const data = await response.json();
      setEnrollments(data.enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const handleRemoveEnrollment = async (
    programmeId: string,
    userId: string,
  ) => {
    if (!confirm("Remove this user from the programme?")) return;

    try {
      const response = await fetch(
        `/api/admin/programmes/${programmeId}/enrollments?userId=${userId}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to remove enrollment");

      fetchEnrollments(programmeId);
      fetchProgrammes();
    } catch (error) {
      console.error("Error removing enrollment:", error);
      alert("Failed to remove user from programme");
    }
  };

  const handleOpenAddUsers = () => {
    setShowAddUsersDialog(true);
    setSelectedUsers([]);
    setUserSearch("");
    setEnrollError("");
    fetchAvailableUsers();
  };

  const fetchAvailableUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch(
        `/api/admin/users?role=${userRoleFilter}&limit=100&status=ACTIVE`,
      );
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setAvailableUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setEnrollError("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleEnrollUsers = async () => {
    if (!enrollmentsProgramme) return;
    if (selectedUsers.length === 0) {
      setEnrollError("Please select at least one user");
      return;
    }

    setIsEnrolling(true);
    setEnrollError("");

    try {
      const response = await fetch(
        `/api/admin/programmes/${enrollmentsProgramme.id}/enrollments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedUsers }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enroll users");
      }

      fetchEnrollments(enrollmentsProgramme.id);
      fetchProgrammes();
      setSelectedUsers([]);
      setShowAddUsersDialog(false);

      if (data.skipped > 0) {
        alert(data.message);
      }
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsEnrolling(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAllUsers = () => {
    const enrolledIds = new Set(enrollments.map((e) => e.user.id));
    const filteredUsers = availableUsers
      .filter(
        (user) =>
          !userSearch ||
          user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.toLowerCase()),
      )
      .filter((user) => !enrolledIds.has(user.id))
      .map((user) => user.id);
    setSelectedUsers(filteredUsers);
  };

  const handleDeselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const toggleRemoveSelection = (userId: string) => {
    setSelectedToRemove((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAllToRemove = () => {
    const filteredEnrollments = enrollments
      .filter(
        (e) =>
          !enrollmentSearch ||
          e.user.name?.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
          e.user.email.toLowerCase().includes(enrollmentSearch.toLowerCase()),
      )
      .map((e) => e.user.id);
    setSelectedToRemove(filteredEnrollments);
  };

  const handleDeselectAllToRemove = () => {
    setSelectedToRemove([]);
  };

  const handleBulkRemove = async () => {
    if (!enrollmentsProgramme || selectedToRemove.length === 0) return;

    if (
      !confirm(`Remove ${selectedToRemove.length} user(s) from this programme?`)
    ) {
      return;
    }

    setIsRemovingBulk(true);

    try {
      await Promise.all(
        selectedToRemove.map((userId) =>
          fetch(
            `/api/admin/programmes/${enrollmentsProgramme.id}/enrollments?userId=${userId}`,
            { method: "DELETE" },
          ),
        ),
      );

      fetchEnrollments(enrollmentsProgramme.id);
      fetchProgrammes();
      setSelectedToRemove([]);
    } catch (error) {
      console.error("Error removing enrollments:", error);
      alert("Failed to remove some enrollments");
    } finally {
      setIsRemovingBulk(false);
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "danger" => {
    switch (status) {
      case "PUBLISHED":
        return "success";
      case "DRAFT":
        return "warning";
      case "ARCHIVED":
        return "danger";
      default:
        return "warning";
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
                            <span>
                              Created {formatDate(programme.createdAt)}
                            </span>
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
                              onClick={() => handleViewEnrollments(programme)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              View Enrollments ({programme._count.enrollments})
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditProgramme(programme)}
                              disabled={programme.status === "ARCHIVED"}
                              className={
                                programme.status === "ARCHIVED"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Programme
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/programmes/${programme.id}`)
                              }
                              disabled={programme.status === "ARCHIVED"}
                              className={
                                programme.status === "ARCHIVED"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            >
                              <FolderTree className="h-4 w-4 mr-2" />
                              Manage Content
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleArchiveProgramme(programme)}
                              className={
                                programme.status === "ARCHIVED"
                                  ? "text-green-600"
                                  : "text-destructive"
                              }
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              {programme.status === "ARCHIVED"
                                ? "Unarchive"
                                : "Archive"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    showPageJump={totalPages > 10}
                  />
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
                      {viewingProgramme.lecturer?.name ||
                        viewingProgramme.lecturer?.email ||
                        "Not Assigned"}
                    </p>
                  </div>
                  {viewingProgramme.lecturer && (
                    <p className="font-mono text-xs text-terminal-text-muted pl-6">
                      {viewingProgramme.lecturer.email}
                    </p>
                  )}
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
              <Label htmlFor="edit-lecturer">Assigned Lecturers</Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-3">
                {lecturers.length === 0 ? (
                  <p className="text-sm text-terminal-text-muted">
                    No lecturers available
                  </p>
                ) : (
                  lecturers.map((lecturer) => (
                    <div
                      key={lecturer.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`lecturer-${lecturer.id}`}
                        checked={editForm.lecturerIds.includes(lecturer.id)}
                        onCheckedChange={(checked) => {
                          setEditForm({
                            ...editForm,
                            lecturerIds: checked
                              ? [...editForm.lecturerIds, lecturer.id]
                              : editForm.lecturerIds.filter(
                                  (id) => id !== lecturer.id,
                                ),
                          });
                        }}
                        disabled={isEditing}
                      />
                      <label
                        htmlFor={`lecturer-${lecturer.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {lecturer.name || lecturer.email}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-terminal-text-muted">
                Select one or more lecturers to assign to this programme
              </p>
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

      {/* Enrollments Dialog */}
      <Dialog
        open={showEnrollmentsDialog}
        onOpenChange={setShowEnrollmentsDialog}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Programme Enrollments</DialogTitle>
            <DialogDescription>
              {enrollmentsProgramme
                ? `Manage users enrolled in "${enrollmentsProgramme.title}"`
                : "View and manage programme enrollments"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
                <Input
                  type="text"
                  placeholder="$ search by name or email..."
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  className="pl-10 font-mono"
                />
              </div>
              <Select
                value={enrollmentRoleFilter}
                onValueChange={(value: "all" | "STUDENT" | "LECTURER") => {
                  setEnrollmentRoleFilter(value);
                  setSelectedToRemove([]);
                  if (enrollmentsProgramme) {
                    fetchEnrollments(
                      enrollmentsProgramme.id,
                      value === "all" ? undefined : value,
                    );
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="STUDENT">Students Only</SelectItem>
                  <SelectItem value="LECTURER">Lecturers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {enrollments.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                <Checkbox
                  checked={
                    selectedToRemove.length > 0 &&
                    selectedToRemove.length ===
                      enrollments.filter(
                        (e) =>
                          !enrollmentSearch ||
                          e.user.name
                            ?.toLowerCase()
                            .includes(enrollmentSearch.toLowerCase()) ||
                          e.user.email
                            .toLowerCase()
                            .includes(enrollmentSearch.toLowerCase()),
                      ).length
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleSelectAllToRemove();
                    } else {
                      handleDeselectAllToRemove();
                    }
                  }}
                />
                <span className="font-mono text-sm text-terminal-text-muted flex-1">
                  {selectedToRemove.length > 0
                    ? `${selectedToRemove.length} selected`
                    : "Select users to remove"}
                </span>
                {selectedToRemove.length > 0 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleBulkRemove}
                    disabled={isRemovingBulk}
                    className="gap-2"
                  >
                    {isRemovingBulk ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Remove {selectedToRemove.length}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleOpenAddUsers}
                  size="sm"
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Users
                </Button>
              </div>
            )}

            {/* Enrollments List */}
            {isLoadingEnrollments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-terminal-text-muted mb-4" />
                <p className="font-mono text-terminal-text-muted mb-2">
                  No enrollments found
                </p>
                <Button onClick={handleOpenAddUsers} variant="outline">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Users to Programme
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {enrollments
                  .filter(
                    (e) =>
                      !enrollmentSearch ||
                      e.user.name
                        ?.toLowerCase()
                        .includes(enrollmentSearch.toLowerCase()) ||
                      e.user.email
                        .toLowerCase()
                        .includes(enrollmentSearch.toLowerCase()),
                  )
                  .map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={selectedToRemove.includes(
                            enrollment.user.id,
                          )}
                          onCheckedChange={() =>
                            toggleRemoveSelection(enrollment.user.id)
                          }
                        />
                        <div className="h-10 w-10 rounded-full border-2 border-terminal-green bg-terminal-green/10 flex items-center justify-center font-mono font-bold text-terminal-green text-sm">
                          {enrollment.user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-semibold text-sm text-terminal-text">
                              {enrollment.user.name || "No Name"}
                            </span>
                            <Badge
                              variant={
                                enrollment.user.role === "STUDENT"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {enrollment.user.role}
                            </Badge>
                            <Badge
                              variant={
                                enrollment.user.status === "ACTIVE"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {enrollment.user.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono text-terminal-text-muted">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {enrollment.user.email}
                            </span>
                            <span>
                              Enrolled {formatDate(enrollment.enrolledAt)}
                            </span>
                            {enrollment.user.role === "STUDENT" && (
                              <span className="text-terminal-green">
                                {Math.round(enrollment.progress)}% complete
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Summary */}
            {enrollments.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t font-mono text-sm">
                <div className="flex gap-4">
                  <span className="text-terminal-text-muted">
                    Total:{" "}
                    <span className="text-terminal-green font-bold">
                      {enrollments.length}
                    </span>
                  </span>
                  <span className="text-terminal-text-muted">
                    Students:{" "}
                    <span className="text-terminal-green font-bold">
                      {
                        enrollments.filter((e) => e.user.role === "STUDENT")
                          .length
                      }
                    </span>
                  </span>
                  <span className="text-terminal-text-muted">
                    Lecturers:{" "}
                    <span className="text-terminal-green font-bold">
                      {
                        enrollments.filter((e) => e.user.role === "LECTURER")
                          .length
                      }
                    </span>
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowEnrollmentsDialog(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Users Dialog */}
      <Dialog open={showAddUsersDialog} onOpenChange={setShowAddUsersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Users to Programme</DialogTitle>
            <DialogDescription>
              {enrollmentsProgramme
                ? `Select users to enroll in "${enrollmentsProgramme.title}"`
                : "Select users to enroll"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {enrollError && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {enrollError}
                </div>
              )}

              {/* Role Filter and Search */}
              <div className="flex gap-2">
                <div className="flex gap-2">
                  <Button
                    variant={
                      userRoleFilter === "STUDENT" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setUserRoleFilter("STUDENT");
                      setSelectedUsers([]);
                    }}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Students
                  </Button>
                  <Button
                    variant={
                      userRoleFilter === "LECTURER" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setUserRoleFilter("LECTURER");
                      setSelectedUsers([]);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Lecturers
                  </Button>
                </div>
                <Input
                  type="text"
                  placeholder="$ search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="flex-1 font-mono"
                />
                <Button
                  onClick={fetchAvailableUsers}
                  variant="outline"
                  size="sm"
                >
                  <Loader2
                    className={`h-4 w-4 mr-2 ${isLoadingUsers ? "animate-spin" : ""}`}
                  />
                  Load
                </Button>
              </div>

              {/* Bulk Selection */}
              {availableUsers.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-terminal-green/20 bg-terminal-darker/50">
                  <span className="font-mono text-sm text-terminal-text-muted flex-1">
                    {selectedUsers.length > 0
                      ? `${selectedUsers.length} selected`
                      : "Select users to enroll"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAllUsers}
                    disabled={availableUsers.length === 0}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Select All Visible
                  </Button>
                  {selectedUsers.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeselectAllUsers}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Deselect All
                    </Button>
                  )}
                </div>
              )}

              {/* Users List */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {availableUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-terminal-text-muted mx-auto mb-2" />
                    <p className="font-mono text-sm text-terminal-text-muted">
                      Click &quot;Load&quot; to fetch available users
                    </p>
                  </div>
                ) : (
                  availableUsers
                    .filter(
                      (user) =>
                        !userSearch ||
                        user.name
                          ?.toLowerCase()
                          .includes(userSearch.toLowerCase()) ||
                        user.email
                          .toLowerCase()
                          .includes(userSearch.toLowerCase()),
                    )
                    .map((user) => {
                      const isSelected = selectedUsers.includes(user.id);
                      const isAlreadyEnrolled = enrollments.some(
                        (e) => e.user.id === user.id,
                      );

                      return (
                        <div
                          key={user.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isAlreadyEnrolled
                              ? "border-terminal-green/40 bg-terminal-green/5 opacity-60"
                              : isSelected
                                ? "border-terminal-green bg-terminal-green/10"
                                : "border-terminal-green/20 bg-terminal-darker/50 hover:border-terminal-green/40"
                          }`}
                          onClick={() =>
                            !isAlreadyEnrolled && toggleUserSelection(user.id)
                          }
                        >
                          <Checkbox
                            checked={isSelected || isAlreadyEnrolled}
                            disabled={isAlreadyEnrolled}
                            onCheckedChange={() =>
                              !isAlreadyEnrolled && toggleUserSelection(user.id)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-semibold">
                                {user.name || "No Name"}
                              </span>
                              <Badge
                                variant={
                                  user.role === "STUDENT"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-[10px]"
                              >
                                {user.role}
                              </Badge>
                              {isAlreadyEnrolled && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-terminal-green"
                                >
                                  Already Enrolled
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-terminal-text-muted font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleEnrollUsers}
                  disabled={isEnrolling || selectedUsers.length === 0}
                  className="flex-1"
                >
                  {isEnrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Enroll {selectedUsers.length} User
                      {selectedUsers.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddUsersDialog(false)}
                  disabled={isEnrolling}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
