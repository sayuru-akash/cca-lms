import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// GET profile data (works for all user roles)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get enrollment stats for students only
    let stats = null;
    if (user.role === "STUDENT") {
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          userId: user.id,
        },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: true,
                },
              },
            },
          },
        },
      });

      const lessonProgress = await prisma.lessonProgress.findMany({
        where: { userId: user.id },
      });

      const totalLessons = enrollments.reduce(
        (sum, e) =>
          sum +
          e.course.modules.reduce((mSum, m) => mSum + m.lessons.length, 0),
        0,
      );

      const completedLessons = lessonProgress.filter((p) => p.completed).length;
      const completedCourses = enrollments.filter(
        (e) => e.status === "COMPLETED",
      ).length;
      const averageProgress =
        enrollments.length > 0
          ? enrollments.reduce((sum, e) => sum + e.progress, 0) /
            enrollments.length
          : 0;

      stats = {
        totalEnrolled: enrollments.length,
        completedCourses,
        totalLessons,
        completedLessons,
        averageProgress: Math.round(averageProgress),
        recentEnrollments: enrollments
          .sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime())
          .slice(0, 5)
          .map((e) => ({
            id: e.courseId,
            title: e.course.title,
            progress: e.progress,
            status: e.status,
            enrolledAt: e.enrolledAt.toISOString(),
          })),
      };
    } else if (user.role === "ADMIN" || user.role === "LECTURER") {
      // Get admin/lecturer specific stats
      const whereClause =
        user.role === "LECTURER" ? { lecturerId: user.id } : {};

      const courses = await prisma.course.findMany({
        where: whereClause,
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
          enrollments: {
            where: { status: { in: ["ACTIVE", "COMPLETED"] } },
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
            },
          },
        },
      });

      const totalStudents =
        user.role === "ADMIN"
          ? await prisma.user.count({ where: { role: "STUDENT" } })
          : await prisma.user.count({
              where: {
                role: "STUDENT",
                courses: {
                  some: {
                    course: {
                      lecturerId: user.id,
                    },
                  },
                },
              },
            });

      const totalLecturers =
        user.role === "ADMIN"
          ? await prisma.user.count({ where: { role: "LECTURER" } })
          : 0;

      const recentCourses = courses
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          enrollmentCount: c._count.enrollments,
          moduleCount: c.modules.length,
          lessonCount: c.modules.reduce((sum, m) => sum + m.lessons.length, 0),
          createdAt: c.createdAt.toISOString(),
        }));

      stats = {
        totalCourses: courses.length,
        publishedCourses: courses.filter((c) => c.status === "PUBLISHED")
          .length,
        totalStudents,
        totalLecturers: user.role === "ADMIN" ? totalLecturers : null,
        totalEnrollments: courses.reduce(
          (sum, c) => sum + c._count.enrollments,
          0,
        ),
        recentCourses,
      };
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PUT update profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    // Check if email is already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 },
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

// POST change password
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 404 },
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
