## 2024-05-22 - Stored XSS in Lesson Resources
**Vulnerability:** The API routes for creating and updating lesson resources (`/api/admin/resources`) directly stored user-provided HTML (`embedCode`, `textContent`) into the database without sanitization. This allowed Stored XSS attacks via `dangerouslySetInnerHTML` in the frontend.
**Learning:** Even admin-only inputs must be sanitized because accounts can be compromised, and privilege escalation or CSRF could allow attackers to inject malicious scripts that target other users (students).
**Prevention:** Always sanitize HTML input on the server side using a robust library like `isomorphic-dompurify` before storing it in the database. Use strict allow-lists for `iframe` sources.
