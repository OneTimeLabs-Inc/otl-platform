import { supabase } from "../lib/supabase";
import { apiError, readJson } from "./apiResponse";
import type {
  SellerApplication,
  SellerApplicationStatus,
} from "../types/sellerApplication";

/* ==========================================================
   SELLER APPLICATIONS 001
   Authenticated API helper
   ========================================================== */

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  if (!token) {
    throw new Error("Sign in to continue.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getMySellerApplication():
  Promise<SellerApplication | null> {
  const response = await fetch(
    "/api/seller-application",
    {
      headers: await authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await apiError(response, response.url.includes("/api/admin/") ? "/api/admin/seller-applications" : "/api/seller-application"),
    );
  }

  const body = await readJson<{ application: SellerApplication | null }>(response, "/api/seller-application");

  return body.application;
}

export async function submitSellerApplication(input: {
  displayName: string;
  slug: string;
  sellingDescription: string;
}): Promise<SellerApplication> {
  const response = await fetch(
    "/api/seller-application",
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(
      await apiError(response, response.url.includes("/api/admin/") ? "/api/admin/seller-applications" : "/api/seller-application"),
    );
  }

  const body = await readJson<{ application: SellerApplication }>(response, response.url.includes("/api/admin/") ? "/api/admin/seller-applications" : "/api/seller-application");

  return body.application;
}

/* ==========================================================
   SELLER APPLICATIONS 003
   Platform administrator review
   ========================================================== */

export async function getSellerApplications():
  Promise<SellerApplication[]> {
  const response = await fetch(
    "/api/admin/seller-applications",
    {
      headers: await authHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await apiError(response, response.url.includes("/api/admin/") ? "/api/admin/seller-applications" : "/api/seller-application"),
    );
  }

  const body = await readJson<{ applications: SellerApplication[] }>(response, "/api/admin/seller-applications");

  return body.applications;
}

export async function reviewSellerApplication(
  applicationId: string,
  status: Exclude<SellerApplicationStatus, "pending">,
): Promise<SellerApplication> {
  const response = await fetch(
    "/api/admin/seller-applications",
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({
        applicationId,
        status,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await apiError(response, response.url.includes("/api/admin/") ? "/api/admin/seller-applications" : "/api/seller-application"),
    );
  }

  const body = await readJson<{ application: SellerApplication }>(response, response.url.includes("/api/admin/") ? "/api/admin/seller-applications" : "/api/seller-application");

  return body.application;
}
