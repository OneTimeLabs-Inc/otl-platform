import { supabase } from "../lib/supabase";

export type PlatformRole = {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
  sort_order: number;
};


/* ==========================================================
   PLATFORM ROLES 001
   Load roles for organization assignment
   ========================================================== */

export async function getPlatformRoles(): Promise<
  PlatformRole[]
> {
  const { data, error } = await supabase
    .from("platform_roles")
    .select(`
      id,
      code,
      display_name,
      description,
      sort_order
    `)
    .order("sort_order", {
      ascending: true,
    });


  console.log(
    "Platform Roles:",
    data,
  );


  console.log(
    "Platform Roles Error:",
    error,
  );


  if (error) {
    throw new Error(
      `Unable to load platform roles: ${error.message}`,
    );
  }

  return data ?? [];
}