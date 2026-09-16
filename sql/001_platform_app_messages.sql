-- ==========================================================
-- OneTime Labs Platform
-- Global App Broadcasts
--
-- One row per application.
-- Platform admins can update it.
-- Installed apps can read ACTIVE messages.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.platform_app_messages (
    app_slug text PRIMARY KEY,
    message text NOT NULL DEFAULT '',
    is_active boolean NOT NULL DEFAULT false,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid
);


CREATE OR REPLACE FUNCTION public.set_platform_app_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS
    platform_app_messages_set_updated_at
ON public.platform_app_messages;


CREATE TRIGGER
    platform_app_messages_set_updated_at
BEFORE UPDATE
ON public.platform_app_messages
FOR EACH ROW
EXECUTE FUNCTION
    public.set_platform_app_messages_updated_at();


ALTER TABLE
    public.platform_app_messages
ENABLE ROW LEVEL SECURITY;


GRANT SELECT
ON public.platform_app_messages
TO anon,
   authenticated;


GRANT INSERT,
      UPDATE,
      DELETE
ON public.platform_app_messages
TO authenticated;


DROP POLICY IF EXISTS
    "Read active app broadcasts"
ON public.platform_app_messages;


CREATE POLICY
    "Read active app broadcasts"
ON public.platform_app_messages
FOR SELECT
USING (
    is_active = true
    OR
    (
        auth.jwt() ->> 'email'
    ) = 'iekhanine@gmail.com'
);


DROP POLICY IF EXISTS
    "Platform admin inserts app broadcasts"
ON public.platform_app_messages;


CREATE POLICY
    "Platform admin inserts app broadcasts"
ON public.platform_app_messages
FOR INSERT
TO authenticated
WITH CHECK (
    (
        auth.jwt() ->> 'email'
    ) = 'iekhanine@gmail.com'
);


DROP POLICY IF EXISTS
    "Platform admin updates app broadcasts"
ON public.platform_app_messages;


CREATE POLICY
    "Platform admin updates app broadcasts"
ON public.platform_app_messages
FOR UPDATE
TO authenticated
USING (
    (
        auth.jwt() ->> 'email'
    ) = 'iekhanine@gmail.com'
)
WITH CHECK (
    (
        auth.jwt() ->> 'email'
    ) = 'iekhanine@gmail.com'
);


DROP POLICY IF EXISTS
    "Platform admin deletes app broadcasts"
ON public.platform_app_messages;


CREATE POLICY
    "Platform admin deletes app broadcasts"
ON public.platform_app_messages
FOR DELETE
TO authenticated
USING (
    (
        auth.jwt() ->> 'email'
    ) = 'iekhanine@gmail.com'
);


INSERT INTO public.platform_app_messages (
    app_slug,
    message,
    is_active
)
VALUES (
    'streamsafe',
    '',
    false
)
ON CONFLICT (
    app_slug
)
DO NOTHING;
