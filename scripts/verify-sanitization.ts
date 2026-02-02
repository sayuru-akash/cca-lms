import { sanitizeHtml } from "../lib/security";
import assert from "assert";

console.log("Running sanitization verification...");

// Test Case 1: Valid YouTube Embed
const validEmbed = '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
const sanitizedValid = sanitizeHtml(validEmbed);
// Note: attributes order might change or be normalized, checking inclusion
assert(sanitizedValid.includes('<iframe'), "Should allow iframe");
assert(sanitizedValid.includes('src="https://www.youtube.com/embed/dQw4w9WgXcQ"'), "Should keep src");
assert(sanitizedValid.includes('allowfullscreen'), "Should keep allowfullscreen");

console.log("✅ Valid embed test passed");

// Test Case 2: Malicious Script
const maliciousScript = '<script>alert("XSS")</script>';
const sanitizedScript = sanitizeHtml(maliciousScript);
assert(!sanitizedScript.includes('<script'), "Should strip script tag");
assert(sanitizedScript === "", "Should be empty for script-only input");

console.log("✅ Malicious script test passed");

// Test Case 3: Mixed Content (Valid + Malicious)
const mixedContent = '<p>Hello <script>alert(1)</script> <b>World</b></p>';
const sanitizedMixed = sanitizeHtml(mixedContent);
assert(sanitizedMixed.includes('<p>Hello'), "Should keep p");
assert(!sanitizedMixed.includes('<script'), "Should strip script");
assert(sanitizedMixed.includes('<b>World</b>'), "Should keep b");
assert(sanitizedMixed.includes('</p>'), "Should keep closing p");

console.log("✅ Mixed content test passed");

// Test Case 4: Event Handlers
const eventHandler = '<img src="x" onerror="alert(1)">';
const sanitizedEventHandler = sanitizeHtml(eventHandler);
assert(!sanitizedEventHandler.includes('onerror'), "Should strip onerror");
assert(sanitizedEventHandler.includes('<img'), "Should keep img");

console.log("✅ Event handler test passed");

// Test Case 5: Iframe with malicious javascript: src
const javascriptProtocol = '<iframe src="javascript:alert(1)"></iframe>';
const sanitizedJsProtocol = sanitizeHtml(javascriptProtocol);
// DOMPurify strips javascript: protocols by default
assert(!sanitizedJsProtocol.includes('javascript:'), "Should strip javascript protocol");

console.log("✅ Javascript protocol test passed");

console.log("All tests passed!");
