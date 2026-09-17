# The QRystal Balls — Phase 0 Safety Baseline

Phase 0 protects the existing production engine before the 2.0 experience work begins. It does not change public routes, Oracle visuals, QR URLs, product URLs, Stripe metadata names, or the manual Printify review workflow.

## Included safeguards

- Complete environment-variable name inventory in `.env.example`.
- A single environment-driven Printify shop configuration.
- Shared Stripe-session-to-order mapping for webhook and success-page recovery.
- A shipping-quote mismatch flag that blocks automatic/manual Printify submission until an administrator reviews the order.
- Shared escaped shipping-email markup.
- A repaired ESLint command and baseline commerce tests.
- An additive database migration for the shipping mismatch flag.

## Required deployment order

1. Capture and securely retain the current production Supabase schema and RLS policies.
2. Confirm the `orders` table has a unique constraint on `stripe_session_id`.
3. Apply `supabase/migrations/202609170001_phase0_shipping_quote_guard.sql`.
4. Confirm every name in `.env.example` exists in the Vercel environment. Never copy secret values into source control.
5. Verify `PRINTIFY_SHOP_ID` is the same shop currently used for products, shipping quotes, fulfillment, and status checks.
6. Deploy to a Vercel preview and run the smoke checklist below with Stripe test mode.
7. Deploy to production only after the preview passes.

## Preview smoke checklist

- Existing `/q/[code]` links still open the correct Oracle and record scans.
- Inactive QR behavior matches the production RLS policy.
- Artifact checkout creates a Stripe session at the server-controlled price.
- Merch checkout rejects an unavailable Printify variant.
- Merch checkout calculates standard shipping for the entered address.
- A paid Stripe test session creates exactly one order.
- Reloading `/success` does not create a duplicate order.
- A mismatched final Stripe shipping address marks the order for review.
- A flagged order cannot be submitted to Printify.
- A normal paid merch order can be submitted once and stores the Printify order ID.
- Printify status sync stores tracking data.
- Shipping email renders customer/product text as text rather than HTML.
- Admin routes reject signed-out and non-admin users.

## Rollback

The database change is additive and safe to leave in place. If the Phase 0 deployment must be rolled back, redeploy the prior Vercel production version. Do not remove the `shipping_quote_mismatch` column during an incident rollback.

## Production schema limitation

The sanitized source archive did not contain the current production `orders` schema or complete RLS policies. Those must be exported from the linked production Supabase project before this package is deployed. Do not treat the original `supabase/schema.sql` as a complete production backup.
