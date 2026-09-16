-- ============================================================
-- OneTime Labs Platform
-- Platform User Administration Permissions
-- Version 0.1.5
-- ============================================================
-- Server-side Platform admin APIs use the Supabase service_role.
-- Grant only the table privileges required for user lifecycle actions.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, UPDATE
ON TABLE public.platform_users
TO service_role;

GRANT SELECT, UPDATE, DELETE
ON TABLE public.organization_members
TO service_role;

GRANT SELECT, UPDATE
ON TABLE public.store_sellers
TO service_role;

GRANT SELECT, UPDATE
ON TABLE public.store_listings
TO service_role;
