"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
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

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number | null;
  completed: boolean;
  watchedSeconds: number;
  resources: Resource[];
  navigation: {
    previous: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
    courseId: string;
    courseTitle: string;
    moduleTitle: string;
  };
}

export default function LessonPage({
  params,
}: {
  params: { id: string; lessonId: string };
}) {
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.lessonId]);

  const fetchLesson = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/student/programmes/${params.id}/lessons/${params.lessonId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch lesson");

      const data = await response.json();
      setLesson(data);
    } catch (error) {
      console.error("Error fetching lesson:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markComplete = async () => {
    if (!lesson || lesson.completed) return;

    try {
      setIsCompleting(true);
      const response = await fetch(
        `/api/student/lessons/${params.lessonId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        },
      );

      if (!response.ok) throw new Error("Failed to mark complete");

      await fetchLesson();
    } catch (error) {
      console.error("Error marking complete:", error);
      alert("Failed to mark lesson as complete");
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-terminal-green" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
        <p className="font-mono text-terminal-text-muted">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-dark">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/learn/${params.id}`)}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {lesson.navigation.courseTitle}
          </Button>

          <div className="flex items-center gap-2 text-sm font-mono text-terminal-text-muted mb-2">
            <span>{lesson.navigation.courseTitle}</span>
            <span>→</span>
            <span>{lesson.navigation.moduleTitle}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-3xl font-bold text-terminal-green terminal-glow mb-2">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="font-mono text-sm text-terminal-text-muted">
                  {lesson.description}
                </p>
              )}
            </div>
            {lesson.completed && (
              <Badge variant="success" className="shrink-0">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>

          {lesson.duration && (
            <div className="flex items-center gap-2 mt-3 text-sm font-mono text-terminal-text-muted">
              <Clock className="h-4 w-4" />
              {lesson.duration} minutes
            </div>
          )}
        </div>

        {/* Video Player */}
        {lesson.videoUrl && (
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="aspect-video bg-terminal-darker rounded-lg overflow-hidden">
                <video
                  src={lesson.videoUrl}
                  controls
                  className="w-full h-full"
                  onEnded={markComplete}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources */}
        {lesson.resources.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Resources
              </CardTitle>
              <CardDescription>
                Additional materials for this lesson
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lesson.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-terminal-green/20 bg-terminal-darker/50 hover:bg-terminal-green/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-terminal-green" />
                      <span className="font-mono text-sm">
                        {resource.title}
                      </span>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {resource.type}
                    </Badge>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mark Complete */}
        {!lesson.completed && (
          <Card className="mb-6 border-terminal-green/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono font-semibold text-terminal-text mb-1">
                    Complete this lesson
                  </h3>
                  <p className="text-sm font-mono text-terminal-text-muted">
                    Mark as complete to track your progress
                  </p>
                </div>
                <Button
                  onClick={markComplete}
                  disabled={isCompleting}
                  className="gap-2"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {lesson.navigation.previous ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/learn/${params.id}/lesson/${lesson.navigation.previous!.id}`,
                    )
                  }
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous: {lesson.navigation.previous.title}
                </Button>
              ) : (
                <div />
              )}

              {lesson.navigation.next ? (
                <Button
                  onClick={() =>
                    router.push(
                      `/learn/${params.id}/lesson/${lesson.navigation.next!.id}`,
                    )
                  }
                  className="gap-2"
                >
                  Next: {lesson.navigation.next.title}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/learn/${params.id}`)}
                >
                  Back to Programme
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
