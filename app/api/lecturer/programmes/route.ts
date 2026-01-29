import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = session.user.id;

    // Get courses assigned to this lecturer through the many-to-many relationship
    // Also include courses where they are the primary lecturer (backward compatibility)
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          {
            lecturers: {
              some: {
                lecturerId,
              },
            },
          },
          {
            lecturerId, // Backward compatibility for old lecturerId field
          },
        ],
      },
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
        modules: {
          include: {
            _count: {
              select: {
                lessons: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        thumbnail: course.thumbnail,
        enrollmentCount: course._count.enrollments,
        moduleCount: course._count.modules,
        lessonCount: course.modules.reduce(
          (sum, module) => sum + module._count.lessons,
          0,
        ),
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching lecturer programmes:", error);
    return NextResponse.json(
      { error: "Failed to fetch programmes" },
      { status: 500 },
    );
  }
}
