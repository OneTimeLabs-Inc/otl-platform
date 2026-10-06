import { requirePlatformAdmin } from "../_lib/auth.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const validBusinessTypes = new Set(["retail", "restaurant_bar", "barber_salon", "auto_repair"]);

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown layout error.";
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function cleanConfig(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const config: Record<string, unknown> = {};
  if (source.palette && typeof source.palette === "object" && !Array.isArray(source.palette)) {
    const palette = source.palette as Record<string, unknown>;
    const allowed = ["background", "surface", "text", "muted", "accent", "accent2"];
    config.palette = Object.fromEntries(allowed.flatMap(key => {
      const v = cleanText(palette[key], 32);
      return /^#[0-9a-f]{6}$/i.test(v) ? [[key, v]] : [];
    }));
  }
  for (const key of ["hero", "cards", "nav", "radius", "font"]) {
    const v = cleanText(source[key], 40);
    if (v) config[key] = v;
  }
  return config;
}

export default async function handler(req: any, res: any) {
  try {
    await requirePlatformAdmin(req.headers.authorization);
    const db = getSupabaseAdmin();

    if (req.method === "GET") {
      const { data, error } = await db
        .from("platform_site_layouts")
        .select("id,code,name,description,style_key,supported_business_types,config,preview_image_url,is_system,active")
        .eq("active", true)
        .order("is_system", { ascending: false })
        .order("name");
      if (error) throw error;
      return res.status(200).json({ layouts: data ?? [] });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const manifest = req.body?.manifest;
    const businessTypes = Array.isArray(req.body?.businessTypes) ? req.body.businessTypes : [];
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      return res.status(400).json({ error: "A layout manifest is required." });
    }

    const name = cleanText(manifest.name, 120);
    if (!name) return res.status(400).json({ error: "Layout name is required." });

    const types = businessTypes.filter((item: unknown) => typeof item === "string" && validBusinessTypes.has(item));
    if (!types.length) return res.status(400).json({ error: "Choose at least one supported business type." });

    const baseCode = slugify(cleanText(manifest.code, 60) || name);
    if (!baseCode) return res.status(400).json({ error: "Layout code is invalid." });
    const code = `custom-${baseCode.replace(/^custom-/, "")}`;
    const description = cleanText(manifest.description, 600);
    const styleKey = cleanText(manifest.styleKey, 60) || "custom-manifest";
    const previewImageUrl = cleanText(manifest.previewImageUrl, 1000) || null;
    const config = cleanConfig(manifest.config);

    const { data, error } = await db
      .from("platform_site_layouts")
      .insert({
        code,
        name,
        description,
        style_key: styleKey,
        supported_business_types: types,
        config,
        preview_image_url: previewImageUrl,
        is_system: false,
        active: true,
      })
      .select("id,code,name,description,style_key,supported_business_types,config,preview_image_url,is_system,active")
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: `A layout named ${code} already exists.` });
      throw error;
    }
    return res.status(201).json({ layout: data });
  } catch (error) {
    const message = safeError(error);
    if (message === "AUTH_REQUIRED") return res.status(401).json({ error: "Sign in to Platform." });
    if (message === "ADMIN_REQUIRED") return res.status(403).json({ error: "Platform administrator access required." });
    return res.status(500).json({ error: message });
  }
}
