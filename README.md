# QoRacle MVP

A mobile-first QR-powered Magic-8-Ball-style entertainment app.

## Stack
- Next.js
- TypeScript
- Supabase/Postgres
- CSS animations
- QR routing

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project.
4. Run `supabase/schema.sql` in the Supabase SQL Editor.
5. Put your Supabase URL and publishable key in `.env.local`.
6. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Test QR URLs

After setting your local host:
- /q/DEMO-CLASSIC
- /q/DEMO-CHAOS
- /q/DEMO-LOVE
- /q/DEMO-DARK
- /q/DEMO-DND

## Next production steps
1. Add Supabase Auth for the admin.
2. Build an admin QR generator.
3. Generate downloadable SVG/PNG QR codes.
4. Add Stripe Checkout.
5. Add custom customer QR themes.
6. Add better scan analytics and rate limiting.
7. Add a custom domain.
8. Review RLS policies before public launch.

Supabase's current Next.js guidance recommends the App Router, `@supabase/ssr`, environment variables, and RLS policies for database access. See the official docs:
https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
