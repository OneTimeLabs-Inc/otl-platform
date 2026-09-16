import type { User } from "@supabase/supabase-js";
import {
  getSupabaseAdmin,
  getSupabaseAuthClient,
} from "./supabaseAdmin.js";

/* ==========================================================
   PLATFORM API 002
   Request authentication
   ========================================================== */

export async function requireUser(
  authorizationHeader: string | string[] | undefined,
): Promise<User> {
  const header = Array.isArray(authorizationHeader)
    ? authorizationHeader[0]
    : authorizationHeader ?? "";

  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data, error } =
    await getSupabaseAuthClient().auth.getUser(match[1]);

  if (error) {
    console.error("PLATFORM AUTH VALIDATION ERROR:", {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });
  }

  if (error || !data.user) {
    throw new Error("AUTH_REQUIRED");
  }

  return data.user;
}

export async function requirePlatformAdmin(
  authorizationHeader: string | string[] | undefined,
): Promise<User> {
  const user =
    await requireUser(authorizationHeader);

  const { data, error } =
    await getSupabaseAdmin()
      .from("platform_users")
      .select("id, active, is_platform_owner, is_platform_admin")
      .eq("auth_user_id", user.id)
      .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to verify Platform administrator: ${error.message}`,
    );
  }

  if (
    !data ||
    !data.active ||
    (!data.is_platform_owner && !data.is_platform_admin)
  ) {
    throw new Error("ADMIN_REQUIRED");
  }

  return user;
}
