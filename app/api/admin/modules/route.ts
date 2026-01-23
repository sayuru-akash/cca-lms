import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/admin/modules - Create new module
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, courseId } = body;

    if (!title || !courseId) {
      return NextResponse.json(
        { error: "Title and courseId are required" },
        { status: 400 },
      );
    }

    // Get the next order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = (lastModule?.order ?? 0) + 1;

    const module = await prisma.module.create({
      data: {
        title,
        description: description || null,
        courseId,
        order,
      },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    return NextResponse.json(
      { module, message: "Module created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 },
    );
  }
}
