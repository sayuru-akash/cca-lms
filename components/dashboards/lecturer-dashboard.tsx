"use client";

import { useState, useEffect } from "react";
import { BookOpen, Users, Terminal, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalModules: number;
  publishedCourses: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  enrollmentCount: number;
  moduleCount: number;
  createdAt: string;
}

interface RecentEnrollment {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
}

export default function LecturerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalModules: 0,
    publishedCourses: 0,
  });
  const [myProgrammes, setMyProgrammes] = useState<Course[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<
    RecentEnrollment[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/lecturer/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setMyProgrammes(data.courses);
        setRecentEnrollments(data.recentEnrollments);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-terminal-green">Loading dashboard...</p>
      </div>
    );
  }

  const statsDisplay = [
    {
      title: "Assigned Programmes",
      value: stats.totalCourses.toString(),
      icon: BookOpen,
    },
    {
      title: "My Students",
      value: stats.totalStudents.toString(),
      icon: Users,
    },
    {
      title: "Published Modules",
      value: stats.totalModules.toString(),
      icon: FileText,
    },
  ];
  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="h-6 w-6 text-terminal-green" />
            <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow">
              $ lecturer-dashboard
            </h1>
          </div>
          <p className="font-mono text-sm text-terminal-text-muted">
            Manage your assigned programmes and students
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-6 w-6 text-terminal-green" />
                    <div className="text-3xl font-bold font-mono text-terminal-green">
                      {stat.value}
                    </div>
                  </div>
                  <p className="font-mono text-sm text-terminal-text-muted">
                    {stat.title}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* My Programmes */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Programmes
                </CardTitle>
                <CardDescription>
                  Programmes you&apos;re teaching
                </CardDescription>
              </div>
              <Link href="/programmes">
                <Button size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myProgrammes.length === 0 ? (
              <p className="text-center text-terminal-text-muted py-8">
                No programmes assigned yet
              </p>
            ) : (
              myProgrammes.slice(0, 5).map((programme) => (
                <div
                  key={programme.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/5 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-mono font-semibold text-terminal-text">
                        {programme.title}
                      </h3>
                      <Badge
                        variant={
                          programme.status === "PUBLISHED"
                            ? "success"
                            : "default"
                        }
                      >
                        {programme.status.toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono text-terminal-text-muted">
                      <span>{programme.enrollmentCount} students</span>
                      <span>•</span>
                      <span>{programme.moduleCount} modules</span>
                    </div>
                  </div>
                  <Link href={`/programmes/${programme.id}`}>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        {recentEnrollments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Enrollments
              </CardTitle>
              <CardDescription>New students in your programmes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-terminal-green/20 bg-terminal-darker/50"
                >
                  <div>
                    <h3 className="font-mono font-semibold text-terminal-text">
                      {enrollment.studentName}
                    </h3>
                    <div className="text-sm font-mono text-terminal-text-muted">
                      Enrolled in {enrollment.courseTitle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-terminal-green">
                      {enrollment.progress}% complete
                    </div>
                    <div className="text-xs text-terminal-text-muted">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
