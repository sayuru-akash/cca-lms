import { prisma } from "./prisma";
import type { AuditAction, Prisma } from "@/generated/prisma";

/**
 * Create an audit log entry
 * @param data - Audit log data
 */
export async function createAuditLog(data: {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Log the error but don't throw - audit logging shouldn't break the app
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Create multiple audit log entries (bulk optimization)
 * @param logs - Array of audit log data
 */
export async function createAuditLogs(
  logs: {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }[],
) {
  if (logs.length === 0) return;

  try {
    await prisma.auditLog.createMany({
      data: logs.map((log) => ({
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata as Prisma.InputJsonValue,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      })),
    });
  } catch (error) {
    console.error("Failed to create audit logs:", error);
  }
}

/**
 * Create an audit log entry with request context
 * @param data - Audit log data
 * @param request - Request object (for IP and user agent)
 */
export async function createAuditLogFromRequest(
  data: {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
  request?: Request,
) {
  const ipAddress = request
    ? request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined
    : undefined;

  const userAgent = request?.headers.get("user-agent") || undefined;

  return createAuditLog({
    ...data,
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs for a specific user
 * @param userId - User ID
 * @param limit - Number of logs to retrieve
 */
export async function getUserAuditLogs(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get audit logs for a specific entity
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @param limit - Number of logs to retrieve
 */
export async function getEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit = 100,
) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get all audit logs with filtering
 * @param filters - Filter options
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate)
      (where.createdAt as { gte?: Date }).gte = filters.startDate;
    if (filters.endDate)
      (where.createdAt as { lte?: Date }).lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Helper functions for common audit actions
 */
export const auditActions = {
  // User actions
  userCreated: (
    userId: string,
    entityId: string,
    email?: string,
    role?: string,
  ) =>
    createAuditLog({
      userId,
      action: "USER_CREATED",
      entityType: "User",
      entityId,
      metadata: email && role ? { email, role } : undefined,
    }),

  userInvited: (userId: string, entityId: string, email: string) =>
    createAuditLog({
      userId,
      action: "USER_INVITED",
      entityType: "User",
      entityId,
      metadata: { invitedEmail: email },
    }),

  userLogin: (userId: string, request?: Request) =>
    createAuditLogFromRequest(
      {
        userId,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: userId,
      },
      request,
    ),

  userLogout: (userId: string) =>
    createAuditLog({
      userId,
      action: "USER_LOGOUT",
      entityType: "User",
      entityId: userId,
    }),

  // Course actions
  courseCreated: (userId: string, courseId: string, title: string) =>
    createAuditLog({
      userId,
      action: "COURSE_CREATED",
      entityType: "Course",
      entityId: courseId,
      metadata: { title },
    }),

  courseUpdated: (userId: string, courseId: string) =>
    createAuditLog({
      userId,
      action: "COURSE_UPDATED",
      entityType: "Course",
      entityId: courseId,
    }),

  coursePublished: (userId: string, courseId: string, title: string) =>
    createAuditLog({
      userId,
      action: "COURSE_PUBLISHED",
      entityType: "Course",
      entityId: courseId,
      metadata: { title },
    }),

  // Programme actions (alias for course)
  programmeCreated: (userId: string, programmeId: string) =>
    createAuditLog({
      userId,
      action: "COURSE_CREATED",
      entityType: "Course",
      entityId: programmeId,
    }),

  programmeUpdated: (
    userId: string,
    programmeId: string,
    before: any,
    after: any,
  ) =>
    createAuditLog({
      userId,
      action: "COURSE_UPDATED",
      entityType: "Course",
      entityId: programmeId,
      metadata: { before, after },
    }),

  programmeArchived: (userId: string, programmeId: string) =>
    createAuditLog({
      userId,
      action: "COURSE_UPDATED",
      entityType: "Course",
      entityId: programmeId,
      metadata: { status: "ARCHIVED" },
    }),

  programmeDeleted: (
    userId: string,
    programmeId: string,
    programmeTitle: string,
  ) =>
    createAuditLog({
      userId,
      action: "COURSE_DELETED",
      entityType: "Course",
      entityId: programmeId,
      metadata: { title: programmeTitle, permanent: true },
    }),

  programmePublished: (userId: string, programmeId: string) =>
    createAuditLog({
      userId,
      action: "COURSE_PUBLISHED",
      entityType: "Course",
      entityId: programmeId,
    }),

  // Enrollment actions
  enrollmentCreated: (userId: string, enrollmentId: string, courseId: string) =>
    createAuditLog({
      userId,
      action: "ENROLLMENT_CREATED",
      entityType: "CourseEnrollment",
      entityId: enrollmentId,
      metadata: { courseId },
    }),

  programmeEnrollmentCreated: (
    userId: string,
    enrollmentId: string,
    programmeTitle: string,
  ) =>
    createAuditLog({
      userId,
      action: "ENROLLMENT_CREATED",
      entityType: "CourseEnrollment",
      entityId: enrollmentId,
      metadata: { programmeTitle },
    }),

  programmeEnrollmentsCreated: (
    userId: string,
    enrollments: { id: string; course: { title: string } }[],
  ) =>
    createAuditLogs(
      enrollments.map((enrollment) => ({
        userId,
        action: "ENROLLMENT_CREATED",
        entityType: "CourseEnrollment",
        entityId: enrollment.id,
        metadata: { programmeTitle: enrollment.course.title },
      })),
    ),

  programmeEnrollmentDeleted: (
    userId: string,
    enrollmentId: string,
    programmeTitle: string,
  ) =>
    createAuditLog({
      userId,
      action: "ENROLLMENT_DELETED",
      entityType: "CourseEnrollment",
      entityId: enrollmentId,
      metadata: { programmeTitle },
    }),

  // File actions
  fileUploaded: (
    userId: string,
    fileId: string,
    fileName: string,
    fileType: string,
  ) =>
    createAuditLog({
      userId,
      action: "FILE_UPLOADED",
      entityType: "UploadedFile",
      entityId: fileId,
      metadata: { fileName, fileType },
    }),

  fileDownloaded: (userId: string, fileId: string, fileName: string) =>
    createAuditLog({
      userId,
      action: "FILE_DOWNLOADED",
      entityType: "UploadedFile",
      entityId: fileId,
      metadata: { fileName },
    }),

  userUpdated: (
    userId: string,
    targetUserId: string,
    before: any,
    after: any,
  ) =>
    createAuditLog({
      userId,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: targetUserId,
      metadata: { before, after },
    }),

  userDisabled: (userId: string, targetUserId: string, email: string) =>
    createAuditLog({
      userId,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: targetUserId,
      metadata: { email, status: "DISABLED" },
    }),

  userEnabled: (userId: string, targetUserId: string, email: string) =>
    createAuditLog({
      userId,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: targetUserId,
      metadata: { email, status: "ACTIVE" },
    }),
};
