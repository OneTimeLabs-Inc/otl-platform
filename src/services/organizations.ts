import { supabase } from "../lib/supabase";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
};

async function platformAdminHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Sign in to Platform.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function readPlatformApiError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error || `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function getMyOrganization() {
  console.log("Step 1");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("User:", user?.id);

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // Step 1: Find the Platform User
  // ----------------------------------------------------------

const {
  data: platformUser,
  error: userError,
} = await supabase
  .from("platform_users")
  .select("*")
  .eq("auth_user_id", user.id)
  .maybeSingle();

console.log("Platform User:", platformUser);
console.log("Platform User Error:", userError);

if (
  userError &&
  userError.code !== "PGRST116"
) {
  throw userError;
}

if (!platformUser) {
  return null;
}

  // ----------------------------------------------------------
  // Step 2: Find Organization Membership
  // ----------------------------------------------------------

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("organization_members")
    .select("*")
    .eq("platform_user_id", platformUser.id);

  console.log("Membership:", membership);
  console.log("Membership Error:", membershipError);

  if (membershipError || !membership || membership.length === 0) {
    return null;
  }

  // ----------------------------------------------------------
  // Step 3: Load Organization
  // ----------------------------------------------------------

  const {
    data: organization,
    error: organizationError,
  } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", membership[0].organization_id)
    .single();

  console.log("Organization:", organization);
  console.log("Organization Error:", organizationError);

  if (organizationError || !organization) {
    return null;
  }

  return organization as Organization;
}

/* ==========================================================
   ORGANIZATIONS 001
   Load organizations for administration
   ========================================================== */

export async function getOrganizations(): Promise<
  Organization[]
> {

  const {
    data,
    error,
  } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      active,
      customer_id,
      created_at,
      updated_at
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



/* ==========================================================
   ORGANIZATIONS 002
   Create organization
   ========================================================== */

export async function createOrganization(
  name: string,
  slug: string,
  initializeWorkspace: boolean,
): Promise<Organization> {


  const {
  data: {
    user,
  },
} = await supabase.auth.getUser();


if (!user) {
  throw new Error(
    "Unable to determine current user.",
  );
}


const {
  data: platformUser,
  error: platformUserError,
} = await supabase
  .from("platform_users")
  .select("id")
  .eq(
    "auth_user_id",
    user.id,
  )
  .single();


if (platformUserError || !platformUser) {
  throw new Error(
    "Unable to determine platform user.",
  );
}


  const {
    data,
    error,
  } = await supabase
    .from("organizations")
.insert({
  name,
  slug,
  active: true,
})
    .select()
    .single();



  if (error) {
    throw new Error(
      `Unable to create organization: ${error.message}`,
    );
  }



if (initializeWorkspace) {

  console.log(
    "Creating OTLES workspace:",
    {
      organization_id: data.id,
      name: `${data.name}'s Workspace`,
      slug: data.slug,
    },
  );


  const {
    error: workspaceError,
  } = await supabase
    .from("otles_workspaces")
.insert({
  organization_id: data.id,
  name: `${data.name}'s Workspace`,
  slug: data.slug,
  created_by_user_id: platformUser.id,
});


  console.log(
    "Workspace creation error:",
    workspaceError,
  );


  if (workspaceError) {
    throw new Error(
      `Unable to create OTLES workspace: ${workspaceError.message}`,
    );
  }

}



  return data;
}



/* ==========================================================
   ORGANIZATIONS 003
   Update organization
   ========================================================== */

export async function updateOrganization(
  id: string,
  updates: Partial<Organization>,
): Promise<Organization> {
  const response = await fetch(
    "/api/admin/organizations",
    {
      method: "PATCH",
      headers: await platformAdminHeaders(),
      body: JSON.stringify({
        id,
        name: updates.name,
        slug: updates.slug,
        active: updates.active,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await readPlatformApiError(response));
  }

  const body = await response.json() as { organization: Organization };
  return body.organization;
}

/* ==========================================================
   ORGANIZATIONS 004
   Delete organization
   ========================================================== */

export async function deleteOrganization(
  id: string,
): Promise<void> {
  const response = await fetch(
    "/api/admin/organizations",
    {
      method: "DELETE",
      headers: await platformAdminHeaders(),
      body: JSON.stringify({ id }),
    },
  );

  if (!response.ok) {
    throw new Error(await readPlatformApiError(response));
  }
}
