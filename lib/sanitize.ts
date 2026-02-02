import sanitizeHtmlLib from "sanitize-html";

/**
 * Allowed iframe domains for embedded content
 */
const ALLOWED_IFRAME_DOMAINS = [
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
  "www.vimeo.com",
];

/**
 * Validates if an iframe src is from an allowed domain
 */
function isAllowedIframeSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return ALLOWED_IFRAME_DOMAINS.includes(url.hostname);
  } catch {
    return false;
  }
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

  return sanitizeHtmlLib(content, {
    allowedTags: [
      // Block elements
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "div",
      "section",
      "article",
      "header",
      "footer",
      "main",
      "aside",
      "nav",
      "blockquote",
      "pre",
      "code",
      // Lists
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      // Tables
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "caption",
      "colgroup",
      "col",
      // Inline elements
      "a",
      "span",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "del",
      "ins",
      "sub",
      "sup",
      "small",
      "mark",
      "abbr",
      "cite",
      "q",
      "kbd",
      "samp",
      "var",
      // Media
      "img",
      "figure",
      "figcaption",
      "picture",
      "source",
      "iframe", // Allowed with domain filtering
      // Other
      "br",
      "hr",
      "details",
      "summary",
      "time",
      "address",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style", "title", "lang", "dir"],
      a: ["href", "target", "rel", "name"],
      img: ["src", "alt", "width", "height", "loading", "decoding"],
      iframe: [
        "src",
        "width",
        "height",
        "frameborder",
        "allow",
        "allowfullscreen",
        "scrolling",
      ],
      source: ["src", "srcset", "type", "media", "sizes"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
      col: ["span"],
      colgroup: ["span"],
      time: ["datetime"],
      abbr: ["title"],
      q: ["cite"],
      blockquote: ["cite"],
      ol: ["start", "type", "reversed"],
      li: ["value"],
      table: ["border", "cellpadding", "cellspacing"],
    },
    // Force safe link attributes
    transformTags: {
      a: (tagName, attribs) => {
        return {
          tagName,
          attribs: {
            ...attribs,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        };
      },
      iframe: (tagName, attribs) => {
        // Only allow iframes from trusted domains
        if (attribs.src && isAllowedIframeSrc(attribs.src)) {
          return {
            tagName,
            attribs: {
              ...attribs,
              frameborder: "0",
              allowfullscreen: "true",
            },
          };
        }
        // Remove iframe if src is not allowed
        return {
          tagName: "",
          attribs: {},
        };
      },
    },
    // Disallow dangerous URL schemes
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      a: ["http", "https", "mailto", "tel"],
    },
    // Disallow inline JavaScript in styles
    allowedStyles: {
      "*": {
        color: [/.*/],
        "background-color": [/.*/],
        background: [/^(?!.*url\s*\().*$/], // No url() in backgrounds
        "font-size": [/.*/],
        "font-weight": [/.*/],
        "font-style": [/.*/],
        "text-align": [/.*/],
        "text-decoration": [/.*/],
        margin: [/.*/],
        "margin-top": [/.*/],
        "margin-right": [/.*/],
        "margin-bottom": [/.*/],
        "margin-left": [/.*/],
        padding: [/.*/],
        "padding-top": [/.*/],
        "padding-right": [/.*/],
        "padding-bottom": [/.*/],
        "padding-left": [/.*/],
        border: [/.*/],
        "border-radius": [/.*/],
        width: [/.*/],
        height: [/.*/],
        "max-width": [/.*/],
        "max-height": [/.*/],
        display: [/^(block|inline|inline-block|flex|grid|none)$/],
      },
    },
  });
}
