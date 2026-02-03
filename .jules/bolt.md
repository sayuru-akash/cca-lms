## 2026-02-02 - Parallelizing Prisma Queries
**Learning:** Dashboard endpoints in this Next.js app tend to fetch multiple independent datasets sequentially (waterfall), significantly increasing TFB (Time to First Byte).
**Action:** Inspect `page.tsx` or `route.ts` files for sequential `await prisma` calls that share dependencies (like `userId`) and refactor them into `Promise.all`.

## 2026-02-02 - Eliminate Dashboard Waterfall
**Learning:** Found another waterfall in `app/api/admin/dashboard-stats/route.ts` where `enrollmentsByProgramme` was awaited after other stats.
**Action:** Always check `Promise.all` blocks to ensure *all* independent queries are included, not just "most" of them.
