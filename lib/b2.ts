/**
 * Backblaze B2 Cloud Storage Integration
 * Used exclusively for student assignment submissions
 * Separate from Cloudflare R2 (used for admin/lecturer uploads)
 */

import crypto from "crypto";

// B2 Configuration from environment variables
const B2_APPLICATION_KEY_ID = process.env.B2_APPLICATION_KEY_ID!;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY!;
const B2_BUCKET_ID = process.env.B2_BUCKET_ID!;
const B2_BUCKET_NAME =
  process.env.B2_BUCKET_NAME || "cca-lms-student-submissions";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Initial delay, doubles with each retry

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS,
  attemptNumber: number = 1,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    console.warn(
      `Attempt ${attemptNumber} failed, retrying in ${delay}ms... (${retries} retries left)`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2, attemptNumber + 1);
  }
}

// B2 API endpoints
const B2_API_URL = "https://api.backblazeb2.com";

// Cache for authorization token
let authCache: {
  token: string;
  apiUrl: string;
  downloadUrl: string;
  expiresAt: number;
} | null = null;

/**
 * Get B2 authorization token
 * Tokens are cached for 23 hours (B2 tokens last 24 hours)
 */
async function getAuthToken(): Promise<{
  token: string;
  apiUrl: string;
  downloadUrl: string;
}> {
  // Return cached token if still valid
  if (authCache && authCache.expiresAt > Date.now()) {
    return {
      token: authCache.token,
      apiUrl: authCache.apiUrl,
      downloadUrl: authCache.downloadUrl,
    };
  }

  // Get new authorization token
  const authString = Buffer.from(
    `${B2_APPLICATION_KEY_ID}:${B2_APPLICATION_KEY}`,
  ).toString("base64");

  const response = await fetch(`${B2_API_URL}/b2api/v2/b2_authorize_account`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${authString}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `B2 authorization failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = `B2 authorization failed: ${errorData.message || errorData.code || response.statusText}`;
    } catch {
      errorMessage = `B2 authorization failed: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Cache token for 23 hours
  authCache = {
    token: data.authorizationToken,
    apiUrl: data.apiUrl,
    downloadUrl: data.downloadUrl,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };

  return {
    token: authCache.token,
    apiUrl: authCache.apiUrl,
    downloadUrl: authCache.downloadUrl,
  };
}

/**
 * Get upload URL for B2
 * Each upload requires a fresh upload URL
 */
async function getUploadUrl(): Promise<{
  uploadUrl: string;
  authToken: string;
}> {
  const { token, apiUrl } = await getAuthToken();

  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketId: B2_BUCKET_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get B2 upload URL: ${error}`);
  }

  const data = await response.json();
  return {
    uploadUrl: data.uploadUrl,
    authToken: data.authorizationToken,
  };
}

/**
 * Upload file to Backblaze B2
 * @param buffer File buffer
 * @param fileName Original file name
 * @param contentType MIME type
 * @param metadata Optional metadata
 * @returns File key and other details
 */
export async function uploadToB2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  metadata?: Record<string, string>,
): Promise<{
  fileKey: string;
  fileName: string;
  fileId: string;
  contentLength: number;
  contentSha1: string;
}> {
  // Validate file size (B2 max is 5GB for single upload)
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  if (buffer.length > maxSize) {
    throw new Error(
      `File "${fileName}" exceeds maximum size of 5GB (${(buffer.length / (1024 * 1024 * 1024)).toFixed(2)}GB)`,
    );
  }

  if (buffer.length === 0) {
    throw new Error(`File "${fileName}" is empty`);
  }

  // Generate unique file key with timestamp and random string
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileKey = `submissions/${timestamp}-${randomStr}-${sanitizedFileName}`;

  // Calculate SHA1 hash (required by B2)
  const sha1 = crypto.createHash("sha1").update(buffer).digest("hex");

  // Upload with retry mechanism
  return retryWithBackoff(async () => {
    try {
      // Get upload URL and token
      const { uploadUrl, authToken } = await getUploadUrl();

      // Prepare headers
      const headers: Record<string, string> = {
        Authorization: authToken,
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "X-Bz-File-Name": encodeURIComponent(fileKey),
        "X-Bz-Content-Sha1": sha1,
      };

      // Add metadata as custom headers
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          headers[`X-Bz-Info-${key}`] = encodeURIComponent(value);
        });
      }

      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: buffer as unknown as BodyInit,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed for "${fileName}" (${response.status})`;
        try {
          const errorData = await response.json();
          const code = errorData.code || "";
          const message = errorData.message || response.statusText;

          if (code === "bad_auth_token" || code === "expired_auth_token") {
            // Clear auth cache and retry will get new token
            authCache = null;
            throw new Error(`Authentication expired, retrying upload...`);
          } else if (code === "storage_cap_exceeded") {
            throw new Error(
              `Storage quota exceeded. Please contact administrator.`,
            );
          } else if (code === "file_not_present") {
            throw new Error(
              `File "${fileName}" could not be uploaded. Please try again.`,
            );
          } else {
            errorMessage = `Upload failed for "${fileName}": ${message}`;
          }
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = `Upload failed for "${fileName}": ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      return {
        fileKey: data.fileName,
        fileName: fileName,
        fileId: data.fileId,
        contentLength: data.contentLength,
        contentSha1: data.contentSha1,
      };
    } catch (error) {
      // Add context to errors
      if (error instanceof Error) {
        if (!error.message.includes(fileName)) {
          throw new Error(`${error.message} (file: "${fileName}")`);
        }
        throw error;
      }
      throw new Error(
        `Unknown error uploading "${fileName}": ${String(error)}`,
      );
    }
  });
}

/**
 * Get signed download URL for B2 file
 * @param fileKey The file key in B2
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function getB2SignedUrl(
  fileKey: string,
  expiresIn: number = 3600,
): Promise<string> {
  try {
    const { token, apiUrl } = await getAuthToken();

    // Get download authorization
    const response = await fetch(
      `${apiUrl}/b2api/v2/b2_get_download_authorization`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucketId: B2_BUCKET_ID,
          fileNamePrefix: fileKey,
          validDurationInSeconds: expiresIn,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get B2 download authorization: ${error}`);
    }

    const data = await response.json();
    const { downloadUrl } = await getAuthToken();

    // Construct download URL with authorization
    return `${downloadUrl}/file/${B2_BUCKET_NAME}/${fileKey}?Authorization=${data.authorizationToken}`;
  } catch (error) {
    console.error("Error generating B2 signed URL:", error);
    throw error;
  }
}

/**
 * Delete file from B2
 * @param fileKey The file key to delete
 * @param fileId The B2 file ID (optional, will be fetched if not provided)
 */
export async function deleteFromB2(
  fileKey: string,
  fileId?: string,
): Promise<void> {
  try {
    const { token, apiUrl } = await getAuthToken();

    // If fileId not provided, get it first
    let actualFileId = fileId;
    if (!actualFileId) {
      actualFileId = await getFileId(fileKey);
    }

    // Delete file
    const response = await fetch(`${apiUrl}/b2api/v2/b2_delete_file_version`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId: actualFileId,
        fileName: fileKey,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete file from B2: ${error}`);
    }
  } catch (error) {
    console.error("Error deleting from B2:", error);
    throw error;
  }
}

/**
 * Get file ID from file name
 * @param fileKey The file key
 * @returns File ID
 */
async function getFileId(fileKey: string): Promise<string> {
  const { token, apiUrl } = await getAuthToken();

  const response = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketId: B2_BUCKET_ID,
      prefix: fileKey,
      maxFileCount: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list B2 files: ${error}`);
  }

  const data = await response.json();

  if (!data.files || data.files.length === 0) {
    throw new Error(`File not found in B2: ${fileKey}`);
  }

  return data.files[0].fileId;
}

/**
 * Validate file before upload
 * @param file File object
 * @param allowedTypes Array of allowed MIME types
 * @param maxSizeMB Maximum file size in MB
 * @returns Validation result
 */
export function validateB2File(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number,
): { valid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
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

/**
 * Common file type validations for student submissions
 */
export const SUBMISSION_FILE_VALIDATIONS = {
  document: {
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    maxSizeMB: 10,
  },
  spreadsheet: {
    allowedTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ],
    maxSizeMB: 10,
  },
  presentation: {
    allowedTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    maxSizeMB: 20,
  },
  image: {
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSizeMB: 5,
  },
  code: {
    allowedTypes: [
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "application/json",
      "application/xml",
      "application/zip",
    ],
    maxSizeMB: 5,
  },
  any: {
    allowedTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "image/jpeg",
      "image/png",
      "application/zip",
    ],
    maxSizeMB: 10,
  },
} as const;
