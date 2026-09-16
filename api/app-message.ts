/* ==========================================================
   APP MESSAGE API
   Public read-only endpoint for installed OneTime Labs apps.

   Example:
   GET /api/app-message?app=streamsafe
   ========================================================== */

export default async function handler(
  req: any,
  res: any,
) {

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate",
  );


  if (req.method !== "GET") {

    res
      .status(405)
      .json(
        {
          error:
            "Method not allowed",
        },
      );

    return;

  }


  const rawApp =
    Array.isArray(
      req.query?.app,
    )
      ? req.query.app[0]
      : req.query?.app;


  const appSlug =
    typeof rawApp === "string"
      ? rawApp
          .trim()
          .toLowerCase()
      : "";


  if (
    !appSlug ||
    !/^[a-z0-9_-]+$/.test(
      appSlug,
    )
  ) {

    res
      .status(400)
      .json(
        {
          error:
            "Invalid app",
        },
      );

    return;

  }


  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ??
    process.env.SUPABASE_URL;


  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;


  if (
    !supabaseUrl ||
    !supabaseKey
  ) {

    res
      .status(500)
      .json(
        {
          error:
            "Platform database is not configured.",
        },
      );

    return;

  }


  const queryUrl =
    new URL(
      "/rest/v1/platform_app_messages",
      supabaseUrl,
    );


  queryUrl.searchParams.set(
    "app_slug",
    `eq.${appSlug}`,
  );

  queryUrl.searchParams.set(
    "is_active",
    "eq.true",
  );

  queryUrl.searchParams.set(
    "select",
    "app_slug,message,is_active,updated_at",
  );

  queryUrl.searchParams.set(
    "limit",
    "1",
  );


  try {

    const response =
      await fetch(
        queryUrl.toString(),
        {
          headers:
            {
              apikey:
                supabaseKey,

              Authorization:
                `Bearer ${supabaseKey}`,

              Accept:
                "application/json",
            },
        },
      );


    if (!response.ok) {

      const detail =
        await response.text();

      console.error(
        "App message query failed:",
        detail,
      );


      res
        .status(502)
        .json(
          {
            error:
              "Could not read platform broadcast.",
          },
        );

      return;

    }


    const rows =
      await response.json();


    const current =
      Array.isArray(rows)
        ? rows[0]
        : null;


    if (!current) {

      res
        .status(200)
        .json(
          {
            app:
              appSlug,

            active:
              false,

            message:
              "",

            updated_at:
              null,
          },
        );

      return;

    }


    res
      .status(200)
      .json(
        {
          app:
            current.app_slug,

          active:
            true,

          message:
            current.message ?? "",

          updated_at:
            current.updated_at ?? null,
        },
      );

  }
  catch (error) {

    console.error(
      error,
    );


    res
      .status(500)
      .json(
        {
          error:
            "App message API failed.",
        },
      );

  }

}
