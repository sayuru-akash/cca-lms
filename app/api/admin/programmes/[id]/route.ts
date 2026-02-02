import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";
import { deleteFromR2 } from "@/lib/r2";
import { deleteFromB2 } from "@/lib/b2";

// GET /api/admin/programmes/[id] - Get single programme
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin or lecturer
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LECTURER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const programme = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
        lecturers: {
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                user: {
                  role: "STUDENT",
                },
              },
            },
            modules: true,
          },
        },
      },
    });

    if (!programme) {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // Lecturers can only access their own programmes
    if (session.user.role === "LECTURER") {
      const isAssigned = programme.lecturers.some(
        (l) => l.lecturerId === session.user.id,
      );

      if (!isAssigned) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Map lecturers from the relationship
    const lecturers = programme.lecturers.map((l) => l.lecturer);

    return NextResponse.json({
      programme: {
        ...programme,
        lecturers,
      },
    });
  } catch (error) {
    console.error("Error fetching programme:", error);
    return NextResponse.json(
      { error: "Failed to fetch programme" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/programmes/[id] - Update programme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, thumbnail, lecturerIds, status } = body;

    // Get existing programme for audit
    const existingProgramme = await prisma.course.findUnique({
      where: { id },
      include: {
        lecturers: true,
      },
    });

    if (!existingProgramme) {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // Validate lecturers if provided
    if (lecturerIds && Array.isArray(lecturerIds) && lecturerIds.length > 0) {
      const lecturers = await prisma.user.findMany({
        where: {
          id: { in: lecturerIds },
          role: "LECTURER",
        },
      });

      if (lecturers.length !== lecturerIds.length) {
        return NextResponse.json(
          { error: "One or more invalid lecturers selected" },
          { status: 400 },
        );
      }
    }

    // Update programme with transaction to handle lecturer assignments
    const programme = await prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.course.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(thumbnail !== undefined && { thumbnail }),
          ...(status && { status }),
        },
      });

      // Handle lecturer assignments if provided
      if (lecturerIds !== undefined) {
        // Delete existing assignments
        await tx.courseLecturer.deleteMany({
          where: { courseId: id },
        });

        // Create new assignments
        if (Array.isArray(lecturerIds) && lecturerIds.length > 0) {
          await tx.courseLecturer.createMany({
            data: lecturerIds.map((lecId) => ({
              courseId: id,
              lecturerId: lecId,
              assignedBy: session.user.id,
            })),
          });
        }
      }

      // Fetch updated programme with counts
      return tx.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  user: {
                    role: "STUDENT",
                  },
                },
              },
              modules: true,
            },
          },
          lecturers: {
            include: {
              lecturer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    if (!programme) {
      return NextResponse.json(
        { error: "Programme not found after update" },
        { status: 404 },
      );
    }

    // Audit log with before/after
    await auditActions.programmeUpdated(
      session.user.id,
      programme.id,
      existingProgramme,
      programme,
    );

    return NextResponse.json({
      programme,
      message: "Programme updated successfully",
    });
  } catch (error) {
    console.error("Error updating programme:", error);
    return NextResponse.json(
      { error: "Failed to update programme" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/programmes/[id] - Archive programme (soft delete) or permanent delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const forceDelete = searchParams.get("force") === "true";

    // Check if programme exists
    const existingProgramme = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    if (!existingProgramme) {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // Force delete - permanent deletion with file cleanup
    if (forceDelete) {
      // Only allow permanent delete for archived programmes
      if (existingProgramme.status !== "ARCHIVED") {
        return NextResponse.json(
          {
            error:
              "Only archived programmes can be permanently deleted. Archive it first.",
          },
          { status: 400 },
        );
      }

      // Collect all files to delete before deleting the programme
      // 1. Get all R2 files (LessonResource) - only those with fileKey
      const lessonResources = await prisma.lessonResource.findMany({
        where: {
          lesson: {
            module: {
              courseId: id,
            },
          },
          fileKey: { not: null },
        },
        select: {
          fileKey: true,
        },
      });

      // 2. Get all B2 files (AssignmentSubmissionAttachment)
      const submissionFiles =
        await prisma.assignmentSubmissionAttachment.findMany({
          where: {
            submission: {
              assignment: {
                lesson: {
                  module: {
                    courseId: id,
                  },
                },
              },
            },
          },
          select: {
            fileKey: true,
            fileId: true,
          },
        });

      // 3. Get legacy R2 submission attachments (SubmissionAttachment)
      const legacySubmissionFiles = await prisma.submissionAttachment.findMany({
        where: {
          submission: {
            lesson: {
              module: {
                courseId: id,
              },
            },
          },
        },
        select: {
          fileKey: true,
        },
      });

      // Log what we're about to delete
      console.log(
        `Force deleting programme ${id}: ` +
          `${lessonResources.length} R2 resource files, ` +
          `${submissionFiles.length} B2 submission files, ` +
          `${legacySubmissionFiles.length} legacy R2 submission files`,
      );

      // Delete the programme - cascade will delete all related records
      await prisma.course.delete({
        where: { id },
      });

      // Clean up R2 files (lesson resources)
      const r2Errors: string[] = [];
      await Promise.all(
        lessonResources.map(async (resource) => {
          if (!resource.fileKey) return; // Skip if no fileKey
          try {
            await deleteFromR2(resource.fileKey);
          } catch (err) {
            console.error(`Failed to delete R2 file ${resource.fileKey}:`, err);
            r2Errors.push(resource.fileKey);
          }
        }),
      );

      // Clean up legacy R2 files (old submission attachments)
      await Promise.all(
        legacySubmissionFiles.map(async (file) => {
          try {
            await deleteFromR2(file.fileKey);
          } catch (err) {
            console.error(
              `Failed to delete legacy R2 file ${file.fileKey}:`,
              err,
            );
            r2Errors.push(file.fileKey);
          }
        }),
      );

      // Clean up B2 files (submission files)
      const b2Errors: string[] = [];
      await Promise.all(
        submissionFiles.map(async (file) => {
          try {
            await deleteFromB2(file.fileKey, file.fileId);
          } catch (err) {
            console.error(`Failed to delete B2 file ${file.fileKey}:`, err);
            b2Errors.push(file.fileKey);
          }
        }),
      );

      // Audit log for permanent deletion
      await auditActions.programmeDeleted(
        session.user.id,
        existingProgramme.id,
        existingProgramme.title,
      );

      const hasFileErrors = r2Errors.length > 0 || b2Errors.length > 0;
      const totalR2 = lessonResources.length + legacySubmissionFiles.length;

      return NextResponse.json({
        message: "Programme permanently deleted",
        filesDeleted: {
          r2: totalR2 - r2Errors.length,
          b2: submissionFiles.length - b2Errors.length,
        },
        ...(hasFileErrors && {
          warning: "Some files could not be deleted from storage",
          failedFiles: {
            r2: r2Errors,
            b2: b2Errors,
          },
        }),
      });
    }

    // Soft delete - archive the programme
    const programme = await prisma.course.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    // Audit log
    await auditActions.programmeArchived(session.user.id, programme.id);

    return NextResponse.json({
      message: "Programme archived successfully",
    });
  } catch (error) {
    console.error("Error deleting programme:", error);
    return NextResponse.json(
      { error: "Failed to delete programme" },
      { status: 500 },
    );
  }
}
