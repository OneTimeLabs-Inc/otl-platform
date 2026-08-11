import {
  supabase,
} from "../lib/supabase";

import type {
  PlatformUser,
} from "../types/platformUser";


/* ==========================================================
   PLATFORM USERS 001
   Load all platform users
   ========================================================== */

export async function getPlatformUsers():
  Promise<PlatformUser[]> {

  const {
    data,
    error,
  } =
    await supabase
      .from("platform_users")
      .select(`
        id,
        auth_user_id,
        email,
        display_name,
        avatar_url,
        active,
        is_platform_owner,
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
      .order(
        "display_name",
        {
          ascending: true,
        },
      );


  if (error) {

    throw new Error(
      `Unable to load Platform users: ${error.message}`,
    );

  }


  return (data ?? []).map(
    (user) => {

      const membership =
        Array.isArray(
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

        id:
          user.id,

        auth_user_id:
          user.auth_user_id,

        email:
          user.email,

        display_name:
          user.display_name,

        avatar_url:
          user.avatar_url,

        active:
          user.active,

        is_platform_owner:
          user.is_platform_owner,

        is_platform_admin:
          user.is_platform_admin,

        is_employee:
          user.is_employee,

        last_login_at:
          user.last_login_at,

        created_at:
          user.created_at,

        updated_at:
          user.updated_at,

        organization_id:
          organization?.id ?? null,

        organization_name:
          organization?.name ?? null,

        organization_role:
          role?.display_name ??
          role?.code ??
          null,

      };

    },
  );

}


/* ==========================================================
   PLATFORM USERS 002
   Get current platform user
   ========================================================== */

export async function getCurrentPlatformUser():
  Promise<PlatformUser | null> {

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();


  if (!user) {

    return null;

  }


  const {
    data,
    error,
  } =
    await supabase
      .from("platform_users")
      .select(`
        id,
        auth_user_id,
        email,
        display_name,
        avatar_url,
        active,
        is_platform_owner,
        is_platform_admin,
        is_employee,
        last_login_at,
        created_at,
        updated_at
      `)
      .eq(
        "auth_user_id",
        user.id,
      )
      .maybeSingle();


  if (error) {

    throw new Error(
      `Unable to load current Platform user: ${error.message}`,
    );

  }


  if (!data) {

    return null;

  }


  return {

    ...data,

    organization_id:
      null,

    organization_name:
      null,

    organization_role:
      null,

  };

}


/* ==========================================================
   PLATFORM USERS 003
   Provision authenticated user
   ========================================================== */

export async function provisionPlatformUser() {

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();


  if (!user) {

    return null;

  }


  const existing =
    await getCurrentPlatformUser();


  if (existing) {

    return existing;

  }


  const {
    data,
    error,
  } =
    await supabase
      .from("platform_users")
      .insert({

        auth_user_id:
          user.id,

        email:
          user.email,

        display_name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email,

        avatar_url:
          user.user_metadata?.avatar_url ??
          null,

        active:
          true,

        is_employee:
          false,

        is_platform_admin:
          false,

        is_platform_owner:
          false,

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

  const {
    data: targetUser,
    error: targetError,
  } =
    await supabase
      .from("platform_users")
      .select(`
        id,
        is_platform_owner
      `)
      .eq(
        "id",
        platformUserId,
      )
      .single();


  if (targetError) {

    throw new Error(
      `Unable to load target Platform user: ${targetError.message}`,
    );

  }


  if (
    targetUser.is_platform_owner
  ) {

    throw new Error(
      "The Platform Owner cannot be modified through Platform.",
    );

  }


  const {
    data: existingMembership,
    error: lookupError,
  } =
    await supabase
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


  if (existingMembership) {

    const {
      error,
    } =
      await supabase
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


  const {
    error,
  } =
    await supabase
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


/* ==========================================================
   PLATFORM USERS 005
   Unassign user from organization
   ========================================================== */

export async function unassignUserFromOrganization(
  platformUserId: string,
) {

  const {
    data: targetUser,
    error: targetError,
  } =
    await supabase
      .from("platform_users")
      .select(`
        id,
        is_platform_owner
      `)
      .eq(
        "id",
        platformUserId,
      )
      .single();


  if (targetError) {

    throw new Error(
      `Unable to load target Platform user: ${targetError.message}`,
    );

  }


  if (
    targetUser.is_platform_owner
  ) {

    throw new Error(
      "The Platform Owner cannot be modified through Platform.",
    );

  }


  const {
    error,
  } =
    await supabase
      .from("organization_members")
      .delete()
      .eq(
        "platform_user_id",
        platformUserId,
      );


  if (error) {

    throw new Error(
      `Unable to unassign organization membership: ${error.message}`,
    );

  }

}


/* ==========================================================
   PLATFORM USERS 006
   Count platform administrators
   ========================================================== */

export async function getPlatformAdminCount():
  Promise<number> {

  const {
    count,
    error,
  } =
    await supabase
      .from("platform_users")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        },
      )
      .eq(
        "is_platform_admin",
        true,
      )
      .eq(
        "active",
        true,
      );


  if (error) {

    throw new Error(
      `Unable to count Platform Administrators: ${error.message}`,
    );

  }


  return count ?? 0;

}


/* ==========================================================
   PLATFORM USERS 007
   Grant platform administrator
   ========================================================== */

export async function grantPlatformAdmin(
  platformUserId: string,
) {

  const currentUser =
    await getCurrentPlatformUser();


  if (
    !currentUser ||
    !currentUser.is_platform_admin
  ) {

    throw new Error(
      "Only a Platform Administrator can grant Platform Administrator access.",
    );

  }


  const {
    data: targetUser,
    error: targetError,
  } =
    await supabase
      .from("platform_users")
      .select(`
        id,
        is_platform_owner
      `)
      .eq(
        "id",
        platformUserId,
      )
      .single();


  if (targetError) {

    throw new Error(
      `Unable to load target Platform user: ${targetError.message}`,
    );

  }


  if (
    targetUser.is_platform_owner
  ) {

    throw new Error(
      "The Platform Owner cannot be modified through Platform.",
    );

  }


  const {
    error,
  } =
    await supabase
      .from("platform_users")
      .update({

        is_platform_admin:
          true,

        updated_at:
          new Date().toISOString(),

      })
      .eq(
        "id",
        platformUserId,
      );


  if (error) {

    throw new Error(
      `Unable to grant Platform Administrator access: ${error.message}`,
    );

  }

}


/* ==========================================================
   PLATFORM USERS 008
   Revoke platform administrator
   ========================================================== */

export async function revokePlatformAdmin(
  platformUserId: string,
) {

  const currentUser =
    await getCurrentPlatformUser();


  if (
    !currentUser ||
    !currentUser.is_platform_admin
  ) {

    throw new Error(
      "Only a Platform Administrator can revoke Platform Administrator access.",
    );

  }


  if (
    currentUser.id ===
    platformUserId
  ) {

    throw new Error(
      "You cannot revoke your own Platform Administrator access.",
    );

  }


  const {
    data: targetUser,
    error: targetError,
  } =
    await supabase
      .from("platform_users")
      .select(`
        id,
        is_platform_owner
      `)
      .eq(
        "id",
        platformUserId,
      )
      .single();


  if (targetError) {

    throw new Error(
      `Unable to load target Platform user: ${targetError.message}`,
    );

  }


  if (
    targetUser.is_platform_owner
  ) {

    throw new Error(
      "Platform Owner access cannot be revoked through Platform.",
    );

  }


  const adminCount =
    await getPlatformAdminCount();


  if (
    adminCount <= 1
  ) {

    throw new Error(
      "The final Platform Administrator cannot be revoked.",
    );

  }


  const {
    error,
  } =
    await supabase
      .from("platform_users")
      .update({

        is_platform_admin:
          false,

        updated_at:
          new Date().toISOString(),

      })
      .eq(
        "id",
        platformUserId,
      );


  if (error) {

    throw new Error(
      `Unable to revoke Platform Administrator access: ${error.message}`,
    );

  }

}