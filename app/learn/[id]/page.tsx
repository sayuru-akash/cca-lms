"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Play,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  duration: number | null;
  videoUrl: string | null;
  contentUrl: string | null;
  completed: boolean;
  watchedSeconds: number;
  resources: {
    id: string;
    title: string;
    url: string;
    type: string;
  }[];
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
}

interface ProgrammeData {
  id: string;
  title: string;
  description: string | null;
  enrollment: {
    status: string;
    progress: number;
    enrolledAt: string;
  } | null;
  modules: Module[];
  stats: {
    totalLessons: number;
    completedLessons: number;
  };
}

export default function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [programme, setProgramme] = useState<ProgrammeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  // Check if user is authenticated and is a student
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    if (session.user.role !== "STUDENT") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Don't render anything while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <div className="flex items-center gap-3 text-terminal-green">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-mono">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not a student
  if (!session?.user || session.user.role !== "STUDENT") {
    return null;
  }

  useEffect(() => {
    params.then(({ id }) => {
      setCourseId(id);
    });
  }, [params]);

  useEffect(() => {
    if (courseId) {
      fetchProgramme();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchProgramme = async () => {
    if (!courseId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/student/programmes/${courseId}`);
      if (!response.ok) throw new Error("Failed to fetch programme");

      const data = await response.json();
      setProgramme(data);

      // Auto-expand first module
      if (data.modules.length > 0) {
        setOpenModules(new Set([data.modules[0].id]));
      }
    } catch (error) {
      console.error("Error fetching programme:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!courseId) return;

    // Double-check user role before enrollment
    if (session?.user?.role !== "STUDENT") {
      alert("Only students can enroll in programmes");
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(
        `/api/student/programmes/${courseId}/enroll`,
        {
          method: "POST",
        },
      );

      if (!response.ok) throw new Error("Failed to enroll");

      await fetchProgramme();
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Failed to enroll in programme");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const startLesson = (lessonId: string) => {
    if (!courseId) return;
    router.push(`/learn/${courseId}/lesson/${lessonId}`);
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
        <p className="font-mono text-terminal-text-muted">
          Programme not found
        </p>
      </div>
    );
  }

  const isEnrolled = !!programme.enrollment;

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow mb-2">
                {programme.title}
              </h1>
              <p className="font-mono text-sm text-terminal-text-muted">
                {programme.description}
              </p>
            </div>
            {isEnrolled && (
              <Badge variant="success" className="shrink-0">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Enrolled
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm font-mono text-terminal-text-muted">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {programme.modules.length} modules
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {programme.stats.totalLessons} lessons
            </div>
            {isEnrolled && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {programme.stats.completedLessons}/
                {programme.stats.totalLessons} completed
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        {isEnrolled && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-mono">
                  <span className="text-terminal-text-muted">
                    Your Progress
                  </span>
                  <span className="text-terminal-green font-semibold">
                    {Math.round(programme.enrollment!.progress)}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-terminal-darker border border-terminal-green/20 overflow-hidden">
                  <div
                    className="h-full bg-terminal-green rounded-full transition-all"
                    style={{ width: `${programme.enrollment!.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enroll Button */}
        {!isEnrolled && (
          <Card className="mb-8 border-terminal-green/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono font-semibold text-terminal-text mb-1">
                    Start Learning
                  </h3>
                  <p className="text-sm font-mono text-terminal-text-muted">
                    Enroll in this programme to access all lessons
                  </p>
                </div>
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="gap-2"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Enroll Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modules */}
        <div className="space-y-4">
          {programme.modules.map((module, moduleIndex) => {
            const isOpen = openModules.has(module.id);
            const completedCount = module.lessons.filter(
              (l) => l.completed,
            ).length;

            return (
              <Card key={module.id}>
                <CardHeader
                  className="cursor-pointer hover:bg-terminal-green/5 transition-colors"
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono">
                          Module {moduleIndex + 1}
                        </Badge>
                        {isEnrolled && (
                          <span className="text-xs font-mono text-terminal-text-muted">
                            {completedCount}/{module.lessons.length} completed
                          </span>
                        )}
                      </div>
                      <CardTitle className="font-mono">
                        {module.title}
                      </CardTitle>
                      {module.description && (
                        <CardDescription className="mt-2">
                          {module.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0">
                    <div className="h-px w-full bg-terminal-green/20 mb-4" />
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-terminal-green/10 bg-terminal-darker/30 hover:bg-terminal-green/5 transition-colors"
                        >
                          <div className="shrink-0">
                            {lesson.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-terminal-green" />
                            ) : isEnrolled ? (
                              <div className="h-5 w-5 rounded-full border-2 border-terminal-green/30" />
                            ) : (
                              <Lock className="h-5 w-5 text-terminal-text-muted" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-terminal-text-muted">
                                Lesson {lessonIndex + 1}
                              </span>
                              {lesson.duration && (
                                <>
                                  <span className="text-terminal-text-muted">
                                    •
                                  </span>
                                  <div className="flex items-center gap-1 text-xs font-mono text-terminal-text-muted">
                                    <Clock className="h-3 w-3" />
                                    {lesson.duration} min
                                  </div>
                                </>
                              )}
                            </div>
                            <p className="font-mono text-sm text-terminal-text">
                              {lesson.title}
                            </p>
                          </div>

                          {isEnrolled && (
                            <Button
                              size="sm"
                              onClick={() => startLesson(lesson.id)}
                              className="gap-2"
                            >
                              <Play className="h-3 w-3" />
                              {lesson.completed ? "Review" : "Start"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
