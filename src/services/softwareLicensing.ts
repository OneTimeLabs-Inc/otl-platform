import { supabase } from "../lib/supabase";
import type {
  LicenseStatus,
  SoftwareLicensingSnapshot,
} from "../types/softwareLicensing";
import { apiError, readJson } from "./apiResponse";

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sign in to Platform.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function getSoftwareLicensingSnapshot(): Promise<SoftwareLicensingSnapshot> {
  const response = await fetch("/api/admin/software-licenses", {
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await apiError(response, "/api/admin/software-licenses"));
  }

  return await readJson<SoftwareLicensingSnapshot>(response, "/api/admin/software-licenses");
}

async function postAction<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/admin/software-licenses", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await apiError(response, "/api/admin/software-licenses"));
  }

  return await readJson<T>(response, "/api/admin/software-licenses");
}

export async function assignPerpetualLicense(input: {
  authUserId: string;
  productId: string;
  note?: string;
}) {
  return await postAction<{ licenseId: string; licenseKey: string; existing: boolean }>({
    action: "assign",
    ...input,
  });
}

export async function setLicenseStatus(input: {
  licenseId: string;
  status: LicenseStatus;
  reason?: string;
}) {
  return await postAction<{ status: LicenseStatus }>({
    action: "status",
    ...input,
  });
}

export async function setDownloadAccess(input: {
  entitlementId: string;
  enabled: boolean;
}) {
  return await postAction<{ enabled: boolean }>({
    action: "download-access",
    ...input,
  });
}

export async function generateTemporaryDownloadLink(input: {
  entitlementId: string;
  maxUses: number | null;
  ttlMinutes: number;
  note?: string;
}) {
  return await postAction<{ url: string; expiresAt: string }>({
    action: "generate-link",
    ...input,
  });
}

export async function revokeTemporaryDownloadLink(linkId: string) {
  return await postAction<{ revoked: true }>({
    action: "revoke-link",
    linkId,
  });
}

export async function deleteSoftwareLicense(entitlementId: string) {
  return await postAction<{ deleted: true }>({
    action: "delete-license",
    entitlementId,
  });
}
