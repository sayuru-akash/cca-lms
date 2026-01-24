import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/admin/lessons/reorder - Reorder lessons
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessons } = body; // Array of { id, order }

    if (!Array.isArray(lessons)) {
      return NextResponse.json(
        { error: "Invalid lessons array" },
        { status: 400 },
      );
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER" && lessons.length > 0) {
      const firstLesson = await prisma.lesson.findUnique({
        where: { id: lessons[0].id },
        include: {
          module: {
            include: { course: { select: { lecturerId: true } } },
          },
        },
      });

      if (
        !firstLesson ||
        firstLesson.module.course.lecturerId !== session.user.id
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Update all lesson orders in a transaction
    await prisma.$transaction(
      lessons.map((lesson) =>
        prisma.lesson.update({
          where: { id: lesson.id },
          data: { order: lesson.order },
        }),
      ),
    );

    return NextResponse.json({
      message: "Lessons reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering lessons:", error);
    return NextResponse.json(
      { error: "Failed to reorder lessons" },
      { status: 500 },
    );
  }
}
