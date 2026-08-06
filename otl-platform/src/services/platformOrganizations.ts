import { supabase } from "../lib/supabase";

export type PlatformOrganization = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};


/* ==========================================================
   PLATFORM ORGANIZATIONS 001
   Load organizations for administration
   ========================================================== */

export async function getPlatformOrganizations(): Promise<
  PlatformOrganization[]
> {
  const { data, error } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      active
    `)
    .eq("active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Unable to load organizations: ${error.message}`,
    );
  }

  return data ?? [];
}