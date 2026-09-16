export type LicenseStatus = "active" | "suspended" | "revoked";

export type SoftwareProduct = {
  id: string;
  name: string;
  slug: string;
  currentVersion: string | null;
};

export type LicenseUser = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string | null;
};

export type SoftwareLicense = {
  entitlementId: string;
  licenseId: string;
  licenseKey: string;
  authUserId: string;
  userEmail: string;
  userDisplayName: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  status: LicenseStatus;
  downloadEnabled: boolean;
  source: string;
  grantedAt: string;
  revokedAt: string | null;
};

export type DownloadLinkRecord = {
  id: string;
  productId: string;
  productName: string;
  licenseId: string | null;
  recipientEmail: string | null;
  maxUses: number | null;
  useCount: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  note: string | null;
};

export type SoftwareLicensingSnapshot = {
  products: SoftwareProduct[];
  users: LicenseUser[];
  licenses: SoftwareLicense[];
  downloadLinks: DownloadLinkRecord[];
};
