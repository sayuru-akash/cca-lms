import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { deleteFromB2 } from "@/lib/b2";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/admin/assignments/[id] - Get single assignment
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
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
        },
        assignmentSubmissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const isAssigned = assignment.lesson.module.course.lecturers.some(
        (l) => l.lecturerId === session.user.id,
      );
      if (!isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/assignments/[id] - Update assignment
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check ownership if lecturer
    if (session.user.role === "LECTURER") {
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        include: {
          lesson: {
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
          },
        },
      });

      if (
        !assignment ||
        assignment.lesson.module.course.lecturers.length === 0
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const {
      title,
      description,
      instructions,
      dueDate,
      maxPoints,
      allowedFileTypes,
      maxFileSize,
      maxFiles,
      allowLateSubmission,
    } = body;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(maxPoints !== undefined && { maxPoints }),
        ...(allowedFileTypes !== undefined && { allowedFileTypes }),
        ...(maxFileSize !== undefined && { maxFileSize }),
        ...(maxFiles !== undefined && { maxFiles }),
        ...(allowLateSubmission !== undefined && { allowLateSubmission }),
      },
      include: {
        lesson: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "ASSIGNMENT_UPDATED",
      entityType: "Assignment",
      entityId: assignment.id,
      metadata: {
        title: assignment.title,
      },
    });

    return NextResponse.json({
      assignment,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/assignments/[id] - Delete assignment
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        title: true,
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Warn if there are submissions (unless force delete)
    if (assignment._count.assignmentSubmissions > 0 && !forceDelete) {
      return NextResponse.json(
        {
          error: `Assignment has ${assignment._count.assignmentSubmissions} submission(s). Use force=true to delete all submissions and files.`,
          submissionsCount: assignment._count.assignmentSubmissions,
        },
        { status: 400 },
      );
    }

    // Get B2 files to delete if force deleting
    let filesToDelete: { fileKey: string; fileId: string }[] = [];

    if (forceDelete && assignment._count.assignmentSubmissions > 0) {
      const assignmentWithFiles = await prisma.assignment.findUnique({
        where: { id },
        include: {
          assignmentSubmissions: {
            include: {
              attachments: {
                select: { fileKey: true, fileId: true },
              },
            },
          },
        },
      });

      if (assignmentWithFiles) {
        for (const submission of assignmentWithFiles.assignmentSubmissions) {
          for (const attachment of submission.attachments) {
            filesToDelete.push({
              fileKey: attachment.fileKey,
              fileId: attachment.fileId,
            });
          }
        }
      }
    }

    // Delete from database
    await prisma.assignment.delete({
      where: { id },
    });

    // Clean up B2 files
    for (const file of filesToDelete) {
      try {
        await deleteFromB2(file.fileKey, file.fileId);
      } catch (error) {
        console.error(`Failed to delete B2 file ${file.fileKey}:`, error);
      }
    }

    await createAuditLog({
      userId: session.user.id,
      action: "ASSIGNMENT_DELETED",
      entityType: "Assignment",
      entityId: id,
      metadata: {
        title: assignment.title,
        submissionsDeleted: assignment._count.assignmentSubmissions,
        filesDeleted: filesToDelete.length,
      },
    });

    return NextResponse.json({
      message: "Assignment deleted successfully",
      submissionsDeleted: assignment._count.assignmentSubmissions,
      filesDeleted: filesToDelete.length,
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 },
    );
  }
}
