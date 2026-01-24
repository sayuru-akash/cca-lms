import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId, lessonId } = await params;

    // Fetch lesson with module and course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true },
            },
          },
        },
        resources: true,
      },
    });

    if (!lesson || lesson.module.courseId !== courseId) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    // Get lesson progress
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
    });

    // Find previous and next lessons in the module
    const currentIndex = lesson.module.lessons.findIndex(
      (l) => l.id === lessonId,
    );
    const previous =
      currentIndex > 0 ? lesson.module.lessons[currentIndex - 1] : null;
    const next =
      currentIndex < lesson.module.lessons.length - 1
        ? lesson.module.lessons[currentIndex + 1]
        : null;

    // Generate signed URLs for FILE type resources
    const resources = await Promise.all(
      lesson.resources.map(async (r) => {
        let url = r.externalUrl || "";
        if (r.type === "FILE" && r.fileKey) {
          url = await getSignedUrl(r.fileKey, 3600); // 1 hour expiry
        }
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          type: r.type,
          url: url || undefined,
          embedCode: r.embedCode || undefined,
          textContent: r.textContent || undefined,
          fileKey: r.fileKey || undefined,
          fileName: r.fileName || undefined,
          mimeType: r.mimeType || undefined,
          downloadable: r.downloadable,
        };
      }),
    );

    return NextResponse.json({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration,
      completed: progress?.completed || false,
      watchedSeconds: progress?.watchedSeconds || 0,
      resources,
      navigation: {
        previous: previous ? { id: previous.id, title: previous.title } : null,
        next: next ? { id: next.id, title: next.title } : null,
        courseId: lesson.module.course.id,
        courseTitle: lesson.module.course.title,
        moduleTitle: lesson.module.title,
      },
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 },
    );
  }
}
