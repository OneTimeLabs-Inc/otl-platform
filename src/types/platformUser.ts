/* ==========================================================
   PLATFORM USER 001
   Platform user model
   ========================================================== */

export interface PlatformUser {

  id: string;

  auth_user_id: string;

  email: string;

  display_name: string | null;

  avatar_url: string | null;

  active: boolean;

  is_platform_owner: boolean;

  is_platform_admin: boolean;

  is_employee: boolean;

  last_login_at: string | null;

  created_at: string;

  updated_at: string;

  organization_id: string | null;

  organization_name: string | null;

  organization_role: string | null;

}