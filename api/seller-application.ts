import { requireUser } from "./_lib/auth.js";
import {
  slugifySeller,
  textValue,
} from "./_lib/sellerApplication.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";

/* ==========================================================
   SELLER APPLICATION API 001
   Public-to-authenticated seller application endpoint
   ========================================================== */

export default async function handler(
  req: any,
  res: any,
) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate",
  );

  try {
    const user =
      await requireUser(req.headers?.authorization);

    if (!user.email) {
      res.status(400).json({
        error: "Your OneTime Labs account needs an email address.",
      });
      return;
    }

    const supabase =
      getSupabaseAdmin();

    if (req.method === "GET") {
      const { data, error } =
        await supabase
          .from("store_seller_applications")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({
        application: data ?? null,
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method not allowed.",
      });
      return;
    }

    const existing =
      await supabase
        .from("store_seller_applications")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    if (existing.data) {
      res.status(200).json({
        application: existing.data,
      });
      return;
    }

    const displayName =
      textValue(req.body?.displayName, 100);

    const slug =
      slugifySeller(
        textValue(req.body?.slug, 100) || displayName,
      );

    const sellingDescription =
      textValue(req.body?.sellingDescription, 1200);

    if (displayName.length < 2) {
      res.status(400).json({
        error: "Seller / shop name is required.",
      });
      return;
    }

    if (slug.length < 2) {
      res.status(400).json({
        error: "Choose a valid Store handle.",
      });
      return;
    }

    if (sellingDescription.length < 10) {
      res.status(400).json({
        error: "Tell us briefly what you plan to sell.",
      });
      return;
    }

    const sellerHandleCheck =
      await supabase
        .from("store_sellers")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (sellerHandleCheck.error) {
      throw new Error(sellerHandleCheck.error.message);
    }

    if (sellerHandleCheck.data) {
      res.status(409).json({
        error: "That Store handle is already in use.",
      });
      return;
    }

    const applicationHandleCheck =
      await supabase
        .from("store_seller_applications")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (applicationHandleCheck.error) {
      throw new Error(applicationHandleCheck.error.message);
    }

    if (applicationHandleCheck.data) {
      res.status(409).json({
        error: "That Store handle is already reserved by another application.",
      });
      return;
    }

    const { data, error } =
      await supabase
        .from("store_seller_applications")
        .insert({
          auth_user_id: user.id,
          email: user.email.trim().toLowerCase(),
          display_name: displayName,
          slug,
          selling_description: sellingDescription,
          status: "pending",
          submitted_at: new Date().toISOString(),
        })
        .select("*")
        .single();

    if (error) {
      if (error.code === "23505") {
        res.status(409).json({
          error: "A seller application already exists for this account or Store handle.",
        });
        return;
      }

      throw new Error(error.message);
    }

    res.status(201).json({
      application: data,
    });
  } catch (error) {
    console.error("Seller application API error:", error);

    if (
      error instanceof Error &&
      error.message === "AUTH_REQUIRED"
    ) {
      res.status(401).json({
        error: "Sign in to apply for a seller account.",
      });
      return;
    }

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to process seller application.",
    });
  }
}
