import { supabase } from "../lib/supabase";
import type { BusinessType } from "../types/businessLaunch";
import type { SiteLayout, UploadedLayoutManifest } from "../types/siteLayouts";
import { apiError, readJson } from "./apiResponse";

async function adminHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in to Platform.");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function listSiteLayouts(): Promise<SiteLayout[]> {
  const response = await fetch("/api/admin/site-layouts", { headers: await adminHeaders() });
  if (!response.ok) throw new Error(await apiError(response, "/api/admin/site-layouts"));
  const body = await readJson<{ layouts: SiteLayout[] }>(response, "/api/admin/site-layouts");
  return body.layouts ?? [];
}

export async function uploadSiteLayout(manifest: UploadedLayoutManifest, businessTypes: BusinessType[]): Promise<SiteLayout> {
  const response = await fetch("/api/admin/site-layouts", {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify({ manifest, businessTypes }),
  });
  if (!response.ok) throw new Error(await apiError(response, "/api/admin/site-layouts"));
  const body = await readJson<{ layout: SiteLayout }>(response, "/api/admin/site-layouts");
  return body.layout;
}
