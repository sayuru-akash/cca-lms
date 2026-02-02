import DOMPurify from "isomorphic-dompurify";

interface SanitizeElement {
  getAttribute(name: string): string | null;
  remove(): void;
}

interface SanitizeHookData {
  tagName: string;
}

/**
 * Sanitizes HTML content to prevent XSS attacks while allowing safe embedded content.
 *
 * Configured to:
 * - Allow standard HTML tags
 * - Allow iframes from trusted video providers (YouTube, Vimeo)
 * - Strip unsafe tags (script, object, embed, etc.)
 * - Strip unsafe attributes (on*, javascript:, etc.)
 */
export function sanitizeHtml(content: string | null | undefined): string {
  if (typeof content !== "string") return "";
  if (!content.trim()) return "";

  const ALLOWED_IFRAME_DOMAINS = [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
    "vimeo.com",
    "www.vimeo.com",
  ];

  // Hook to validate iframe sources
  // Using unknown/casting instead of any to satisfy linter
  const iframeHook = (node: unknown, data: unknown) => {
    const element = node as SanitizeElement;
    const hookData = data as SanitizeHookData;

    if (hookData.tagName === "iframe") {
      const src = element.getAttribute("src");
      if (!src) {
        element.remove();
        return;
      }

      try {
        const url = new URL(src);
        if (!ALLOWED_IFRAME_DOMAINS.includes(url.hostname)) {
           element.remove();
        }
      } catch {
        // If URL is invalid or relative (not allowed for iframes here), remove it
        element.remove();
      }
    }
  };

  // Add the hook
  DOMPurify.addHook("uponSanitizeElement", iframeHook);

  const clean = DOMPurify.sanitize(content, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "target",
    ],
    // Force target="_blank" for links + rel="noopener noreferrer"
    FORBID_TAGS: ["script", "style", "object", "embed", "applet"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });

  // Clean up hooks to avoid affecting other sanitization calls if any
  DOMPurify.removeHook("uponSanitizeElement");

  return clean;
}
