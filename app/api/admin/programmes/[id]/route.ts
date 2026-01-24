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
        _count: {
          select: {
            enrollments: true,
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
    if (
      session.user.role === "LECTURER" &&
      programme.lecturerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch lecturer separately
    const lecturer = await prisma.user.findUnique({
      where: { id: programme.lecturerId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      programme: {
        ...programme,
        lecturer,
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
    const { title, description, thumbnail, lecturerId, status } = body;

    // Get existing programme for audit
    const existingProgramme = await prisma.course.findUnique({
      where: { id },
    });

    if (!existingProgramme) {
      return NextResponse.json(
        { error: "Programme not found" },
        { status: 404 },
      );
    }

    // If lecturer is being changed, verify new lecturer
    if (lecturerId && lecturerId !== existingProgramme.lecturerId) {
      const lecturer = await prisma.user.findUnique({
        where: { id: lecturerId },
      });

      if (!lecturer || lecturer.role !== "LECTURER") {
        return NextResponse.json(
          { error: "Invalid lecturer selected" },
          { status: 400 },
        );
      }
    }

    // Update programme
    const programme = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(lecturerId && { lecturerId }),
        ...(status && { status }),
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

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
