export type BusinessType =
  | "retail"
  | "restaurant_bar"
  | "barber_salon"
  | "auto_repair";

export type ApplicationTemplate = "smb_operations";

export type LaunchModule =
  | "scheduling"
  | "time_clock"
  | "shift_bids"
  | "open_shifts"
  | "shift_swaps"
  | "availability"
  | "pto"
  | "messaging"
  | "tasks"
  | "labor_budget"
  | "appointments"
  | "resources"
  | "customers"
  | "work_orders"
  | "inventory"
  | "estimates"
  | "reporting";

export type BusinessLaunchRequest = {
  businessName: string;
  pathSlug: string;
  businessType: BusinessType;
  applicationTemplate: ApplicationTemplate;
  siteLayoutCode: string;
  modules: LaunchModule[];
  adminEmail: string;
  dryRun?: boolean;
};

export type BusinessInstance = {
  id: string;
  business_name: string;
  subdomain: string;
  path_slug: string | null;
  business_type: BusinessType;
  application_template: ApplicationTemplate;
  site_layout_code: string | null;
  subdomain_enabled: boolean;
  custom_domain: string | null;
  canonical_url: string | null;
  status: "draft" | "provisioning" | "ready" | "failed";
  modules: LaunchModule[];
  branding: Record<string, unknown>;
  contact: Record<string, unknown>;
  admin_email: string | null;
  public_url: string | null;
  provisioning_error: string | null;
  created_at: string;
};

export type LaunchResponse = {
  instance: BusinessInstance;
  steps: Array<{
    key: string;
    label: string;
    status: "done" | "skipped" | "pending" | "failed";
    detail?: string;
  }>;
};
