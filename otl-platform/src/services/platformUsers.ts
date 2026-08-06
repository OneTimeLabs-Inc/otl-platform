import { supabase } from "../lib/supabase";

import type { PlatformUser } from "../types/platformUser";

/* ==========================================================
   PLATFORM USERS 001
   Load all platform users
   ========================================================== */

export async function getPlatformUsers(): Promise<PlatformUser[]> {
  const { data, error } = await supabase
    .from("platform_users")
    .select(`
      id,
      auth_user_id,
      email,
      display_name,
      avatar_url,
      active,
      is_platform_admin,
      is_employee,
      last_login_at,
      created_at,
      updated_at,
organization_members!fk_organization_members_platform_user (
  organizations (
    id,
    name
  ),
  platform_roles!organization_members_role_id_fkey (
    code,
    display_name
  )
)
    `)
    .order("display_name", {
      ascending: true,
    });

  console.log(
  "RAW PLATFORM USERS:",
  JSON.stringify(data, null, 2),
);

  if (error) {
    throw new Error(
      `Unable to load Platform users: ${error.message}`,
    );
  }


  return (data ?? []).map((user) => {

    const membership = Array.isArray(
  user.organization_members,
)
  ? user.organization_members[0]
  : user.organization_members;

const organization =
  Array.isArray(
    membership?.organizations,
  )
    ? membership.organizations[0]
    : membership?.organizations;


const role =
  Array.isArray(
    membership?.platform_roles,
  )
    ? membership.platform_roles[0]
    : membership?.platform_roles;

    return {
      id: user.id,
      auth_user_id: user.auth_user_id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      active: user.active,
      is_platform_admin: user.is_platform_admin,
      is_employee: user.is_employee,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,

organization_id:
  organization?.id ?? null,

organization_name:
  organization?.name ?? null,

organization_role:
  role?.display_name ??
  role?.code ??
  null,
    };
  });
}

/* ==========================================================
   PLATFORM USERS 002
   Get current platform user
   ========================================================== */

export async function getCurrentPlatformUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("platform_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return data;
}

/* ==========================================================
   PLATFORM USERS 003
   Provision authenticated user
   ========================================================== */

export async function provisionPlatformUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const existing =
    await getCurrentPlatformUser();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("platform_users")
    .insert({
      auth_user_id: user.id,
      email: user.email,
      display_name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email,
      avatar_url:
        user.user_metadata?.avatar_url ??
        null,
      active: true,
      is_employee: false,
      is_platform_admin: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Unable to provision platform user: ${error.message}`,
    );
  }

  return data;
}

/* ==========================================================
   PLATFORM USERS 004
   Assign user to organization
   ========================================================== */

export async function assignUserToOrganization(
  platformUserId: string,
  organizationId: string,
  roleId: string,
) {

  /*
    Check existing user membership
  */

  const {
    data: existingMembership,
    error: lookupError,
  } = await supabase
    .from("organization_members")
    .select("id")
    .eq(
      "platform_user_id",
      platformUserId,
    )
    .maybeSingle();


  if (lookupError) {
    throw new Error(
      `Unable to check organization membership: ${lookupError.message}`,
    );
  }



  /*
    Update existing organization assignment
  */

  if (existingMembership) {

    const {
      error,
    } = await supabase
      .from("organization_members")
      .update({
        organization_id:
          organizationId,

        role_id:
          roleId,

        status:
          "active",

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        existingMembership.id,
      );


    if (error) {
      throw new Error(
        `Unable to update organization membership: ${error.message}`,
      );
    }


    return;

  }



  /*
    Create new membership
  */

  const {
    error,
  } = await supabase
    .from("organization_members")
    .insert({

      platform_user_id:
        platformUserId,

      organization_id:
        organizationId,

      role_id:
        roleId,

      status:
        "active",

      joined_at:
        new Date().toISOString(),

    });


  if (error) {
    throw new Error(
      `Unable to assign organization membership: ${error.message}`,
    );
  }

}