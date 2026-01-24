"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Users, Search, Mail, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  enrolledCourses: Array<{
    courseId: string;
    courseTitle: string;
    status: string;
    progress: number;
    enrolledAt: string;
  }>;
  averageProgress: number;
  enrolledCoursesCount: number;
  completedCourses: number;
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }

    if (session?.user?.role !== "LECTURER" && session?.user?.role !== "ADMIN") {
      redirect("/dashboard");
    }

    if (status === "authenticated") {
      fetchStudents();
    }
  }, [status, session]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/lecturer/students");
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-terminal-green">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ students --active
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Students enrolled in your programmes
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-terminal-text-muted" />
            <Input
              type="text"
              placeholder="$ search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Users className="h-6 w-6 text-terminal-green" />
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {students.length}
                </div>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted mt-2">
                Total Students
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <BookOpen className="h-6 w-6 text-terminal-green" />
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {students.reduce((sum, s) => sum + s.enrolledCoursesCount, 0)}
                </div>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted mt-2">
                Total Enrollments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-6 w-6 text-terminal-green" />
                <div className="text-3xl font-bold font-mono text-terminal-green">
                  {students.length > 0
                    ? Math.round(
                        students.reduce(
                          (sum, s) => sum + s.averageProgress,
                          0,
                        ) / students.length,
                      )
                    : 0}
                  %
                </div>
              </div>
              <p className="font-mono text-sm text-terminal-text-muted mt-2">
                Avg Progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-terminal-text-muted mb-4" />
                <p className="font-mono text-terminal-text-muted">
                  {searchQuery
                    ? "No students found matching your search"
                    : "No students enrolled yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-mono font-semibold text-terminal-text mb-1">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-terminal-text-muted">
                          <Mail className="h-3 w-3" />
                          <span className="font-mono">{student.email}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-terminal-green mb-1">
                          {student.averageProgress}%
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Avg Progress
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 rounded bg-terminal-dark/50">
                        <div className="font-mono text-lg font-bold text-terminal-green">
                          {student.enrolledCoursesCount}
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Enrolled
                        </p>
                      </div>
                      <div className="text-center p-2 rounded bg-terminal-dark/50">
                        <div className="font-mono text-lg font-bold text-terminal-green">
                          {student.completedCourses}
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Completed
                        </p>
                      </div>
                      <div className="text-center p-2 rounded bg-terminal-dark/50">
                        <div className="font-mono text-lg font-bold text-terminal-text">
                          {new Date(student.joinDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                        <p className="text-xs font-mono text-terminal-text-muted">
                          Joined
                        </p>
                      </div>
                    </div>

                    {student.enrolledCourses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-terminal-green/10">
                        <p className="text-xs font-mono text-terminal-text-muted mb-2">
                          Enrolled Courses:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {student.enrolledCourses.map((course, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {course.courseTitle} - {course.progress}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
