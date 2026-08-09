import { supabase } from "../lib/supabase";


export type OtlesWorkspace = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
};



/* ==========================================================
   WORKSPACES 001
   Get workspace by organization
   ========================================================== */

export async function getWorkspaceForOrganization(
  organizationId: string,
): Promise<OtlesWorkspace | null> {

  const {
    data,
    error,
  } = await supabase
    .from("otles_workspaces")
    .select(`
      id,
      organization_id,
      name,
      slug,
      created_by_user_id,
      created_at,
      updated_at
    `)
    .eq(
      "organization_id",
      organizationId,
    )
    .maybeSingle();


  if (error) {

    throw new Error(
      `Unable to load workspace: ${error.message}`,
    );

  }


  return data;

}



/* ==========================================================
   WORKSPACES 002
   Initialize workspace
   ========================================================== */

export async function initializeWorkspaceForOrganization(
  organizationId: string,
): Promise<OtlesWorkspace> {


  // Check if workspace already exists

  const existing =
    await getWorkspaceForOrganization(
      organizationId,
    );


  if (existing) {

    return existing;

  }



  // Get current platform user

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();



  if (!user) {

    throw new Error(
      "Unable to determine current user.",
    );

  }



  const {
    data: platformUser,
    error: platformUserError,
  } =
    await supabase
      .from("platform_users")
      .select("id")
      .eq(
        "auth_user_id",
        user.id,
      )
      .single();



  if (
    platformUserError ||
    !platformUser
  ) {

    throw new Error(
      "Unable to determine platform user.",
    );

  }



  // Get organization name

  const {
    data: organization,
    error: organizationError,
  } =
    await supabase
      .from("organizations")
      .select(`
        id,
        name,
        slug
      `)
      .eq(
        "id",
        organizationId,
      )
      .single();



  if (
    organizationError ||
    !organization
  ) {

    throw new Error(
      "Unable to load organization.",
    );

  }


  const {
    data: workspace,
    error: workspaceError,
  } =
    await supabase
      .from("otles_workspaces")
      .insert({
        organization_id:
          organization.id,

        name:
          `${organization.name}'s Workspace`,

        slug:
          organization.slug,

        created_by_user_id:
          platformUser.id,
      })
      .select()
      .single();



  if (workspaceError) {

    throw new Error(
      `Unable to create workspace: ${workspaceError.message}`,
    );

  }



  return workspace;

}