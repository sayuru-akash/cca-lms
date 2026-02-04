import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditActions } from "@/lib/audit";
import { generateSecurePassword } from "@/lib/security";

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            courses: true,
            lecturerCourses: true,
            submissions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combine counts for lecturers
    const coursesCount =
      user.role === "LECTURER"
        ? user._count.courses + user._count.lecturerCourses
        : user._count.courses;

    return NextResponse.json({
      user: {
        ...user,
        _count: {
          courses: coursesCount,
          submissions: user._count.submissions,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { name, email, role, status, resetPassword } = body;

    // Get existing user for audit log
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validation
    if (email && !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    if (role && !["STUDENT", "LECTURER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role is required" },
        { status: 400 },
      );
    }

    if (
      status &&
      !["ACTIVE", "INVITED", "SUSPENDED", "DELETED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Valid status is required" },
        { status: 400 },
      );
    }

    // Check email uniqueness if changing
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Handle password reset
    let newPassword: string | undefined;
    if (resetPassword) {
      newPassword = generateSecurePassword();
      updateData.password = await hash(newPassword, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    // Audit log
    await auditActions.userUpdated(
      session.user.id,
      user.id,
      {
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status,
      },
      {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    );

    return NextResponse.json({
      user,
      ...(newPassword && { newPassword }),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/users/[id] - Disable user (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent self-disable
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot disable your own account" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status: "SUSPENDED" },
      select: {
        id: true,
        email: true,
      },
    });

    // Audit log
    await auditActions.userDisabled(session.user.id, user.id, user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disabling user:", error);
    return NextResponse.json(
      { error: "Failed to disable user" },
      { status: 500 },
    );
  }
}
