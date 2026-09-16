import { supabase } from "../lib/supabase";
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

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error || `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

/* ==========================================================
   SELLER APPLICATIONS 002
   Current applicant
   ========================================================== */

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
      await readError(response),
    );
  }

  const body = await response.json() as {
    application: SellerApplication | null;
  };

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
      await readError(response),
    );
  }

  const body = await response.json() as {
    application: SellerApplication;
  };

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
      await readError(response),
    );
  }

  const body = await response.json() as {
    applications: SellerApplication[];
  };

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
      await readError(response),
    );
  }

  const body = await response.json() as {
    application: SellerApplication;
  };

  return body.application;
}
