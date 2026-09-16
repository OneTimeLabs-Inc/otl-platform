import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

/* ==========================================================
   PLATFORM ORGANIZATION ADMIN 001
   Organization identity is owned by Platform.
   Store seller identity follows Platform changes.
   ========================================================== */

function cleanName(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

function cleanSlug(value: unknown): string {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 72)
    : "";
}

async function getCompanyOwnerAuthUserId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
): Promise<string | null> {
  const { data: role, error: roleError } = await supabase
    .from("platform_roles")
    .select("id")
    .eq("code", "company_owner")
    .maybeSingle();

  if (roleError) {
    throw new Error(`Unable to resolve Company Owner role: ${roleError.message}`);
  }

  let memberships: Array<{ platform_user_id: string; role_id: string | null }> = [];

  if (role?.id) {
    const ownerMembership = await supabase
      .from("organization_members")
      .select("platform_user_id, role_id")
      .eq("organization_id", organizationId)
      .eq("role_id", role.id)
      .limit(1);

    if (ownerMembership.error) {
      throw new Error(`Unable to resolve organization owner: ${ownerMembership.error.message}`);
    }

    memberships = ownerMembership.data ?? [];
  }

  // Older organizations may predate the Company Owner role assignment.
  // Fall back to the first organization member so Store cleanup still runs.
  if (memberships.length === 0) {
    const fallbackMembership = await supabase
      .from("organization_members")
      .select("platform_user_id, role_id")
      .eq("organization_id", organizationId)
      .limit(1);

    if (fallbackMembership.error) {
      throw new Error(`Unable to resolve organization member: ${fallbackMembership.error.message}`);
    }

    memberships = fallbackMembership.data ?? [];
  }

  const platformUserId = memberships[0]?.platform_user_id;
  if (!platformUserId) return null;

  const { data: platformUser, error: platformUserError } = await supabase
    .from("platform_users")
    .select("auth_user_id")
    .eq("id", platformUserId)
    .maybeSingle();

  if (platformUserError) {
    throw new Error(`Unable to resolve organization owner account: ${platformUserError.message}`);
  }

  return platformUser?.auth_user_id ?? null;
}

async function ensureSlugAvailable(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  organizationId: string,
  authUserId: string | null,
  slug: string,
) {
  const organizationConflict = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .neq("id", organizationId)
    .maybeSingle();

  if (organizationConflict.error) {
    throw new Error(organizationConflict.error.message);
  }

  if (organizationConflict.data) {
    throw new Error("That organization slug is already in use.");
  }

  if (!authUserId) return;

  const sellerConflict = await supabase
    .from("store_sellers")
    .select("id")
    .eq("slug", slug)
    .neq("auth_user_id", authUserId)
    .maybeSingle();

  if (sellerConflict.error) {
    throw new Error(sellerConflict.error.message);
  }

  if (sellerConflict.data) {
    throw new Error("That Store seller handle is already in use.");
  }

  const applicationConflict = await supabase
    .from("store_seller_applications")
    .select("id")
    .eq("slug", slug)
    .neq("auth_user_id", authUserId)
    .maybeSingle();

  if (applicationConflict.error) {
    throw new Error(applicationConflict.error.message);
  }

  if (applicationConflict.data) {
    throw new Error("That Store application handle is already in use.");
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    await requirePlatformAdmin(req.headers?.authorization);
    const supabase = getSupabaseAdmin();

    if (req.method === "PATCH") {
      const organizationId = typeof req.body?.id === "string" ? req.body.id.trim() : "";
      const name = cleanName(req.body?.name);
      const slug = cleanSlug(req.body?.slug || name);
      const active = req.body?.active !== false;

      if (!organizationId || name.length < 2 || slug.length < 2) {
        res.status(400).json({ error: "Organization ID, name, and slug are required." });
        return;
      }

      const authUserId = await getCompanyOwnerAuthUserId(supabase, organizationId);
      await ensureSlugAvailable(supabase, organizationId, authUserId, slug);

      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .update({
          name,
          slug,
          active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId)
        .select("id, name, slug, active, customer_id, created_at, updated_at")
        .maybeSingle();

      if (organizationError) throw new Error(organizationError.message);
      if (!organization) {
        res.status(404).json({ error: "Organization not found." });
        return;
      }

      if (authUserId) {
        const sellerUpdate = await supabase
          .from("store_sellers")
          .update({
            display_name: name,
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq("auth_user_id", authUserId);

        if (sellerUpdate.error) throw new Error(sellerUpdate.error.message);

        const applicationUpdate = await supabase
          .from("store_seller_applications")
          .update({
            display_name: name,
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq("auth_user_id", authUserId);

        if (applicationUpdate.error) throw new Error(applicationUpdate.error.message);
      }

      res.status(200).json({ organization });
      return;
    }

    if (req.method === "DELETE") {
      const organizationId = typeof req.body?.id === "string" ? req.body.id.trim() : "";

      if (!organizationId) {
        res.status(400).json({ error: "Organization ID is required." });
        return;
      }

      const authUserId = await getCompanyOwnerAuthUserId(supabase, organizationId);

      if (authUserId) {
        const { data: seller, error: sellerLookupError } = await supabase
          .from("store_sellers")
          .select("id")
          .eq("auth_user_id", authUserId)
          .maybeSingle();

        if (sellerLookupError) throw new Error(sellerLookupError.message);

        if (seller) {
          const archiveListings = await supabase
            .from("store_listings")
            .update({
              status: "archived",
              updated_at: new Date().toISOString(),
            })
            .eq("seller_id", seller.id)
            .neq("status", "archived");

          if (archiveListings.error) throw new Error(archiveListings.error.message);

          const suspendSeller = await supabase
            .from("store_sellers")
            .update({
              status: "suspended",
              updated_at: new Date().toISOString(),
            })
            .eq("id", seller.id);

          if (suspendSeller.error) throw new Error(suspendSeller.error.message);
        }
      }

      // Platform "Delete" is intentionally a soft delete for auditability.
      // The organization disappears from active administration while its
      // historical membership and Store records remain traceable.
      const { data: archivedOrganization, error: archiveOrganizationError } = await supabase
        .from("organizations")
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId)
        .select("id")
        .maybeSingle();

      if (archiveOrganizationError) throw new Error(archiveOrganizationError.message);
      if (!archivedOrganization) {
        res.status(404).json({ error: "Organization not found." });
        return;
      }

      res.status(200).json({ archived: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Organization admin API error:", error);

    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      res.status(401).json({ error: "Sign in to Platform." });
      return;
    }

    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      res.status(403).json({ error: "Platform administrator access is required." });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to update organization.",
    });
  }
}
