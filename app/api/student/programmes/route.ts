import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, enrolled, available

    // Get user's enrollments
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        course: {
          include: {
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);
    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));

    // Build where clause
    // @ts-ignore - Prisma type inference issue with dynamic OR clause
    const where = {
      status: "PUBLISHED",
    } as any;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "enrolled") {
      where.id = { in: enrolledCourseIds };
    } else if (filter === "available") {
      where.id = { notIn: enrolledCourseIds };
    }

    // Fetch programmes
    const programmes = await prisma.course.findMany({
      where,
      include: {
        modules: {
          include: {
            lessons: true,
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = programmes.map((programme) => {
      const enrollment = enrollmentMap.get(programme.id);
      const totalLessons = programme.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0,
      );

      return {
        id: programme.id,
        title: programme.title,
        description: programme.description,
        thumbnailUrl: programme.thumbnail,
        isEnrolled: !!enrollment,
        enrollment: enrollment
          ? {
              status: enrollment.status,
              progress: enrollment.progress,
              enrolledAt: enrollment.enrolledAt.toISOString(),
            }
          : null,
        stats: {
          totalLessons,
          moduleCount: programme.modules.length,
          enrollmentCount: programme._count.enrollments,
        },
      };
    });

    return NextResponse.json({ programmes: result });
  } catch (error) {
    console.error("Error fetching programmes:", error);
    return NextResponse.json(
      { error: "Failed to fetch programmes" },
      { status: 500 },
    );
  }
}
