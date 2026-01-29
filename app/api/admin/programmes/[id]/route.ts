import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";

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
      const isAssigned =
        programme.lecturers.some((l) => l.lecturerId === session.user.id) ||
        programme.lecturerId === session.user.id; // Check both new and old relationship

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
    const { title, description, thumbnail, lecturerId, lecturerIds, status } =
      body;

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
          ...(lecturerId !== undefined && { lecturerId }), // Keep for backward compatibility
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

// DELETE /api/admin/programmes/[id] - Archive programme (soft delete)
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

    // Check if programme exists
    const existingProgramme = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingProgramme) {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // Archive the programme (soft delete)
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
    console.error("Error archiving programme:", error);
    return NextResponse.json(
      { error: "Failed to archive programme" },
      { status: 500 },
    );
  }
}
