import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

/* ==========================================================
   PLATFORM USER ADMIN 001
   Edit, archive, restore, and synchronize Platform users.
   ========================================================== */

function cleanDisplayName(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, 120)
    : "";
}

function textId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function getTargetUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  platformUserId: string,
) {
  const { data, error } = await supabase
    .from("platform_users")
    .select("id, auth_user_id, email, display_name, active, is_platform_owner, is_platform_admin")
    .eq("id", platformUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load Platform user: ${error.message}`);
  }

  return data;
}

async function suspendSellerForAuthUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  authUserId: string,
) {
  const { data: seller, error: sellerLookupError } = await supabase
    .from("store_sellers")
    .select("id, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (sellerLookupError) {
    throw new Error(`Unable to check Store seller account: ${sellerLookupError.message}`);
  }

  if (!seller) return;

  const listingArchive = await supabase
    .from("store_listings")
    .update({
      status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("seller_id", seller.id)
    .neq("status", "archived");

  if (listingArchive.error) {
    throw new Error(`Unable to archive Store listings: ${listingArchive.error.message}`);
  }

  const sellerSuspend = await supabase
    .from("store_sellers")
    .update({
      status: "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", seller.id);

  if (sellerSuspend.error) {
    throw new Error(`Unable to suspend Store seller: ${sellerSuspend.error.message}`);
  }
}

async function syncSellerForAssignment(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  authUserId: string,
  organization: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  },
  roleCode: string | null,
) {
  const { data: seller, error: sellerLookupError } = await supabase
    .from("store_sellers")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (sellerLookupError) {
    throw new Error(`Unable to check Store seller account: ${sellerLookupError.message}`);
  }

  if (!seller) return;

  const isCompanyOwner = roleCode === "company_owner";

  if (!isCompanyOwner || !organization.active) {
    await suspendSellerForAuthUser(supabase, authUserId);
    return;
  }

  const sellerUpdate = await supabase
    .from("store_sellers")
    .update({
      display_name: organization.name,
      slug: organization.slug,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", seller.id);

  if (sellerUpdate.error) {
    throw new Error(`Unable to reactivate Store seller: ${sellerUpdate.error.message}`);
  }

  const applicationUpdate = await supabase
    .from("store_seller_applications")
    .update({
      display_name: organization.name,
      slug: organization.slug,
      updated_at: new Date().toISOString(),
    })
    .eq("auth_user_id", authUserId);

  if (applicationUpdate.error) {
    throw new Error(`Unable to synchronize seller application: ${applicationUpdate.error.message}`);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const reviewer = await requirePlatformAdmin(req.headers?.authorization);
    const supabase = getSupabaseAdmin();

    if (req.method === "PATCH") {
      const platformUserId = textId(req.body?.id);
      const action = textId(req.body?.action) || "profile";

      if (!platformUserId) {
        res.status(400).json({ error: "Platform user ID is required." });
        return;
      }

      const target = await getTargetUser(supabase, platformUserId);

      if (!target) {
        res.status(404).json({ error: "Platform user was not found." });
        return;
      }

      if (target.is_platform_owner) {
        res.status(403).json({ error: "The Platform Owner account cannot be modified here." });
        return;
      }

      if (action === "restore") {
        const { data, error } = await supabase
          .from("platform_users")
          .update({
            active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", platformUserId)
          .select("id, active")
          .maybeSingle();

        if (error) {
          throw new Error(`Unable to restore Platform user: ${error.message}`);
        }

        if (!data) {
          res.status(404).json({ error: "Platform user was not found." });
          return;
        }

        // Restore intentionally leaves the user unassigned. Their Store seller
        // remains suspended until an admin assigns Company Owner access again.
        res.status(200).json({ restored: true });
        return;
      }

      if (action === "assign") {
        if (!target.active) {
          res.status(409).json({ error: "Restore the Platform user before assigning organization access." });
          return;
        }

        const organizationId = textId(req.body?.organizationId);
        const roleId = textId(req.body?.roleId);

        if (!organizationId || !roleId) {
          res.status(400).json({ error: "Organization and role are required." });
          return;
        }

        const { data: organization, error: organizationError } = await supabase
          .from("organizations")
          .select("id, name, slug, active")
          .eq("id", organizationId)
          .maybeSingle();

        if (organizationError) {
          throw new Error(`Unable to load organization: ${organizationError.message}`);
        }

        if (!organization) {
          res.status(404).json({ error: "Organization was not found." });
          return;
        }

        const { data: role, error: roleError } = await supabase
          .from("platform_roles")
          .select("id, code")
          .eq("id", roleId)
          .maybeSingle();

        if (roleError) {
          throw new Error(`Unable to load organization role: ${roleError.message}`);
        }

        if (!role) {
          res.status(404).json({ error: "Organization role was not found." });
          return;
        }

        const { data: existingMembership, error: membershipLookupError } = await supabase
          .from("organization_members")
          .select("id")
          .eq("platform_user_id", platformUserId)
          .maybeSingle();

        if (membershipLookupError) {
          throw new Error(`Unable to check organization membership: ${membershipLookupError.message}`);
        }

        if (existingMembership) {
          const membershipUpdate = await supabase
            .from("organization_members")
            .update({
              organization_id: organizationId,
              role_id: roleId,
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingMembership.id);

          if (membershipUpdate.error) {
            throw new Error(`Unable to update organization membership: ${membershipUpdate.error.message}`);
          }
        } else {
          const membershipInsert = await supabase
            .from("organization_members")
            .insert({
              platform_user_id: platformUserId,
              organization_id: organizationId,
              role_id: roleId,
              status: "active",
              joined_at: new Date().toISOString(),
            });

          if (membershipInsert.error) {
            throw new Error(`Unable to assign organization membership: ${membershipInsert.error.message}`);
          }
        }

        await syncSellerForAssignment(
          supabase,
          target.auth_user_id,
          organization,
          role.code ?? null,
        );

        res.status(200).json({ assigned: true });
        return;
      }

      if (action === "unassign") {
        const membershipDelete = await supabase
          .from("organization_members")
          .delete()
          .eq("platform_user_id", platformUserId);

        if (membershipDelete.error) {
          throw new Error(`Unable to remove organization access: ${membershipDelete.error.message}`);
        }

        await suspendSellerForAuthUser(supabase, target.auth_user_id);

        res.status(200).json({ unassigned: true });
        return;
      }

      const displayName = cleanDisplayName(req.body?.displayName);

      if (displayName.length < 2) {
        res.status(400).json({ error: "Display name must be at least 2 characters." });
        return;
      }

      const { data, error } = await supabase
        .from("platform_users")
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", platformUserId)
        .select("id, display_name")
        .maybeSingle();

      if (error) {
        throw new Error(`Unable to update Platform user: ${error.message}`);
      }

      if (!data) {
        res.status(404).json({ error: "Platform user was not found." });
        return;
      }

      /* ====================================================
         SELLER IDENTITY SYNC 004
         Platform is authoritative for seller-linked identity.
         A Platform display-name correction also repairs the
         Store seller/application display name. If the seller
         slug still matches its Platform organization slug, the
         organization name is corrected as well.
         ==================================================== */

      const { data: linkedSeller, error: sellerLookupError } = await supabase
        .from("store_sellers")
        .select("id, slug, display_name")
        .eq("auth_user_id", target.auth_user_id)
        .maybeSingle();

      if (sellerLookupError) {
        throw new Error(`Unable to resolve linked Store seller: ${sellerLookupError.message}`);
      }

      if (linkedSeller) {
        const sellerUpdate = await supabase
          .from("store_sellers")
          .update({
            display_name: displayName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", linkedSeller.id);

        if (sellerUpdate.error) {
          throw new Error(`Unable to synchronize Store seller name: ${sellerUpdate.error.message}`);
        }

        const applicationUpdate = await supabase
          .from("store_seller_applications")
          .update({
            display_name: displayName,
            updated_at: new Date().toISOString(),
          })
          .eq("auth_user_id", target.auth_user_id);

        if (applicationUpdate.error) {
          throw new Error(`Unable to synchronize seller application name: ${applicationUpdate.error.message}`);
        }

        const organizationUpdate = await supabase
          .from("organizations")
          .update({
            name: displayName,
            updated_at: new Date().toISOString(),
          })
          .eq("slug", linkedSeller.slug);

        if (organizationUpdate.error) {
          throw new Error(`Unable to synchronize Platform organization name: ${organizationUpdate.error.message}`);
        }
      }

      res.status(200).json({ user: data });
      return;
    }

    if (req.method === "DELETE") {
      const platformUserId = textId(req.body?.id);

      if (!platformUserId) {
        res.status(400).json({ error: "Platform user ID is required." });
        return;
      }

      const target = await getTargetUser(supabase, platformUserId);

      if (!target) {
        res.status(404).json({ error: "Platform user was not found." });
        return;
      }

      if (target.is_platform_owner) {
        res.status(403).json({ error: "The Platform Owner account cannot be deleted." });
        return;
      }

      if (target.auth_user_id === reviewer.id) {
        res.status(409).json({ error: "You cannot delete your own Platform account." });
        return;
      }

      if (target.is_platform_admin && target.active) {
        const { count, error: countError } = await supabase
          .from("platform_users")
          .select("id", { count: "exact", head: true })
          .eq("active", true)
          .or("is_platform_owner.eq.true,is_platform_admin.eq.true");

        if (countError) {
          throw new Error(`Unable to validate Platform administrators: ${countError.message}`);
        }

        if ((count ?? 0) <= 1) {
          res.status(409).json({ error: "The final Platform administrator cannot be deleted." });
          return;
        }
      }

      const membershipDelete = await supabase
        .from("organization_members")
        .delete()
        .eq("platform_user_id", platformUserId);

      if (membershipDelete.error) {
        throw new Error(`Unable to remove organization access: ${membershipDelete.error.message}`);
      }

      const userUpdate = await supabase
        .from("platform_users")
        .update({
          active: false,
          is_platform_admin: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", platformUserId);

      if (userUpdate.error) {
        throw new Error(`Unable to archive Platform user: ${userUpdate.error.message}`);
      }

      await suspendSellerForAuthUser(supabase, target.auth_user_id);

      res.status(200).json({ archived: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("Platform user admin API error:", error);

    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      res.status(401).json({ error: "Sign in to Platform." });
      return;
    }

    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      res.status(403).json({ error: "Platform administrator access is required." });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to manage Platform user.",
    });
  }
}
