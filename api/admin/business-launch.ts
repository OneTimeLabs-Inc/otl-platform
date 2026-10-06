import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const validTypes = new Set([
  "retail",
  "restaurant_bar",
  "barber_salon",
  "auto_repair",
]);

const validTemplates = new Set(["smb_operations"]);

const validModules = new Set([
  "scheduling", "time_clock", "shift_bids", "open_shifts", "shift_swaps",
  "availability", "pto", "messaging", "tasks", "labor_budget", "appointments",
  "resources", "customers", "work_orders", "inventory", "estimates", "reporting",
]);

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown provisioning error.";
}

function cleanText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanEmail(value: unknown): string {
  const text = cleanText(value, 320).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : "";
}

export default async function handler(req: any, res: any) {
  try {
    const user = await requirePlatformAdmin(req.headers.authorization);
    const db = getSupabaseAdmin();

    if (req.method === "GET") {
      const { data, error } = await db
        .from("platform_business_instances")
        .select("id,business_name,subdomain,path_slug,business_type,application_template,site_layout_code,subdomain_enabled,custom_domain,canonical_url,status,modules,branding,contact,admin_email,public_url,provisioning_error,created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return res.status(200).json({ instances: data ?? [] });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const {
      businessName,
      pathSlug,
      businessType,
      applicationTemplate = "smb_operations",
      siteLayoutCode = "clean-service",
      modules,
      adminEmail,
      dryRun = false,
    } = req.body ?? {};

    if (typeof businessName !== "string" || !businessName.trim()) {
      return res.status(400).json({ error: "Business name is required." });
    }
    if (typeof pathSlug !== "string" || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(pathSlug)) {
      return res.status(400).json({ error: "Invalid path slug." });
    }
    if (!validTypes.has(businessType)) {
      return res.status(400).json({ error: "Unsupported business type." });
    }
    if (!validTemplates.has(applicationTemplate)) {
      return res.status(400).json({ error: "Unsupported application template." });
    }
    if (!Array.isArray(modules) || modules.some(module => !validModules.has(module))) {
      return res.status(400).json({ error: "One or more modules are invalid." });
    }

    const normalizedAdminEmail = cleanEmail(adminEmail);
    if (!normalizedAdminEmail) {
      return res.status(400).json({ error: "A valid initial administrator email is required." });
    }

    const { data: layout, error: layoutError } = await db
      .from("platform_site_layouts")
      .select("code,supported_business_types,active")
      .eq("code", siteLayoutCode)
      .maybeSingle();
    if (layoutError) throw layoutError;
    if (!layout?.active) return res.status(400).json({ error: "Selected site layout is unavailable." });
    if (!Array.isArray(layout.supported_business_types) || !layout.supported_business_types.includes(businessType)) {
      return res.status(400).json({ error: "Selected site layout is not enabled for this business type." });
    }

    const pathUrl = `https://onetimelabs.net/${pathSlug}`;
    const status = dryRun ? "draft" : "provisioning";

    const instanceConfig = {
      application_template: applicationTemplate,
      business_type: businessType,
      site_layout_code: siteLayoutCode,
      routing: {
        permanent_path: `/${pathSlug}`,
        path_url: pathUrl,
        subdomain_enabled: false,
        custom_domain: null,
      },
      default_admin_email: normalizedAdminEmail,
      scheduler: {
        autosave_seconds: 30,
        availability_enforced: true,
        availability_override_allowed: true,
        availability_override_requires_confirmation: true,
        max_shift_hours_warning: 12,
        am_pm_sanity_checks: true,
        overlap_detection: true,
        pre_publish_validation: true,
        labor_budget_configured_by_customer: true,
      },
    };

    const { data: instance, error: insertError } = await db
      .from("platform_business_instances")
      .insert({
        business_name: businessName.trim(),
        // Reserve the same slug for a future subdomain while path routing is active now.
        subdomain: pathSlug,
        path_slug: pathSlug,
        business_type: businessType,
        application_template: applicationTemplate,
        site_layout_code: siteLayoutCode,
        subdomain_enabled: false,
        custom_domain: null,
        canonical_url: pathUrl,
        status,
        modules,
        branding: {},
        contact: {},
        admin_email: normalizedAdminEmail,
        public_url: pathUrl,
        settings: instanceConfig.scheduler,
        instance_config: instanceConfig,
        created_by_auth_user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return res.status(409).json({ error: `The path /${pathSlug} is already reserved.` });
      }
      throw insertError;
    }

    const defaultCopy: Record<string, { headline: string; subheadline: string; about: string; cta: string }> = {
      retail: {
        headline: `${businessName.trim()}, made local.`,
        subheadline: "A neighborhood business with straightforward service, useful products and a team that knows the community.",
        about: `Welcome to ${businessName.trim()}. Update this section from the site admin with the real story, products and customer promise.`,
        cta: "Visit or contact us",
      },
      restaurant_bar: {
        headline: `Make a table at ${businessName.trim()}.`,
        subheadline: "Good food, good people and a place worth coming back to.",
        about: `Tell guests what makes ${businessName.trim()} special — the food, the room, the people and the story behind it.`,
        cta: "Plan your visit",
      },
      barber_salon: {
        headline: `Your next look starts at ${businessName.trim()}.`,
        subheadline: "Professional work, personal service and a portfolio that speaks for itself.",
        about: `Use this space to introduce ${businessName.trim()}, your specialties and the experience clients can expect.`,
        cta: "Book an appointment",
      },
      auto_repair: {
        headline: `Straight answers. Solid work. ${businessName.trim()}.`,
        subheadline: "Clear communication, dependable repairs and service built around getting you safely back on the road.",
        about: `Use this section to explain what ${businessName.trim()} repairs, what you stand behind and why customers trust your shop.`,
        cta: "Request service",
      },
    };
    const copy = defaultCopy[businessType] ?? defaultCopy.retail;

    if (!dryRun) {
      const { error: contentError } = await db
        .from("platform_business_site_content")
        .upsert({
          business_instance_id: instance.id,
          headline: copy.headline,
          subheadline: copy.subheadline,
          about_text: copy.about,
          primary_cta_label: copy.cta,
          primary_cta_href: "#contact",
          contact_email: normalizedAdminEmail,
          services: [],
          testimonials: [],
        });
      if (contentError) throw contentError;

      const { data: readyInstance, error: readyError } = await db
        .from("platform_business_instances")
        .update({ status: "ready", provisioned_at: new Date().toISOString() })
        .eq("id", instance.id)
        .select()
        .single();
      if (readyError) throw readyError;

      await db.from("platform_business_provisioning_events").insert({
        business_instance_id: instance.id,
        event_type: "path_site_provisioned",
        event_detail: {
          pathUrl,
          pathSlug,
          applicationTemplate,
          siteLayoutCode,
          businessType,
          modules,
          subdomainDeferred: true,
        },
        created_by_auth_user_id: user.id,
      });

      Object.assign(instance, readyInstance);
    }

    const steps = [
      { key: "tenant", label: "Create SMB instance", status: "done" as const, detail: instance.id },
      { key: "layout", label: "Apply site design", status: "done" as const, detail: siteLayoutCode },
      { key: "path", label: "Publish permanent OTL path", status: dryRun ? "skipped" as const : "done" as const, detail: pathUrl },
      { key: "subdomain", label: "Reserve matching future subdomain slug", status: "done" as const, detail: `${pathSlug}.onetimelabs.net` },
      { key: "dns", label: "Joker DNS", status: "skipped" as const, detail: "Deferred until reseller API access is approved." },
      { key: "seed", label: "Seed business configuration", status: "done" as const, detail: `${modules.length} modules enabled; admin ${normalizedAdminEmail}` },
    ];

    return res.status(200).json({ instance, steps });
  } catch (error) {
    const message = safeError(error);
    if (message === "AUTH_REQUIRED") return res.status(401).json({ error: "Sign in to Platform." });
    if (message === "ADMIN_REQUIRED") return res.status(403).json({ error: "Platform administrator access required." });
    return res.status(500).json({ error: message });
  }
}
