import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromB2 } from "@/lib/b2";
import { deleteFromR2 } from "@/lib/r2";

// GET /api/admin/lessons/[id] - Get single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                lecturers: {
                  select: {
                    lecturerId: true,
                  },
                },
              },
            },
          },
        },
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

    // Lecturers can only access lessons for their own courses
    if (session.user.role === "LECTURER") {
      const isAssigned = lesson.module.course.lecturers.some(
        (l) => l.lecturerId === session.user.id,
      );
      if (!isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, content, type, duration, order } = body;

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const lesson = await prisma.lesson.findUnique({
        where: { id },
        include: {
          module: {
            include: {
              course: {
                select: {
                  lecturers: {
                    where: { lecturerId: session.user.id },
                  },
                },
              },
            },
          },
        },
      });

      if (!lesson || lesson.module.course.lecturers.length === 0) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

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

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: {
                lecturers: {
                  select: {
                    lecturerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const isAssigned = lesson.module.course.lecturers.some(
        (l) => l.lecturerId === session.user.id,
      );
      if (!isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all files that will be cascade deleted (resources in R2, submissions in B2)
    const lessonWithFiles = await prisma.lesson.findUnique({
      where: { id },
      include: {
        resources: {
          select: { fileKey: true },
        },
        assignments: {
          include: {
            assignmentSubmissions: {
              include: {
                attachments: {
                  select: { fileKey: true },
                },
              },
            },
          },
        },
      },
    });

    // Separate R2 (resources) and B2 (submissions) file keys
    const r2FileKeys: string[] = []; // Lesson resources (Cloudflare R2)
    const b2FileKeys: string[] = []; // Student submissions (Backblaze B2)

    if (lessonWithFiles) {
      // Lesson resources are in R2
      for (const resource of lessonWithFiles.resources) {
        if (resource.fileKey) {
          r2FileKeys.push(resource.fileKey);
        }
      }

      // Assignment submission attachments are in B2
      for (const assignment of lessonWithFiles.assignments) {
        for (const submission of assignment.assignmentSubmissions) {
          for (const attachment of submission.attachments) {
            if (attachment.fileKey) {
              b2FileKeys.push(attachment.fileKey);
            }
          }
        }
      }
    }

    // Delete from database first (cascade will clean up relations)
    await prisma.lesson.delete({
      where: { id },
    });

    // Clean up R2 files (resources) - don't fail if cleanup fails
    await Promise.allSettled(
      r2FileKeys.map(async (fileKey) => {
        try {
          await deleteFromR2(fileKey);
        } catch (error) {
          console.error(`Failed to delete R2 file ${fileKey}:`, error);
        }
      }),
    );

    // Clean up B2 files (submissions) - don't fail if cleanup fails
    await Promise.allSettled(
      b2FileKeys.map(async (fileKey) => {
        try {
          await deleteFromB2(fileKey);
        } catch (error) {
          console.error(`Failed to delete B2 file ${fileKey}:`, error);
        }
      }),
    );

    return NextResponse.json({
      message: "Lesson deleted successfully",
      filesDeleted: r2FileKeys.length + b2FileKeys.length,
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 },
    );
  }
}
