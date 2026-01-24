import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface CSVRow {
  userId: string;
  programmeId: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userType = formData.get("userType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 },
      );
    }

    // Read CSV file
    const text = await file.text();
    const lines = text
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"));

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file is empty or invalid" },
        { status: 400 },
      );
    }

    // Parse CSV (skip header)
    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const userId = values[0]?.trim();
      const programmeId = values[3]?.trim(); // Column index 3 is "Programme ID"

      // Only add rows where programmeId is provided
      if (userId && programmeId) {
        rows.push({ userId, programmeId });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No enrollments found in CSV. Make sure to fill the 'Programme ID' column.",
        },
        { status: 400 },
      );
    }

    // Validate and build preview
    const userIds = rows.map((r) => r.userId);
    const programmeIds = [...new Set(rows.map((r) => r.programmeId))];

    // Fetch users
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: userType as "STUDENT" | "LECTURER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Fetch programmes
    const programmes = await prisma.course.findMany({
      where: {
        id: { in: programmeIds },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const programmeMap = new Map(programmes.map((p) => [p.id, p]));

    // Check existing enrollments
    const existingEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId: { in: userIds },
        courseId: { in: programmeIds },
      },
      select: {
        userId: true,
        courseId: true,
      },
    });

    const enrollmentSet = new Set(
      existingEnrollments.map((e) => `${e.userId}-${e.courseId}`),
    );

    // Build preview
    const preview = rows.map((row) => {
      const user = userMap.get(row.userId);
      const programme = programmeMap.get(row.programmeId);
      const enrollmentKey = `${row.userId}-${row.programmeId}`;
      const isDuplicate = enrollmentSet.has(enrollmentKey);

      if (!user) {
        return {
          userId: row.userId,
          userName: "Unknown User",
          userEmail: "",
          programmeId: row.programmeId,
          programmeTitle: programme?.title || "Unknown Programme",
          status: "error" as const,
          error: `User not found or not an active ${userType.toLowerCase()}`,
        };
      }

      if (!programme) {
        return {
          userId: row.userId,
          userName: user.name || user.email,
          userEmail: user.email,
          programmeId: row.programmeId,
          programmeTitle: "Unknown",
          status: "error" as const,
          error: "Programme not found",
        };
      }

      if (isDuplicate) {
        return {
          userId: row.userId,
          userName: user.name || user.email,
          userEmail: user.email,
          programmeId: row.programmeId,
          programmeTitle: programme.title,
          status: "duplicate" as const,
        };
      }

      return {
        userId: row.userId,
        userName: user.name || user.email,
        userEmail: user.email,
        programmeId: row.programmeId,
        programmeTitle: programme.title,
        status: "valid" as const,
      };
    });

    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Error previewing enrollments:", error);
    return NextResponse.json(
      { error: "Failed to preview enrollments" },
      { status: 500 },
    );
  }
}
