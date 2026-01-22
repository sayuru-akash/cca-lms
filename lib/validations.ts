import { z } from 'zod';

/**
 * Auth schemas
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invalid token'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Invalid token'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Course schemas
 */
export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
});

export const moduleSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  order: z.number().int().positive(),
});

export const lessonSchema = z.object({
  moduleId: z.string().cuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  order: z.number().int().positive(),
  isPublished: z.boolean().default(false),
});

export const lessonResourceSchema = z.object({
  lessonId: z.string().cuid(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  fileKey: z.string().min(1, 'File key is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1, 'MIME type is required'),
});

/**
 * Enrollment schemas
 */
export const enrollmentSchema = z.object({
  courseId: z.string().cuid(),
});

/**
 * Submission schemas
 */
export const submissionSchema = z.object({
  lessonId: z.string().cuid(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT'),
});

export const gradeSubmissionSchema = z.object({
  grade: z.number().int().min(0).max(100),
  feedback: z.string().optional(),
});

/**
 * User schemas
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  image: z.string().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
});

/**
 * File upload schemas
 */
export const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileType: z.enum([
    'PROFILE_IMAGE',
    'COURSE_THUMBNAIL',
    'LESSON_VIDEO',
    'LESSON_RESOURCE',
    'SUBMISSION_ATTACHMENT',
    'DOCUMENT',
    'OTHER',
  ]),
});

export const confirmUploadSchema = z.object({
  fileKey: z.string().min(1, 'File key is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileType: z.enum([
    'PROFILE_IMAGE',
    'COURSE_THUMBNAIL',
    'LESSON_VIDEO',
    'LESSON_RESOURCE',
    'SUBMISSION_ATTACHMENT',
    'DOCUMENT',
    'OTHER',
  ]),
  checksum: z.string().optional(),
});

/**
 * Notification schemas
 */
export const notificationSchema = z.object({
  userId: z.string().cuid(),
  type: z.enum([
    'COURSE_ENROLLMENT',
    'LESSON_PUBLISHED',
    'ASSIGNMENT_GRADED',
    'ANNOUNCEMENT',
    'SYSTEM',
  ]),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  link: z.string().optional(),
});

/**
 * Type exports
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type UploadUrlInput = z.infer<typeof uploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
