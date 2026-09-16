import { createHash, randomBytes } from "node:crypto";
import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function storePublicUrl(): string {
  return (process.env.STORE_PUBLIC_URL?.trim() || "https://store.onetimelabs.net").replace(/\/$/, "");
}

function safeTtlMinutes(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 60;
  return Math.min(Math.max(Math.round(parsed), 5), 10080);
}

function safeMaxUses(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.round(parsed), 1), 100);
}

async function buildSnapshot(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const [productsResult, usersResult, entitlementsResult, linksResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, current_version")
      .order("name", { ascending: true }),
    supabase
      .from("platform_users")
      .select("id, auth_user_id, email, display_name, active")
      .eq("active", true)
      .order("email", { ascending: true }),
    supabase
      .from("software_entitlements")
      .select("id, auth_user_id, product_id, license_id, source, download_enabled, granted_at, revoked_at")
      .order("granted_at", { ascending: false }),
    supabase
      .from("store_download_links")
      .select("id, product_id, license_id, recipient_email, max_uses, use_count, expires_at, revoked_at, created_at, last_used_at, note")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (productsResult.error) throw new Error(`Unable to load products: ${productsResult.error.message}`);
  if (usersResult.error) throw new Error(`Unable to load users: ${usersResult.error.message}`);
  if (entitlementsResult.error) throw new Error(`Unable to load software entitlements: ${entitlementsResult.error.message}`);
  if (linksResult.error) throw new Error(`Unable to load download links: ${linksResult.error.message}`);

  const products = productsResult.data ?? [];
  const users = usersResult.data ?? [];
  const entitlements = entitlementsResult.data ?? [];
  const links = linksResult.data ?? [];

  const productMap = new Map(products.map(product => [product.id, product]));
  const userMap = new Map(users.map(user => [user.auth_user_id, user]));

  const licenseIds = Array.from(new Set(entitlements.map(item => item.license_id).filter(Boolean)));
  let licenseRows: Array<{
    id: string;
    license_key: string;
    status: string;
  }> = [];

  if (licenseIds.length > 0) {
    const licenseResult = await supabase
      .from("licenses")
      .select("id, license_key, status")
      .in("id", licenseIds);

    if (licenseResult.error) {
      throw new Error(`Unable to load licenses: ${licenseResult.error.message}`);
    }

    licenseRows = licenseResult.data ?? [];
  }

  const licenseMap = new Map(licenseRows.map(license => [license.id, license]));

  return {
    products: products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      currentVersion: product.current_version ?? null,
    })),
    users: users.map(user => ({
      id: user.id,
      authUserId: user.auth_user_id,
      email: user.email,
      displayName: user.display_name ?? null,
    })),
    licenses: entitlements.map(entitlement => {
      const user = userMap.get(entitlement.auth_user_id);
      const product = productMap.get(entitlement.product_id);
      const license = licenseMap.get(entitlement.license_id);

      return {
        entitlementId: entitlement.id,
        licenseId: entitlement.license_id,
        licenseKey: license?.license_key ?? "Unknown",
        authUserId: entitlement.auth_user_id,
        userEmail: user?.email ?? "Unknown user",
        userDisplayName: user?.display_name ?? null,
        productId: entitlement.product_id,
        productName: product?.name ?? "Unknown product",
        productSlug: product?.slug ?? "unknown",
        status: (license?.status ?? "revoked") as "active" | "suspended" | "revoked",
        downloadEnabled: entitlement.download_enabled,
        source: entitlement.source,
        grantedAt: entitlement.granted_at,
        revokedAt: entitlement.revoked_at,
      };
    }),
    downloadLinks: links.map(link => ({
      id: link.id,
      productId: link.product_id,
      productName: productMap.get(link.product_id)?.name ?? "Unknown product",
      licenseId: link.license_id ?? null,
      recipientEmail: link.recipient_email ?? null,
      maxUses: link.max_uses ?? null,
      useCount: link.use_count,
      expiresAt: link.expires_at,
      revokedAt: link.revoked_at ?? null,
      createdAt: link.created_at,
      lastUsedAt: link.last_used_at ?? null,
      note: link.note ?? null,
    })),
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  try {
    const actor = await requirePlatformAdmin(req.headers?.authorization);
    const supabase = getSupabaseAdmin();

    if (req.method === "GET") {
      res.status(200).json(await buildSnapshot(supabase));
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed." });
      return;
    }

    const action = text(req.body?.action);

    if (action === "assign") {
      const authUserId = text(req.body?.authUserId);
      const productId = text(req.body?.productId);
      const note = text(req.body?.note) || null;

      if (!authUserId || !productId) {
        res.status(400).json({ error: "User and product are required." });
        return;
      }

      const { data, error } = await supabase.rpc("admin_assign_perpetual_license", {
        p_auth_user_id: authUserId,
        p_product_id: productId,
        p_actor_user_id: actor.id,
        p_note: note,
      });

      if (error) throw new Error(`Unable to assign license: ${error.message}`);

      const result = data as Record<string, unknown>;
      res.status(200).json({
        licenseId: String(result.license_id ?? ""),
        licenseKey: String(result.license_key ?? ""),
        existing: Boolean(result.existing),
      });
      return;
    }

    if (action === "status") {
      const licenseId = text(req.body?.licenseId);
      const status = text(req.body?.status);
      const reason = text(req.body?.reason) || null;

      if (!licenseId || !["active", "suspended", "revoked"].includes(status)) {
        res.status(400).json({ error: "License and valid status are required." });
        return;
      }

      const { data, error } = await supabase.rpc("admin_set_perpetual_license_status", {
        p_license_id: licenseId,
        p_status: status,
        p_actor_user_id: actor.id,
        p_reason: reason,
      });

      if (error) throw new Error(`Unable to update license: ${error.message}`);
      res.status(200).json({ status: (data as Record<string, unknown>)?.status ?? status });
      return;
    }

    if (action === "download-access") {
      const entitlementId = text(req.body?.entitlementId);
      const enabled = Boolean(req.body?.enabled);

      if (!entitlementId) {
        res.status(400).json({ error: "Entitlement ID is required." });
        return;
      }

      const entitlementResult = await supabase
        .from("software_entitlements")
        .select("id, license_id")
        .eq("id", entitlementId)
        .maybeSingle();

      if (entitlementResult.error) throw new Error(`Unable to load entitlement: ${entitlementResult.error.message}`);
      if (!entitlementResult.data) {
        res.status(404).json({ error: "Software entitlement was not found." });
        return;
      }

      const licenseResult = await supabase
        .from("licenses")
        .select("status")
        .eq("id", entitlementResult.data.license_id)
        .maybeSingle();

      if (licenseResult.error) throw new Error(`Unable to load license: ${licenseResult.error.message}`);
      if (enabled && licenseResult.data?.status !== "active") {
        res.status(409).json({ error: "Reactivate the license before enabling downloads." });
        return;
      }

      const update = await supabase
        .from("software_entitlements")
        .update({ download_enabled: enabled })
        .eq("id", entitlementId);

      if (update.error) throw new Error(`Unable to update download access: ${update.error.message}`);

      if (!enabled) {
        const revoke = await supabase
          .from("store_download_links")
          .update({ revoked_at: new Date().toISOString() })
          .eq("entitlement_id", entitlementId)
          .is("revoked_at", null);
        if (revoke.error) throw new Error(`Unable to revoke existing download links: ${revoke.error.message}`);
      }

      res.status(200).json({ enabled });
      return;
    }

    if (action === "generate-link") {
      const entitlementId = text(req.body?.entitlementId);
      const ttlMinutes = safeTtlMinutes(req.body?.ttlMinutes);
      const maxUses = safeMaxUses(req.body?.maxUses);
      const note = text(req.body?.note) || null;

      if (!entitlementId) {
        res.status(400).json({ error: "Software entitlement is required." });
        return;
      }

      const entitlementResult = await supabase
        .from("software_entitlements")
        .select("id, auth_user_id, product_id, license_id, download_enabled, revoked_at")
        .eq("id", entitlementId)
        .maybeSingle();

      if (entitlementResult.error) throw new Error(`Unable to load entitlement: ${entitlementResult.error.message}`);
      const entitlement = entitlementResult.data;
      if (!entitlement) {
        res.status(404).json({ error: "Software entitlement was not found." });
        return;
      }
      if (!entitlement.download_enabled || entitlement.revoked_at) {
        res.status(409).json({ error: "Downloads are disabled for this license." });
        return;
      }

      const licenseResult = await supabase
        .from("licenses")
        .select("status")
        .eq("id", entitlement.license_id)
        .maybeSingle();

      if (licenseResult.error) throw new Error(`Unable to load license: ${licenseResult.error.message}`);
      if (licenseResult.data?.status !== "active") {
        res.status(409).json({ error: "Only active licenses can generate download links." });
        return;
      }

      const userResult = await supabase
        .from("platform_users")
        .select("email")
        .eq("auth_user_id", entitlement.auth_user_id)
        .maybeSingle();

      if (userResult.error) throw new Error(`Unable to load user: ${userResult.error.message}`);

      const rawToken = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

      const insert = await supabase
        .from("store_download_links")
        .insert({
          token_hash: hashToken(rawToken),
          product_id: entitlement.product_id,
          entitlement_id: entitlement.id,
          license_id: entitlement.license_id,
          source: "admin_recovery",
          max_uses: maxUses,
          expires_at: expiresAt,
          recipient_email: userResult.data?.email ?? null,
          note,
          created_by: actor.id,
        });

      if (insert.error) throw new Error(`Unable to create download link: ${insert.error.message}`);

      res.status(200).json({
        url: `${storePublicUrl()}/api/download?token=${encodeURIComponent(rawToken)}`,
        expiresAt,
      });
      return;
    }

    if (action === "delete-license") {
      const entitlementId = text(req.body?.entitlementId);

      if (!entitlementId) {
        res.status(400).json({ error: "Entitlement ID is required." });
        return;
      }

      const { data, error } = await supabase.rpc("admin_delete_software_license", {
        p_entitlement_id: entitlementId,
        p_actor_user_id: actor.id,
      });

      if (error) {
        const message = error.message || "Unable to delete software license.";
        if (message.includes("Only revoked licenses can be permanently deleted")) {
          res.status(409).json({ error: message });
          return;
        }
        throw new Error(`Unable to delete software license: ${message}`);
      }

      res.status(200).json({ deleted: Boolean((data as Record<string, unknown>)?.deleted ?? true) });
      return;
    }

    if (action === "revoke-link") {
      const linkId = text(req.body?.linkId);
      if (!linkId) {
        res.status(400).json({ error: "Download link ID is required." });
        return;
      }

      const update = await supabase
        .from("store_download_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", linkId);

      if (update.error) throw new Error(`Unable to revoke download link: ${update.error.message}`);
      res.status(200).json({ revoked: true });
      return;
    }

    res.status(400).json({ error: "Unknown software licensing action." });
  } catch (error) {
    console.error("Software licensing admin error:", error);
    const message = error instanceof Error ? error.message : "Unable to manage software licenses.";
    if (message === "AUTH_REQUIRED") {
      res.status(401).json({ error: "Sign in to Platform." });
      return;
    }
    if (message === "ADMIN_REQUIRED") {
      res.status(403).json({ error: "Platform administrator access is required." });
      return;
    }
    res.status(500).json({ error: message });
  }
}
