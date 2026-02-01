"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  MoreVertical,
  BookOpen,
  Loader2,
  CheckCircle2,
  Copy,
  X,
  Edit,
  Eye,
  Power,
  PowerOff,
  KeyRound,
  GraduationCap,
  Trash2,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    courses: number;
  };
}

interface UserDetails extends User {
  emailVerified: string | null;
}

interface Programme {
  id: string;
  title: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  _count: {
    modules: number;
  };
}

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  course: Programme;
}

export default function UsersClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<"STUDENT" | "LECTURER">("STUDENT");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);

  // Create
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdUserData, setCreatedUserData] = useState<{
    email: string;
    password: string;
    emailSent?: boolean;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: activeTab,
  });
  const [createTurnstileToken, setCreateTurnstileToken] = useState<
    string | null
  >(null);
  const createTurnstileRef = useRef<HTMLDivElement>(null);
  const createTurnstileWidgetIdRef = useRef<string | null>(null);

  // Turnstile callbacks for create form
  const handleCreateTurnstileSuccess = (token: string) => {
    setCreateTurnstileToken(token);
  };

  const handleCreateTurnstileError = () => {
    setCreateTurnstileToken(null);
  };

  const handleCreateTurnstileExpired = () => {
    setCreateTurnstileToken(null);
  };

  // Expose create callbacks to window for Turnstile
  useEffect(() => {
    const initTurnstile = () => {
      if ((window as any).turnstile && createTurnstileRef.current) {
        createTurnstileWidgetIdRef.current = (window as any).turnstile.render(
          createTurnstileRef.current,
          {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
            callback: handleCreateTurnstileSuccess,
            "error-callback": handleCreateTurnstileError,
            "expired-callback": handleCreateTurnstileExpired,
            theme: "dark",
          },
        );
      }
    };

    // Check if Turnstile is already loaded
    if ((window as any).turnstile) {
      initTurnstile();
    } else {
      // Wait for Turnstile to load
      const checkTurnstile = setInterval(() => {
        if ((window as any).turnstile) {
          clearInterval(checkTurnstile);
          initTurnstile();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkTurnstile);
      }, 10000);
    }

    return () => {
      if (createTurnstileWidgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(createTurnstileWidgetIdRef.current);
      }
    };
  }, []);

  // Function to reset create CAPTCHA widget
  const resetCreateCaptcha = () => {
    if (createTurnstileWidgetIdRef.current && (window as any).turnstile) {
      (window as any).turnstile.reset(createTurnstileWidgetIdRef.current);
      setCreateTurnstileToken(null);
    }
  };

  // Edit
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
  });

  // View
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserDetails | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Reset password
  const [resetPasswordData, setResetPasswordData] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // Programme assignment
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoadingProgrammes, setIsLoadingProgrammes] = useState(false);
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([]);
  const [programmeSearch, setProgrammeSearch] = useState("");

  // View enrollments
  const [userEnrollments, setUserEnrollments] = useState<Enrollment[]>([]);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, searchQuery, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        role: activeTab,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter.toUpperCase() }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
      setPage(data.pagination.page);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          generatePassword: true,
          turnstileToken: createTurnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setCreatedUserData({
        email: data.user.email,
        password: data.generatedPassword,
        emailSent: data.emailSent,
      });

      setCreateForm({ name: "", email: "", role: activeTab });
      fetchUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "An error occurred");
      resetCreateCaptcha(); // Reset CAPTCHA on error since token is consumed
      setIsCreating(false);
    }
  };

  const handleViewUser = async (user: User) => {
    setViewingUser(null);
    setShowViewDialog(true);
    setIsLoadingView(true);

    try {
      const [userResponse, enrollmentsResponse] = await Promise.all([
        fetch(`/api/admin/users/${user.id}`),
        fetch(`/api/admin/users/${user.id}/enrollments`),
      ]);

      if (!userResponse.ok) throw new Error("Failed to fetch user details");

      const userData = await userResponse.json();
      setViewingUser(userData.user);

      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json();
        setUserEnrollments(enrollmentsData.enrollments);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email,
      role: user.role,
      status: user.status,
    });
    setEditError("");
    setResetPasswordData(null);
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditError("");
    setIsEditing(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      fetchUsers();
      setShowEditDialog(false);
      setEditingUser(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsEditing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;

    setEditError("");
    setIsEditing(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          resetPassword: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      if (data.newPassword) {
        setResetPasswordData({
          email: data.user.email,
          password: data.newPassword,
        });
      }

      fetchUsers();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const action = newStatus === "SUSPENDED" ? "suspend" : "activate";

    const confirmed = await confirm({
      title: newStatus === "SUSPENDED" ? "Suspend Account" : "Activate Account",
      description:
        newStatus === "SUSPENDED"
          ? `Suspending "${user.name || user.email}" will prevent them from logging in. You can reactivate them later.`
          : `Reactivating "${user.name || user.email}" will allow them to log in again.`,
      variant: newStatus === "SUSPENDED" ? "warning" : "default",
      confirmText: newStatus === "SUSPENDED" ? "Suspend" : "Activate",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast.success(`Account ${action}d`, {
        description: `"${user.name || user.email}" has been ${action}d`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Failed to ${action} account`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    // Don't allow deleting yourself
    if (user.id === session?.user?.id) {
      toast.error("Cannot delete your own account");
      return;
    }

    const confirmed = await confirm({
      title: "Permanently Delete User",
      description: `This will permanently mark "${user.name || user.email}" as deleted. Their data will be preserved but they will never be able to log in again. This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete User",
      requireTypedConfirmation: "DELETE",
      details: [
        `User: ${user.name || "No Name"}`,
        `Email: ${user.email}`,
        `Role: ${user.role}`,
        `Enrollments: ${user._count?.courses || 0}`,
        "All submissions and progress will be preserved",
        "User will be unable to log in",
      ],
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELETED",
        }),
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("User deleted", {
        description: `"${user.name || user.email}" has been permanently deleted`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const copyCredentials = (email: string, password: string) => {
    const text = `Login Credentials\n\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after first login.`;
    navigator.clipboard.writeText(text);
  };

  const handleAssignProgrammes = (user: User) => {
    setAssigningUser(user);
    setSelectedProgrammes([]);
    setProgrammeSearch("");
    setAssignError("");
    setShowAssignDialog(true);
    fetchProgrammes();
    fetchUserEnrollments(user.id);
  };

  const fetchProgrammes = async () => {
    try {
      setIsLoadingProgrammes(true);
      const response = await fetch(
        "/api/admin/programmes?limit=100&status=PUBLISHED",
      );
      if (!response.ok) throw new Error("Failed to fetch programmes");

      const data = await response.json();
      setProgrammes(data.programmes);
    } catch (error) {
      console.error("Error fetching programmes:", error);
      setAssignError("Failed to load programmes");
    } finally {
      setIsLoadingProgrammes(false);
    }
  };

  const fetchUserEnrollments = async (userId: string) => {
    try {
      setIsLoadingEnrollments(true);
      const response = await fetch(`/api/admin/users/${userId}/enrollments`);
      if (!response.ok) throw new Error("Failed to fetch enrollments");

      const data = await response.json();
      setUserEnrollments(data.enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assigningUser) return;
    if (selectedProgrammes.length === 0) {
      setAssignError("Please select at least one programme");
      return;
    }

    setIsAssigning(true);
    setAssignError("");

    try {
      const response = await fetch(
        `/api/admin/users/${assigningUser.id}/enrollments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseIds: selectedProgrammes }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign programmes");
      }

      // Refresh user list and enrollments
      fetchUsers();
      fetchUserEnrollments(assigningUser.id);
      setSelectedProgrammes([]);

      // Show success message in the UI
      if (data.skipped > 0) {
        setAssignError(`✓ ${data.message}`);
      }
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveEnrollment = async (
    userId: string,
    courseId: string,
    programmeName?: string,
  ) => {
    const confirmed = await confirm({
      title: "Remove Programme Assignment",
      description: `Are you sure you want to remove the user from "${programmeName || "this programme"}"? Their progress will be lost.`,
      variant: "warning",
      confirmText: "Remove",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/enrollments?courseId=${courseId}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to remove enrollment");

      toast.success("Programme assignment removed");
      fetchUsers();
      fetchUserEnrollments(userId);
    } catch (error) {
      console.error("Error removing enrollment:", error);
      toast.error("Failed to remove programme assignment");
    }
  };

  const toggleProgrammeSelection = (programmeId: string) => {
    setSelectedProgrammes((prev) =>
      prev.includes(programmeId)
        ? prev.filter((id) => id !== programmeId)
        : [...prev, programmeId],
    );
  };

  const filteredProgrammes = programmes.filter((prog) =>
    prog.title.toLowerCase().includes(programmeSearch.toLowerCase()),
  );

  const enrolledProgrammeIds = new Set(userEnrollments.map((e) => e.course.id));

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setCreatedUserData(null);
    setCreateError("");
    setIsCreating(false);
    setCreateForm({ name: "", email: "", role: activeTab });
    setCreateTurnstileToken(null);
  };

  const openCreateDialog = () => {
    setCreateForm((prev) => ({ ...prev, role: activeTab }));
    setShowCreateDialog(true);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Never";
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
              <Users className="h-6 w-6 text-terminal-green" />
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
                $ users --manage
              </h1>
            </div>
            <p className="font-mono text-sm text-terminal-text-muted">
              Create and manage student and lecturer accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="gap-2 border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10"
              variant="outline"
              onClick={() => router.push("/bulk-enroll")}
            >
              <Upload className="h-4 w-4" />
              Bulk Enroll
            </Button>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Add {activeTab === "STUDENT" ? "Student" : "Lecturer"}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "STUDENT" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("STUDENT");
              setPage(1);
            }}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Students
          </Button>
          <Button
            variant={activeTab === "LECTURER" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("LECTURER");
              setPage(1);
            }}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Lecturers
          </Button>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder={`$ search ${activeTab === "STUDENT" ? "students" : "lecturers"}...`}
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
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
              <CardTitle>
                {activeTab === "STUDENT" ? "Student" : "Lecturer"} Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-terminal-text-muted mx-auto mb-4" />
                  <p className="font-mono text-terminal-text-muted">
                    No {activeTab === "STUDENT" ? "students" : "lecturers"}{" "}
                    found
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={openCreateDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab === "STUDENT" ? "Student" : "Lecturer"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 hover:border-terminal-green/40 transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full border-2 border-terminal-green bg-terminal-green/10 flex items-center justify-center font-mono font-bold text-terminal-green">
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono font-semibold text-terminal-text">
                              {user.name || "No Name"}
                            </h3>
                            <Badge
                              variant={
                                user.status === "ACTIVE"
                                  ? "default"
                                  : user.status === "DELETED"
                                    ? "outline"
                                    : "danger"
                              }
                              className={`text-[10px] ${user.status === "DELETED" ? "opacity-60" : ""}`}
                            >
                              {user.status === "ACTIVE"
                                ? "Active"
                                : user.status === "DELETED"
                                  ? "Deleted"
                                  : "Suspended"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-muted">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <span>Joined {formatDate(user.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs font-mono text-terminal-text-muted mb-1">
                            {activeTab === "STUDENT"
                              ? "Enrolled"
                              : "Programmes"}
                          </p>
                          <p className="text-lg font-mono font-bold text-terminal-green">
                            {user._count.courses}
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
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAssignProgrammes(user)}
                            >
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Assign Programmes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(user)}
                              disabled={user.status === "DELETED"}
                            >
                              {user.status === "ACTIVE" ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Suspend Account
                                </>
                              ) : user.status === "SUSPENDED" ? (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Activate Account
                                </>
                              ) : (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2 opacity-50" />
                                  <span className="opacity-50">Deleted</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            {user.status !== "DELETED" && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            )}
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

      {/* Create Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) closeCreateDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createdUserData
                ? "Login Credentials Created"
                : `Add New ${activeTab === "STUDENT" ? "Student" : "Lecturer"}`}
            </DialogTitle>
            <DialogDescription>
              {createdUserData
                ? "Copy these credentials and send them to the user"
                : `Create a new ${activeTab === "STUDENT" ? "student" : "lecturer"} account. A secure password will be generated automatically.`}
            </DialogDescription>
          </DialogHeader>

          {createdUserData ? (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-terminal-green bg-terminal-green/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-terminal-green mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-mono font-semibold">
                    Account Created Successfully
                  </span>
                </div>

                {/* Email Status */}
                <div
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    createdUserData.emailSent
                      ? "bg-terminal-green/10 text-terminal-green border border-terminal-green/20"
                      : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                  }`}
                >
                  {createdUserData.emailSent ? (
                    <>
                      <Mail className="h-4 w-4" /> Welcome email sent
                      successfully to user
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" /> Email sending failed - please
                      share credentials manually
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-terminal-text-muted">
                      Email
                    </Label>
                    <p className="font-mono text-sm text-terminal-text bg-terminal-darker p-2 rounded border border-terminal-green/20">
                      {createdUserData.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-terminal-text-muted">
                      Temporary Password
                    </Label>
                    <p className="font-mono text-sm text-terminal-text bg-terminal-darker p-2 rounded border border-terminal-green/20 break-all">
                      {createdUserData.password}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-terminal-text-muted italic">
                  {createdUserData.emailSent
                    ? "✉️ User has been notified via email with login instructions."
                    : "⚠️ Save these credentials now. The password won't be shown again."}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    copyCredentials(
                      createdUserData.email,
                      createdUserData.password,
                    )
                  }
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <Copy className="h-4 w-4" />
                  Copy Credentials
                </Button>
                <Button onClick={closeCreateDialog} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-4">
              {createError && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="e.g., John Doe"
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="e.g., john.doe@example.com"
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value: "STUDENT" | "LECTURER") =>
                    setCreateForm({ ...createForm, role: value })
                  }
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="LECTURER">Lecturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-terminal-green/20 bg-terminal-green/5 p-3 text-xs text-terminal-text-muted">
                <p className="font-semibold mb-1">
                  📧 Password will be auto-generated
                </p>
                <p>
                  A secure password will be created and displayed after account
                  creation.
                </p>
              </div>

              {/* Turnstile CAPTCHA */}
              <div className="space-y-2">
                <div ref={createTurnstileRef} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isCreating || !createTurnstileToken}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>Create Account</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateDialog}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resetPasswordData ? "Password Reset Successful" : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {resetPasswordData
                ? "Copy the new password and send it to the user"
                : "Update user information and settings"}
            </DialogDescription>
          </DialogHeader>

          {resetPasswordData ? (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-terminal-green bg-terminal-green/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-terminal-green mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-mono font-semibold">
                    Password Reset
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-terminal-text-muted">
                      Email
                    </Label>
                    <p className="font-mono text-sm text-terminal-text bg-terminal-darker p-2 rounded border border-terminal-green/20">
                      {resetPasswordData.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-terminal-text-muted">
                      New Password
                    </Label>
                    <p className="font-mono text-sm text-terminal-text bg-terminal-darker p-2 rounded border border-terminal-green/20 break-all">
                      {resetPasswordData.password}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    copyCredentials(
                      resetPasswordData.email,
                      resetPasswordData.password,
                    )
                  }
                  className="flex-1 gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy Password
                </Button>
                <Button
                  onClick={() => {
                    setResetPasswordData(null);
                    setShowEditDialog(false);
                  }}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {editError && (
                <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                  {editError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, role: value })
                  }
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="LECTURER">Lecturer</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
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
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
                  onClick={handleResetPassword}
                  disabled={isEditing}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View complete user information and activity
            </DialogDescription>
          </DialogHeader>

          {isLoadingView ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
            </div>
          ) : viewingUser ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full border-2 border-terminal-green bg-terminal-green/10 flex items-center justify-center font-mono font-bold text-terminal-green text-xl shrink-0">
                  {getInitials(viewingUser.name)}
                </div>
                <div className="flex-1">
                  <h3 className="font-mono text-xl font-bold text-terminal-text mb-1">
                    {viewingUser.name || "No Name"}
                  </h3>
                  <p className="font-mono text-sm text-terminal-text-muted mb-2">
                    {viewingUser.email}
                  </p>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        viewingUser.status === "ACTIVE"
                          ? "default"
                          : viewingUser.status === "DELETED"
                            ? "outline"
                            : "danger"
                      }
                      className={
                        viewingUser.status === "SUSPENDED"
                          ? "bg-red-500/20 text-red-300 border-red-500/40"
                          : viewingUser.status === "DELETED"
                            ? "opacity-60"
                            : ""
                      }
                    >
                      {viewingUser.status === "ACTIVE"
                        ? "Active"
                        : viewingUser.status === "DELETED"
                          ? "Deleted"
                          : "Suspended"}
                    </Badge>
                    <Badge variant="outline">{viewingUser.role}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Account Created
                  </Label>
                  <p className="font-mono text-sm">
                    {formatDateTime(viewingUser.createdAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Last Updated
                  </Label>
                  <p className="font-mono text-sm">
                    {formatDateTime(viewingUser.updatedAt)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    Email Verified
                  </Label>
                  <p className="font-mono text-sm">
                    {viewingUser.emailVerified
                      ? formatDateTime(viewingUser.emailVerified)
                      : "Not verified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-terminal-text-muted">
                    {viewingUser.role === "LECTURER"
                      ? "Programmes Assigned"
                      : "Enrollments"}
                  </Label>
                  <p className="font-mono text-sm text-terminal-green font-bold">
                    {viewingUser._count.courses}
                  </p>
                </div>
              </div>

              {userEnrollments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {viewingUser.role === "LECTURER"
                      ? "Assigned Programmes"
                      : "Enrolled Programmes"}
                  </Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userEnrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-terminal-green/20 bg-terminal-darker/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-terminal-green" />
                            <span className="font-mono text-sm font-semibold">
                              {enrollment.course.title}
                            </span>
                            <Badge
                              variant={
                                enrollment.course.status === "PUBLISHED"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {enrollment.course.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono text-terminal-text-muted">
                            <span>
                              Enrolled {formatDate(enrollment.enrolledAt)}
                            </span>
                            {viewingUser.role === "STUDENT" && (
                              <span className="text-terminal-green">
                                {Math.round(enrollment.progress || 0)}% complete
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleRemoveEnrollment(
                              viewingUser.id,
                              enrollment.course.id,
                              enrollment.course.title,
                            )
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    handleEditUser(viewingUser);
                  }}
                  variant="outline"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  onClick={() => {
                    setShowViewDialog(false);
                    handleAssignProgrammes(viewingUser);
                  }}
                  className="flex-1"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Assign Programmes
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
              Failed to load user details
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Programmes Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Programmes</DialogTitle>
            <DialogDescription>
              {assigningUser
                ? `Select programmes to assign to ${assigningUser.name || assigningUser.email}`
                : "Select programmes"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingProgrammes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {assignError && (
                <div
                  className={`rounded-md border p-3 text-sm ${
                    assignError.startsWith("✓")
                      ? "border-terminal-green bg-terminal-green/10 text-terminal-green"
                      : "border-destructive bg-destructive/10 text-destructive"
                  }`}
                >
                  {assignError}
                </div>
              )}

              {/* Current Enrollments */}
              {isLoadingEnrollments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-terminal-green" />
                </div>
              ) : userEnrollments.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Currently Enrolled ({userEnrollments.length})
                  </Label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {userEnrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-2 rounded border border-terminal-green/20 bg-terminal-green/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-terminal-green" />
                          <span className="font-mono">
                            {enrollment.course.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {enrollment.course.status}
                          </Badge>
                        </div>
                        <span className="font-mono text-terminal-text-muted">
                          {Math.round(enrollment.progress)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="programme-search">
                  Select Programmes to Assign
                </Label>
                <Input
                  id="programme-search"
                  type="text"
                  placeholder="$ search programmes..."
                  value={programmeSearch}
                  onChange={(e) => setProgrammeSearch(e.target.value)}
                  className="font-mono"
                />
              </div>

              {/* Programme List */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {filteredProgrammes.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 text-terminal-text-muted mx-auto mb-2" />
                    <p className="font-mono text-sm text-terminal-text-muted">
                      {programmes.length === 0
                        ? "No published programmes available"
                        : "No programmes match your search"}
                    </p>
                  </div>
                ) : (
                  filteredProgrammes.map((programme) => {
                    const isEnrolled = enrolledProgrammeIds.has(programme.id);
                    const isSelected = selectedProgrammes.includes(
                      programme.id,
                    );

                    return (
                      <div
                        key={programme.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          isEnrolled
                            ? "border-terminal-green/40 bg-terminal-green/5 opacity-60"
                            : isSelected
                              ? "border-terminal-green bg-terminal-green/10"
                              : "border-terminal-green/20 bg-terminal-darker/50 hover:border-terminal-green/40"
                        }`}
                        onClick={() =>
                          !isEnrolled && toggleProgrammeSelection(programme.id)
                        }
                      >
                        <Checkbox
                          checked={isSelected || isEnrolled}
                          disabled={isEnrolled}
                          onCheckedChange={() =>
                            !isEnrolled &&
                            toggleProgrammeSelection(programme.id)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="h-4 w-4 text-terminal-green" />
                            <span className="font-mono text-sm font-semibold">
                              {programme.title}
                            </span>
                            <Badge
                              variant={
                                programme.status === "PUBLISHED"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-[10px]"
                            >
                              {programme.status}
                            </Badge>
                            {isEnrolled && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-terminal-green"
                              >
                                Enrolled
                              </Badge>
                            )}
                          </div>
                          {programme.description && (
                            <p className="text-xs text-terminal-text-muted font-mono line-clamp-2">
                              {programme.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-terminal-text-muted font-mono">
                            <span>{programme._count.modules} modules</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSubmitAssignment}
                  disabled={isAssigning || selectedProgrammes.length === 0}
                  className="flex-1"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Assign {selectedProgrammes.length} Programme
                      {selectedProgrammes.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignDialog(false)}
                  disabled={isAssigning}
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
