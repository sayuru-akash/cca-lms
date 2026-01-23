import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/admin/lecturers - Get all lecturers for assignment
export async function GET() {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturers = await prisma.user.findMany({
      where: {
        role: "LECTURER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ lecturers });
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturers" },
      { status: 500 },
    );
  }
}
