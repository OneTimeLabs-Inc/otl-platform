-- ============================================================
-- OneTime Labs Platform
-- Path-based customer sites, layout library, content + media
-- Safe additive migration
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE IF EXISTS public.platform_business_instances
  ADD COLUMN IF NOT EXISTS path_slug text,
  ADD COLUMN IF NOT EXISTS site_layout_code text,
  ADD COLUMN IF NOT EXISTS subdomain_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS canonical_url text;

UPDATE public.platform_business_instances
SET path_slug = COALESCE(path_slug, subdomain)
WHERE path_slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_business_instances_path_slug
  ON public.platform_business_instances(path_slug)
  WHERE path_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.platform_site_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  style_key text NOT NULL,
  supported_business_types text[] NOT NULL DEFAULT ARRAY[]::text[],
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_image_url text,
  is_system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_business_site_content (
  business_instance_id uuid PRIMARY KEY REFERENCES public.platform_business_instances(id) ON DELETE CASCADE,
  headline text NOT NULL DEFAULT '',
  subheadline text NOT NULL DEFAULT '',
  about_text text NOT NULL DEFAULT '',
  primary_cta_label text NOT NULL DEFAULT 'Contact us',
  primary_cta_href text NOT NULL DEFAULT '#contact',
  phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  address_text text NOT NULL DEFAULT '',
  hours_text text NOT NULL DEFAULT '',
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonials jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_business_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_instance_id uuid NOT NULL REFERENCES public.platform_business_instances(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('hero','logo','gallery','portfolio','placeholder')),
  storage_path text,
  public_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  source_name text,
  source_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_business_media_business
  ON public.platform_business_media(business_instance_id, kind, sort_order, created_at);

-- Server APIs use service_role; the public site reads through server-side code.
ALTER TABLE public.platform_site_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_business_site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_business_media ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.platform_site_layouts TO service_role;
GRANT ALL ON TABLE public.platform_business_site_content TO service_role;
GRANT ALL ON TABLE public.platform_business_media TO service_role;

-- Public bucket; writes still go through authenticated server APIs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-site-media',
  'business-site-media',
  true,
  8388608,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO public.platform_site_layouts
  (code, name, description, style_key, supported_business_types, config, is_system)
VALUES
  (
    'clean-service',
    'Clean Service',
    'Bright, trust-first layout with a clear call to action, service cards, proof points and a straightforward contact section.',
    'clean-service',
    ARRAY['retail','restaurant_bar','barber_salon','auto_repair'],
    '{"palette":{"background":"#f7fafc","surface":"#ffffff","text":"#132238","muted":"#607087","accent":"#2473d4","accent2":"#dcecff"},"hero":"split","cards":"soft","nav":"light","radius":"18px","font":"sans"}'::jsonb,
    true
  ),
  (
    'workshop-dark',
    'Workshop Dark',
    'High-contrast industrial presentation with oversized type, dark surfaces and a strong booking/estimate CTA.',
    'workshop-dark',
    ARRAY['auto_repair','retail'],
    '{"palette":{"background":"#0b0c0e","surface":"#15171a","text":"#f8fafc","muted":"#a8afb8","accent":"#ff6a1a","accent2":"#24282d"},"hero":"full-bleed","cards":"outlined","nav":"dark","radius":"8px","font":"condensed"}'::jsonb,
    true
  ),
  (
    'editorial-studio',
    'Editorial Studio',
    'Warm editorial design with expressive typography, large work photography and a portfolio-forward structure.',
    'editorial-studio',
    ARRAY['barber_salon','retail','restaurant_bar'],
    '{"palette":{"background":"#f4eadf","surface":"#fffaf4","text":"#2d241f","muted":"#735f52","accent":"#b85c3f","accent2":"#e6cdbd"},"hero":"editorial","cards":"flat","nav":"minimal","radius":"2px","font":"serif"}'::jsonb,
    true
  ),
  (
    'hospitality-warm',
    'Hospitality Warm',
    'Image-led hospitality layout built around atmosphere, menus/services, hours and a prominent reservation or booking action.',
    'hospitality-warm',
    ARRAY['restaurant_bar','barber_salon'],
    '{"palette":{"background":"#fff8ed","surface":"#fffdf8","text":"#261c16","muted":"#79675a","accent":"#d66b22","accent2":"#f5d8b5"},"hero":"image-card","cards":"rounded","nav":"warm","radius":"28px","font":"sans"}'::jsonb,
    true
  ),
  (
    'neighborhood-classic',
    'Neighborhood Classic',
    'Friendly local-business layout with heritage cues, strong hours/location visibility and familiar navigation.',
    'neighborhood-classic',
    ARRAY['retail','restaurant_bar','barber_salon','auto_repair'],
    '{"palette":{"background":"#f8f1df","surface":"#fffdf6","text":"#18324a","muted":"#6d675e","accent":"#b33a2b","accent2":"#d8e2e8"},"hero":"classic","cards":"bordered","nav":"classic","radius":"10px","font":"serif"}'::jsonb,
    true
  ),
  (
    'modern-grid',
    'Modern Grid',
    'Contemporary modular grid with bold blocks, asymmetric composition, service tiles and image panels.',
    'modern-grid',
    ARRAY['retail','barber_salon','auto_repair','restaurant_bar'],
    '{"palette":{"background":"#eef0ea","surface":"#ffffff","text":"#101311","muted":"#5c655e","accent":"#2f6b4f","accent2":"#cadacb"},"hero":"grid","cards":"grid","nav":"minimal","radius":"0px","font":"sans"}'::jsonb,
    true
  ),
  (
    'luxury-noir',
    'Luxury Noir',
    'Premium black-and-ivory presentation with gold accents, restrained copy and large cinematic imagery.',
    'luxury-noir',
    ARRAY['barber_salon','restaurant_bar','retail','auto_repair'],
    '{"palette":{"background":"#0d0d0d","surface":"#171717","text":"#f7f2e8","muted":"#b9afa0","accent":"#c9a45e","accent2":"#2b261f"},"hero":"cinematic","cards":"luxury","nav":"dark","radius":"0px","font":"serif"}'::jsonb,
    true
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  style_key = EXCLUDED.style_key,
  supported_business_types = EXCLUDED.supported_business_types,
  config = EXCLUDED.config,
  is_system = EXCLUDED.is_system,
  active = true,
  updated_at = now();

UPDATE public.platform_business_instances
SET site_layout_code = COALESCE(site_layout_code, 'clean-service')
WHERE site_layout_code IS NULL;
