import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";

export const runtime = "nodejs";

// GET /api/admin/programmes - List all programmes with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      status?: string;
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        description?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      where.status = status;
    }

    // Fetch programmes and total count
    const [programmes, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          thumbnail: true,
          status: true,
          lecturerId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({
      programmes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching programmes:", error);
    return NextResponse.json(
      { error: "Failed to fetch programmes" },
      { status: 500 },
    );
  }
}

// POST /api/admin/programmes - Create new programme
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, thumbnail, lecturerId, status } = body;

    // Validate required fields
    if (!title || !lecturerId) {
      return NextResponse.json(
        { error: "Title and Lecturer are required" },
        { status: 400 },
      );
    }

    // Verify lecturer exists and has correct role
    const lecturer = await prisma.user.findUnique({
      where: { id: lecturerId },
    });

    if (!lecturer || lecturer.role !== "LECTURER") {
      return NextResponse.json(
        { error: "Invalid lecturer selected" },
        { status: 400 },
      );
    }

    // Create programme
    const programme = await prisma.course.create({
      data: {
        title,
        description: description || null,
        thumbnail: thumbnail || null,
        lecturerId,
        status: status || "DRAFT",
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

    // Audit log
    await auditActions.programmeCreated(session.user.id, programme.id);

    return NextResponse.json(
      { programme, message: "Programme created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating programme:", error);
    return NextResponse.json(
      { error: "Failed to create programme" },
      { status: 500 },
    );
  }
}
