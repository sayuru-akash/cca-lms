import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/admin/lessons/reorder - Reorder lessons
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
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
