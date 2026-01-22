import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy initialization of R2/S3 client
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
  }

  return new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'cca-lms-uploads';
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Generate a presigned URL for uploading a file directly to R2
 * @param key - The file key/path in R2
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns Presigned PUT URL
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(getR2Client(), command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading a file from R2
 * @param key - The file key/path in R2
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 * @returns Presigned GET URL
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn = 900
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(getR2Client(), command, { expiresIn });
}

/**
 * Get the public URL for a file (if using custom domain)
 * @param key - The file key/path in R2
 * @returns Public URL or undefined
 */
export function getPublicUrl(key: string): string | undefined {
  return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : undefined;
}

/**
 * Generate a unique file key with proper path structure
 * @param fileType - Type of file (e.g., 'profile-image', 'course-thumbnail')
 * @param fileName - Original filename
 * @param userId - User ID who owns the file
 * @returns Unique file key
 */
export function generateFileKey(
  fileType: string,
  fileName: string,
  userId: string
): string {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const baseName = fileName.replace(`.${extension}`, '');
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

  return `${fileType}/${userId}/${timestamp}-${sanitizedBaseName}.${extension}`;
}

/**
 * Extract file metadata for storage
 * @param file - File object
 * @returns File metadata
 */
export function extractFileMetadata(file: File) {
  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

/**
 * Validate file type and size
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSizeMB - Maximum file size in megabytes
 * @returns Validation result
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

// Common file type validations
export const FILE_VALIDATIONS = {
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeMB: 5,
  },
  video: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSizeMB: 500,
  },
  document: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    maxSizeMB: 25,
  },
  submission: {
    allowedTypes: [
      'application/pdf',
      'application/zip',
      'image/jpeg',
      'image/png',
    ],
    maxSizeMB: 50,
  },
} as const;
