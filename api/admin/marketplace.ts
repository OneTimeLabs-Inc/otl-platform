import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const SELLER_STATUSES = new Set(["pending", "approved", "suspended"]);
const LISTING_STATUSES = new Set(["draft", "published", "sold_out", "archived"]);

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    await requirePlatformAdmin(req.headers?.authorization);
    const supabase = getSupabaseAdmin();

    if (req.method === "GET") {
      const [sellerResult, listingResult] = await Promise.all([
        supabase
          .from("store_sellers")
          .select("id, auth_user_id, email, display_name, slug, status, stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, created_at")
          .order("display_name", { ascending: true }),
        supabase
          .from("store_listings")
          .select("id, seller_id, title, category, subcategory, price_cents, quantity, status, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (sellerResult.error) {
        throw new Error(`Unable to load sellers: ${sellerResult.error.message}`);
      }
      if (listingResult.error) {
        throw new Error(`Unable to load listings: ${listingResult.error.message}`);
      }

      const sellers = sellerResult.data ?? [];
      const sellerNames = new Map(sellers.map(seller => [seller.id, seller.display_name]));

      res.status(200).json({
        sellers: sellers.map(seller => ({
          id: seller.id,
          authUserId: seller.auth_user_id,
          email: seller.email,
          displayName: seller.display_name,
          slug: seller.slug,
          status: seller.status,
          stripeAccountId: seller.stripe_account_id ?? null,
          stripeOnboardingComplete: Boolean(seller.stripe_onboarding_complete),
          stripeChargesEnabled: Boolean(seller.stripe_charges_enabled),
          stripePayoutsEnabled: Boolean(seller.stripe_payouts_enabled),
          createdAt: seller.created_at,
        })),
        listings: (listingResult.data ?? []).map(listing => ({
          id: listing.id,
          sellerId: listing.seller_id,
          sellerName: sellerNames.get(listing.seller_id) ?? "Unknown seller",
          title: listing.title,
          category: listing.category,
          subcategory: listing.subcategory,
          priceCents: listing.price_cents,
          quantity: listing.quantity,
          status: listing.status,
          createdAt: listing.created_at,
        })),
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const action = typeof req.body?.action === "string" ? req.body.action : "";

    if (action === "seller-status") {
      const sellerId = typeof req.body?.sellerId === "string" ? req.body.sellerId.trim() : "";
      const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";

      if (!sellerId || !SELLER_STATUSES.has(status)) {
        res.status(400).json({ error: "Valid seller and status are required." });
        return;
      }

      const { data, error } = await supabase
        .from("store_sellers")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", sellerId)
        .select("id")
        .maybeSingle();

      if (error) throw new Error(`Unable to update seller: ${error.message}`);
      if (!data) {
        res.status(404).json({ error: "Seller not found." });
        return;
      }

      res.status(200).json({ updated: true });
      return;
    }

    if (action === "listing-status") {
      const listingId = typeof req.body?.listingId === "string" ? req.body.listingId.trim() : "";
      const status = typeof req.body?.status === "string" ? req.body.status.trim() : "";

      if (!listingId || !LISTING_STATUSES.has(status)) {
        res.status(400).json({ error: "Valid listing and status are required." });
        return;
      }

      const { data, error } = await supabase
        .from("store_listings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", listingId)
        .select("id")
        .maybeSingle();

      if (error) throw new Error(`Unable to update listing: ${error.message}`);
      if (!data) {
        res.status(404).json({ error: "Listing not found." });
        return;
      }

      res.status(200).json({ updated: true });
      return;
    }

    res.status(400).json({ error: "Unknown marketplace administration action." });
  } catch (error) {
    console.error("Marketplace admin API error:", error);

    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      res.status(401).json({ error: "Sign in to Platform." });
      return;
    }
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      res.status(403).json({ error: "Platform administrator access is required." });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to administer marketplace.",
    });
  }
}
