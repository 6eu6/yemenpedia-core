# ⚖️ YEMENPEDIA SUPREME CONSTITUTION (V5.1 - BUN EDITION)
"Ship fast. But ship secure."

## I. SECURITY & PROTECTION
1. **Authentication:** Use Supabase Auth or NextAuth. JWT max 7 days + refresh rotation. [Rule 1, 2]
2. **Database Security:** Enable RLS on all tables. Use parameterized queries always via Prisma 6. [Rule 9, 10]
3. **Rate Limiting:** Apply to all endpoints: 100 req/hour per IP.
4. **Input & Files:** Sanitize every input (Zod). Validate file types by SIGNATURE (magic numbers). [Rule 19, 20]
5. **Production Hygiene:** Remove all `console.log` and comments before shipping. [Rule 11]

## II. INFRASTRUCTURE (BUN & NODE COMPATIBILITY)
1. **Package Manager:** Use **Bun** for local development (`bun install`, `bun run`).
2. **Database:** PostgreSQL via Supabase Pooler (IPv4 ONLY).
   - **CRITICAL:** Sandbox environments use system-level `DATABASE_URL` pointing to SQLite that CANNOT be overridden by .env
   - **SOLUTION:** Use `SUPABASE_POOLER_URL` environment variable in code (see `src/lib/db.ts`)
   - Connection MUST include `?pgbouncer=true` for connection pooling
   - Direct Supabase URLs (IPv6) are BANNED - they WILL FAIL in sandbox
3. **Soft Delete:** Implement a 30-day grace period (`deletedAt`). Automated cleanup via Cron. [Rule 27]
4. **Media:**
   - Images: Sharp (WebP, 80% quality) -> Cloudflare R2.
   - Video: Direct pass-through to Bunny Stream.
5. **Hostinger Compatibility:** Ensure the build is compatible with Node.js environments for Hostinger Business hosting.

## III. UI/UX & DESIGN PHILOSOPHY
1. **The Singleton Rule:** Primary actions (Create, Edit) must have ONE logical home in the UI. No redundant buttons.
2. **Visual Identity:** Ultra-Neutral Zinc (Shadcn/UI + Radix). Zero Emojis. Zero Placeholder text.
   - **UI Library:** Shadcn/UI (built on Radix UI) - STABLE, WELL-DOCUMENTED, ACCESSIBLE
   - **Icons:** Lucide-React ONLY
   - **Animations:** Framer Motion (sparingly)
   - **Dark/Light Mode:** Supported via next-themes + CSS Variables
3. **Typography:** IBM Plex Sans Arabic (RTL) and Inter (LTR).
4. **RTL Support:** Mandatory for Arabic content. All components must support dir="rtl".

## IV. OPERATIONAL PROTOCOLS
1. **Secrets:** Never paste API keys in chat. Use `process.env`.
2. **AI Conduct:** Act as a security engineer. Review code for vulnerabilities. Try to "hack" the app. [Rule 24, 25]
3. **Lockfile:** Maintain `bun.lockb` but ensure the project can build on Node.js using `package.json` scripts.

## V. CRITICAL PATH ITEMS
- [ ] Remove all console.log statements before production
- [ ] Implement rate limiting on all API routes
- [ ] Add Zod validation to every API endpoint
- [ ] Enable RLS on Supabase tables
- [ ] Set up Cron job for soft-delete cleanup

---

**Last Updated:** 2025-03-06
**Version:** 5.2
**Status:** ACTIVE
