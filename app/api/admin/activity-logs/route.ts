import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const userId = searchParams.get("userId") || "";
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    // @ts-ignore - Prisma type inference issue with dynamic where clause
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { ipAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Fetch activity logs with pagination
    const [activities, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Get filter options
    const [actionTypes, allEntityTypes, users] = await Promise.all([
      prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      }),
      prisma.auditLog.findMany({
        select: { entityType: true },
        distinct: ["entityType"],
        orderBy: { entityType: "asc" },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: { name: "asc" },
        take: 100,
      }),
    ]);

    // Filter out null entity types
    const entityTypes = allEntityTypes
      .map((e) => e.entityType)
      .filter((type): type is string => type !== null);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadata: a.metadata,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        createdAt: a.createdAt.toISOString(),
        user: a.user
          ? {
              id: a.user.id,
              name: a.user.name,
              email: a.user.email,
              role: a.user.role,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        actionTypes: actionTypes.map((a) => a.action),
        entityTypes: entityTypes,
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 },
    );
  }
}
