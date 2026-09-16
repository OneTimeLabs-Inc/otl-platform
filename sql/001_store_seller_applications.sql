-- ============================================================
-- OneTime Labs Platform / Store
-- Seller applications queue - safe migration v2
--
-- Run this in the SAME Supabase project used by Platform + Store.
-- This version intentionally does NOT backfill existing sellers.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fail with a useful message if the Store marketplace schema is missing.
DO $$
BEGIN
  IF to_regclass('public.store_sellers') IS NULL THEN
    RAISE EXCEPTION 'Required table public.store_sellers does not exist. Run the Store marketplace migration first.';
  END IF;
END
$$;

-- Create the base table if it does not exist yet.
CREATE TABLE IF NOT EXISTS public.store_seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add/repair the expected columns safely.
ALTER TABLE public.store_seller_applications
  ADD COLUMN IF NOT EXISTS auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS selling_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_by_auth_user_id uuid,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Required fields for new applications.
ALTER TABLE public.store_seller_applications
  ALTER COLUMN auth_user_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN display_name SET NOT NULL,
  ALTER COLUMN slug SET NOT NULL;

-- Unique indexes are easier to make idempotent than named UNIQUE constraints.
CREATE UNIQUE INDEX IF NOT EXISTS uq_store_seller_applications_auth_user_id
  ON public.store_seller_applications(auth_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_store_seller_applications_slug
  ON public.store_seller_applications(slug);

CREATE UNIQUE INDEX IF NOT EXISTS uq_store_seller_applications_seller_id
  ON public.store_seller_applications(seller_id)
  WHERE seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_store_seller_applications_status
  ON public.store_seller_applications(status, submitted_at DESC);

-- Add foreign keys only if they are not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_store_seller_applications_auth_user'
      AND conrelid = 'public.store_seller_applications'::regclass
  ) THEN
    ALTER TABLE public.store_seller_applications
      ADD CONSTRAINT fk_store_seller_applications_auth_user
      FOREIGN KEY (auth_user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_store_seller_applications_seller'
      AND conrelid = 'public.store_seller_applications'::regclass
  ) THEN
    ALTER TABLE public.store_seller_applications
      ADD CONSTRAINT fk_store_seller_applications_seller
      FOREIGN KEY (seller_id)
      REFERENCES public.store_sellers(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_store_seller_applications_reviewed_by'
      AND conrelid = 'public.store_seller_applications'::regclass
  ) THEN
    ALTER TABLE public.store_seller_applications
      ADD CONSTRAINT fk_store_seller_applications_reviewed_by
      FOREIGN KEY (reviewed_by_auth_user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_store_seller_applications_status'
      AND conrelid = 'public.store_seller_applications'::regclass
  ) THEN
    ALTER TABLE public.store_seller_applications
      ADD CONSTRAINT chk_store_seller_applications_status
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END
$$;

ALTER TABLE public.store_seller_applications ENABLE ROW LEVEL SECURITY;

-- No browser policies are created here on purpose.
-- Store + Platform server APIs use service_role after validating auth.

-- Sanity check: this should return the table name when successful.
SELECT to_regclass('public.store_seller_applications') AS created_table;
