"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
  Play,
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
import { AssignmentList } from "@/components/assignments/assignment-list";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/security";

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: "FILE" | "EXTERNAL_LINK" | "EMBEDDED" | "TEXT_NOTE";
  url?: string;
  embedCode?: string;
  textContent?: string;
  fileKey?: string;
  fileName?: string;
  mimeType?: string;
  downloadable?: boolean;
}

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "READING" | "QUIZ" | "ASSIGNMENT";
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

// Helper function to detect and render video from YouTube, Vimeo, or direct URL
const renderVideoPlayer = (
  videoUrl: string,
  onEnded?: () => void,
): React.ReactElement => {
  // YouTube detection
  const youtubeMatch = videoUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    );
  }

  // Vimeo detection
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:.*\/)?(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    );
  }

  // Default HTML5 video player for direct URLs
  return (
    <video
      src={videoUrl}
      controls
      className="w-full h-full bg-black"
      onEnded={onEnded}
      controlsList="nodownload"
    >
      Your browser does not support the video tag.
    </video>
  );
};

// Helper function to render different resource types
const renderResource = (resource: Resource): React.ReactElement => {
  switch (resource.type) {
    case "TEXT_NOTE":
      return (
        <Card key={resource.id} className="border-terminal-green/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-terminal-green" />
              {resource.title}
            </CardTitle>
            {resource.description && (
              <CardDescription>{resource.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-invert prose-terminal max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(resource.textContent),
              }}
            />
          </CardContent>
        </Card>
      );

    case "EMBEDDED":
      // Handle YouTube, Vimeo, or custom embed code
      if (resource.embedCode) {
        return (
          <Card key={resource.id} className="border-terminal-green/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-terminal-green" />
                {resource.title}
              </CardTitle>
              {resource.description && (
                <CardDescription>{resource.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video bg-terminal-darker rounded-b-lg overflow-hidden">
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource.embedCode) }}
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        );
      }
      // If embedCode is empty but URL exists, try to render as embedded video
      if (resource.url) {
        return (
          <Card key={resource.id} className="border-terminal-green/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-terminal-green" />
                {resource.title}
              </CardTitle>
              {resource.description && (
                <CardDescription>{resource.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="aspect-video bg-terminal-darker rounded-b-lg overflow-hidden">
                {renderVideoPlayer(resource.url)}
              </div>
            </CardContent>
          </Card>
        );
      }
      return <></>;

    case "EXTERNAL_LINK":
      return (
        <Card
          key={resource.id}
          className="border-terminal-green/20 hover:border-terminal-green/40 transition-colors cursor-pointer"
          onClick={() => window.open(resource.url, "_blank")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-terminal-green" />
                <div>
                  <h3 className="font-mono font-semibold text-terminal-text">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="text-sm font-mono text-terminal-text-muted mt-1">
                      {resource.description}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs shrink-0">
                External Link
              </Badge>
            </div>
          </CardContent>
        </Card>
      );

    case "FILE":
    default:
      return (
        <Card
          key={resource.id}
          className="border-terminal-green/20 hover:border-terminal-green/40 transition-colors"
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-terminal-green" />
                <div>
                  <h3 className="font-mono font-semibold text-terminal-text">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="text-sm font-mono text-terminal-text-muted mt-1">
                      {resource.description}
                    </p>
                  )}
                  {resource.fileName && (
                    <p className="text-xs font-mono text-terminal-text-muted mt-1">
                      {resource.fileName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {resource.mimeType && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {resource.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
                  </Badge>
                )}
                {resource.downloadable !== false && resource.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (resource.url) {
                        window.open(resource.url, "_blank");
                      }
                    }}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
  }
};

export default function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    params.then(({ id, lessonId: lid }) => {
      setCourseId(id);
      setLessonId(lid);
    });
  }, [params]);

  useEffect(() => {
    if (courseId && lessonId) {
      fetchLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const fetchLesson = async () => {
    if (!courseId || !lessonId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/student/programmes/${courseId}/lessons/${lessonId}`,
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
    if (!lesson || lesson.completed || !lessonId) return;

    try {
      setIsCompleting(true);
      const response = await fetch(
        `/api/student/lessons/${lessonId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        },
      );

      if (!response.ok) throw new Error("Failed to mark complete");

      toast.success("Lesson completed!");
      await fetchLesson();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Failed to mark lesson as complete");
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
            onClick={() => {
              if (courseId) {
                router.push(`/learn/${courseId}`);
              }
            }}
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

          {lesson.type === "VIDEO" &&
            lesson.duration &&
            lesson.duration > 0 && (
              <div className="flex items-center gap-2 mt-3 text-sm font-mono text-terminal-text-muted">
                <Clock className="h-4 w-4" />
                {lesson.duration} minutes
              </div>
            )}
        </div>

        {/* Video Player - Only show for VIDEO type lessons with valid video URLs */}
        {lesson.type === "VIDEO" &&
          lesson.videoUrl &&
          lesson.videoUrl.trim() && (
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="aspect-video bg-terminal-darker rounded-lg overflow-hidden">
                  {renderVideoPlayer(lesson.videoUrl, markComplete)}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Resources - Render each type appropriately */}
        {lesson.resources.length > 0 && (
          <div className="space-y-6 mb-6">
            {lesson.resources.map((resource) => renderResource(resource))}
          </div>
        )}

        {/* Assignments */}
        <div className="mb-6">
          {lessonId && <AssignmentList lessonId={lessonId} role="STUDENT" />}
        </div>

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
                  onClick={() => {
                    if (courseId) {
                      router.push(
                        `/learn/${courseId}/lesson/${lesson.navigation.previous!.id}`,
                      );
                    }
                  }}
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
                  onClick={() => {
                    if (courseId) {
                      router.push(
                        `/learn/${courseId}/lesson/${lesson.navigation.next!.id}`,
                      );
                    }
                  }}
                  className="gap-2"
                >
                  Next: {lesson.navigation.next.title}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (courseId) {
                      router.push(`/learn/${courseId}`);
                    }
                  }}
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
