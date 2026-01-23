import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

// POST /api/admin/lessons - Create new lesson
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, moduleId, type, duration, videoUrl } = body;

    if (!title || !moduleId) {
      return NextResponse.json(
        { error: "Title and moduleId are required" },
        { status: 400 },
      );
    }

    // Get the next order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = (lastLesson?.order ?? 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        videoUrl: videoUrl || null,
        moduleId,
        type: type || "VIDEO",
        duration: duration || 0,
        order,
      },
      include: {
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "LESSON_CREATED",
      entityType: "Lesson",
      entityId: lesson.id,
      metadata: { title, type, moduleId },
    });

    return NextResponse.json(
      { lesson, message: "Lesson created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 },
    );
  }
}
