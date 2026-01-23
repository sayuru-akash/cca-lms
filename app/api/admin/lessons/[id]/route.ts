import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/admin/lessons/[id] - Get single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/lessons/[id] - Update lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, content, type, duration, order } = body;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(duration !== undefined && { duration }),
        ...(order !== undefined && { order }),
      },
      include: {
        _count: {
          select: {
            resources: true,
          },
        },
      },
    });

    return NextResponse.json({
      lesson,
      message: "Lesson updated successfully",
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/lessons/[id] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 },
    );
  }
}
