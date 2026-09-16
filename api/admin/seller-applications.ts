import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

/* ==========================================================
   SELLER APPLICATION ADMIN API 001
   Platform review + Store account creation
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
    const reviewer =
      await requirePlatformAdmin(
        req.headers?.authorization,
      );

    const supabase =
      getSupabaseAdmin();

    if (req.method === "GET") {
      const { data, error } =
        await supabase
          .from("store_seller_applications")
          .select("*")
          .order("submitted_at", {
            ascending: false,
          });

      if (error) {
        throw new Error(error.message);
      }

      const statusRank: Record<string, number> = {
        pending: 0,
        approved: 1,
        rejected: 2,
      };

      const applications =
        [...(data ?? [])].sort((a, b) => {
          const statusDifference =
            (statusRank[a.status] ?? 99) -
            (statusRank[b.status] ?? 99);

          if (statusDifference !== 0) {
            return statusDifference;
          }

          return new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime();
        });

      res.status(200).json({
        applications,
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({
        error: "Method not allowed.",
      });
      return;
    }

    const applicationId =
      typeof req.body?.applicationId === "string"
        ? req.body.applicationId.trim()
        : "";

    const status =
      req.body?.status === "approved" ||
      req.body?.status === "rejected"
        ? req.body.status
        : "";

    if (!applicationId || !status) {
      res.status(400).json({
        error: "Application and review status are required.",
      });
      return;
    }

    const { data: application, error: lookupError } =
      await supabase
        .from("store_seller_applications")
        .select("*")
        .eq("id", applicationId)
        .single();

    if (lookupError || !application) {
      res.status(404).json({
        error: "Seller application was not found.",
      });
      return;
    }

    if (
      application.status !== "pending" &&
      application.status !== status
    ) {
      res.status(409).json({
        error: `This application is already ${application.status}.`,
      });
      return;
    }

    let sellerId =
      application.seller_id as string | null;

    if (status === "approved") {
      const existingSeller =
        await supabase
          .from("store_sellers")
          .select("id, slug")
          .eq("auth_user_id", application.auth_user_id)
          .maybeSingle();

      if (existingSeller.error) {
        throw new Error(existingSeller.error.message);
      }

      if (existingSeller.data) {
        sellerId = existingSeller.data.id;

        const { error: sellerStatusError } =
          await supabase
            .from("store_sellers")
            .update({
              status: "approved",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sellerId);

        if (sellerStatusError) {
          throw new Error(sellerStatusError.message);
        }
      } else {
        const handleOwner =
          await supabase
            .from("store_sellers")
            .select("id")
            .eq("slug", application.slug)
            .maybeSingle();

        if (handleOwner.error) {
          throw new Error(handleOwner.error.message);
        }

        if (handleOwner.data) {
          res.status(409).json({
            error: "That Store handle was claimed before this application was approved.",
          });
          return;
        }

        const { data: seller, error: sellerError } =
          await supabase
            .from("store_sellers")
            .insert({
              auth_user_id: application.auth_user_id,
              email: application.email,
              display_name: application.display_name,
              slug: application.slug,
              status: "approved",
            })
            .select("id")
            .single();

        if (sellerError || !seller) {
          throw new Error(
            sellerError?.message ||
            "Unable to create Store seller account.",
          );
        }

        sellerId = seller.id;
      }
    }

    const { data: updated, error: updateError } =
      await supabase
        .from("store_seller_applications")
        .update({
          status,
          seller_id:
            status === "approved"
              ? sellerId
              : application.seller_id,
          reviewed_at:
            new Date().toISOString(),
          reviewed_by_auth_user_id:
            reviewer.id,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", application.id)
        .select("*")
        .single();

    if (updateError || !updated) {
      throw new Error(
        updateError?.message ||
        "Unable to update seller application.",
      );
    }

    res.status(200).json({
      application: updated,
    });
  } catch (error) {
    console.error(
      "Seller application admin API error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "AUTH_REQUIRED"
    ) {
      res.status(401).json({
        error: "Sign in to Platform.",
      });
      return;
    }

    if (
      error instanceof Error &&
      error.message === "ADMIN_REQUIRED"
    ) {
      res.status(403).json({
        error: "Platform administrator access is required.",
      });
      return;
    }

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to review seller application.",
    });
  }
}
