-- Phase 0: additive fulfillment safety guard.
-- Apply before deploying code that writes shipping_quote_mismatch.

alter table public.orders
  add column if not exists shipping_quote_mismatch boolean not null default false;

comment on column public.orders.shipping_quote_mismatch is
  'True when the address used for the Printify shipping quote differs from the final Stripe shipping address. Fulfillment must be reviewed manually.';
