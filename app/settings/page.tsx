"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  BookOpen,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
  Eye,
  EyeOff,
  Users,
  GraduationCap,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface StudentStats {
  totalEnrolled: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
  recentEnrollments: {
    id: string;
    title: string;
    progress: number;
    status: string;
    enrolledAt: string;
  }[];
}

interface AdminLecturerStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalLecturers: number | null;
  totalEnrollments: number;
  recentCourses: {
    id: string;
    title: string;
    status: string;
    enrollmentCount: number;
    moduleCount: number;
    lessonCount: number;
    createdAt: string;
  }[];
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    createdAt: string;
  };
  stats: StudentStats | AdminLecturerStats | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/student/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setProfile(data);
      setName(data.user.name || "");
      setEmail(data.user.email || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsChangingPassword(true);
      setError(null);
      setSuccess(null);

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      const response = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-terminal-text-muted">
          Failed to load profile
        </p>
      </div>
    );
  }

  const isStudent = profile.user.role === "STUDENT";

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ settings --config
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-md border border-red-500/20 bg-red-500/10 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-md border border-terminal-green/20 bg-terminal-green/10 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-terminal-green shrink-0 mt-0.5" />
            <p className="font-mono text-sm text-terminal-green">{success}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    Full Name
                  </label>
                  <Input
                    placeholder="$ enter name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="$ enter email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    Role
                  </label>
                  <Badge variant={isStudent ? "default" : "success"}>
                    {profile.user.role}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    Member Since
                  </label>
                  <p className="font-mono text-sm text-terminal-text">
                    {formatDistanceToNow(new Date(profile.user.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="$ enter current password..."
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-muted hover:text-terminal-text"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="$ enter new password..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-muted hover:text-terminal-text"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-mono text-terminal-text-muted mb-2 block">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="$ confirm new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Student Stats - Only show for students */}
          {isStudent && profile.stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Learning Statistics
                  </CardTitle>
                  <CardDescription>Your progress overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        Enrolled Programmes
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-green">
                        {profile.stats.totalEnrolled}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        Completed
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-green">
                        {profile.stats.completedCourses}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        Total Lessons
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-text">
                        {profile.stats.totalLessons}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        Completed Lessons
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-text">
                        {profile.stats.completedLessons}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-mono text-sm text-terminal-text-muted">
                        Average Progress
                      </p>
                      <p className="font-mono text-lg font-bold text-terminal-green">
                        {profile.stats.averageProgress}%
                      </p>
                    </div>
                    <div className="w-full bg-terminal-darker rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-terminal-green h-full transition-all duration-500"
                        style={{ width: `${profile.stats.averageProgress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Recent Enrollments
                  </CardTitle>
                  <CardDescription>
                    Your most recently enrolled programmes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.stats.recentEnrollments.length === 0 ? (
                    <p className="font-mono text-sm text-terminal-text-muted text-center py-4">
                      No enrollments yet
                    </p>
                  ) : (
                    profile.stats.recentEnrollments.map((enrollment) => (
                      <Link
                        key={enrollment.id}
                        href={`/learn/${enrollment.id}`}
                        className="block p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50 hover:border-terminal-green/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-mono text-sm text-terminal-text font-medium">
                            {enrollment.title}
                          </p>
                          <Badge
                            variant={
                              enrollment.status === "COMPLETED"
                                ? "success"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {enrollment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 bg-terminal-darker rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-terminal-green h-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <p className="font-mono text-xs text-terminal-text-muted">
                            {Math.round(enrollment.progress)}%
                          </p>
                        </div>
                        <p className="font-mono text-xs text-terminal-text-muted mt-2">
                          Enrolled{" "}
                          {formatDistanceToNow(
                            new Date(enrollment.enrolledAt),
                            {
                              addSuffix: true,
                            },
                          )}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Admin/Lecturer Stats - Only show for admin and lecturer */}
          {!isStudent && profile.stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {profile.user.role === "ADMIN"
                      ? "Platform Overview"
                      : "Teaching Overview"}
                  </CardTitle>
                  <CardDescription>
                    {profile.user.role === "ADMIN"
                      ? "System-wide statistics"
                      : "Your courses and students"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        Total Programmes
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-green">
                        {"totalCourses" in profile.stats
                          ? profile.stats.totalCourses
                          : 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        Published
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-green">
                        {"publishedCourses" in profile.stats
                          ? profile.stats.publishedCourses
                          : 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        {profile.user.role === "ADMIN"
                          ? "Total Students"
                          : "My Students"}
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-text">
                        {"totalStudents" in profile.stats
                          ? profile.stats.totalStudents
                          : 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50">
                      <p className="font-mono text-xs text-terminal-text-muted mb-1">
                        {profile.user.role === "ADMIN"
                          ? "Total Lecturers"
                          : "Enrollments"}
                      </p>
                      <p className="font-mono text-2xl font-bold text-terminal-text">
                        {profile.user.role === "ADMIN" &&
                        "totalLecturers" in profile.stats
                          ? profile.stats.totalLecturers
                          : "totalEnrollments" in profile.stats
                            ? profile.stats.totalEnrollments
                            : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Programmes
                  </CardTitle>
                  <CardDescription>
                    {profile.user.role === "ADMIN"
                      ? "Recently created programmes"
                      : "Your recent programmes"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {"recentCourses" in profile.stats &&
                  profile.stats.recentCourses.length === 0 ? (
                    <p className="font-mono text-sm text-terminal-text-muted text-center py-4">
                      No programmes yet
                    </p>
                  ) : (
                    "recentCourses" in profile.stats &&
                    profile.stats.recentCourses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/programmes/${course.id}`}
                        className="block p-3 rounded-md border border-terminal-green/20 bg-terminal-darker/50 hover:border-terminal-green/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-mono text-sm text-terminal-text font-medium">
                            {course.title}
                          </p>
                          <Badge
                            variant={
                              course.status === "PUBLISHED"
                                ? "success"
                                : course.status === "DRAFT"
                                  ? "warning"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {course.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-terminal-text-muted font-mono">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{course.enrollmentCount} students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>
                              {course.moduleCount} modules, {course.lessonCount}{" "}
                              lessons
                            </span>
                          </div>
                        </div>
                        <p className="font-mono text-xs text-terminal-text-muted mt-2">
                          Created{" "}
                          {formatDistanceToNow(new Date(course.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
