// Re-export sanitizeHtml from the main sanitize module
// This file is kept for backward compatibility
export { sanitizeHtml } from "./sanitize";

/**
 * Generates a cryptographically secure random password.
 *
 * Uses crypto.getRandomValues (Web Crypto API) which is available in
 * Node.js (global) and Edge runtimes.
 *
 * @param length Length of the random part of the password (default: 24)
 * @returns A secure password string containing mixed case alphanumeric characters plus "!@#"
 */
export function generateSecurePassword(length: number = 24): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }

  return password + "!@#";
}
