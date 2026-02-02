import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS.
 * Allows standard rich text tags and iframes for video embeds.
 *
 * @param html - The potentially unsafe HTML string
 * @returns The sanitized HTML string
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "target",
      "class",
      "style"
    ],
  });
}
