import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/admin/modules/[id] - Get single module
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

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: {
                resources: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json({ module });
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/modules/[id] - Update module
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
    const { title, description, order } = body;

    const module = await prisma.module.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
      },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    return NextResponse.json({
      module,
      message: "Module updated successfully",
    });
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/modules/[id] - Delete module
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

    // Check if module has lessons
    const module = await prisma.module.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (module._count.lessons > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete module with lessons. Delete all lessons first.",
        },
        { status: 400 },
      );
    }

    await prisma.module.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 },
    );
  }
}
