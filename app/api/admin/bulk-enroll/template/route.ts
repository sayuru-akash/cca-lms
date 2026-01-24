import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType") as "STUDENT" | "LECTURER";

    if (!userType || !["STUDENT", "LECTURER"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    // Get all users of the specified type
    const users = await prisma.user.findMany({
      where: {
        role: userType,
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

    // Get all programmes for reference
    const programmes = await prisma.course.findMany({
      where: {
        status: {
          not: "ARCHIVED",
        },
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        title: "asc",
      },
    });

    // Create CSV content
    const csvRows = [];

    // Header row
    csvRows.push(
      [
        "User ID",
        "Name",
        "Email",
        "Programme ID (fill this)",
        "Programme Title (reference only)",
      ].join(","),
    );

    // Add a comment row with available programme IDs
    csvRows.push(
      `# Available Programme IDs: ${programmes.map((p) => p.id).join(", ")}`,
    );

    // User rows
    for (const user of users) {
      csvRows.push(
        [
          user.id,
          `"${user.name?.replace(/"/g, '""') || ""}"`,
          user.email,
          "", // Empty Programme ID for admin to fill
          "", // Empty Programme Title
        ].join(","),
      );
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bulk-enroll-${userType.toLowerCase()}-template.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 },
    );
  }
}
