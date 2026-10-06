import { supabase } from "../lib/supabase";
import type {
  MarketplaceAdminSnapshot,
  MarketplaceListingStatus,
  MarketplaceSellerStatus,
} from "../types/marketplaceAdmin";
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

export async function getMarketplaceAdminSnapshot(): Promise<MarketplaceAdminSnapshot> {
  const response = await fetch("/api/admin/marketplace", {
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await apiError(response, "/api/admin/marketplace"));
  }

  return await readJson<MarketplaceAdminSnapshot>(response, "/api/admin/marketplace");
}

async function postAction(body: Record<string, unknown>): Promise<void> {
  const response = await fetch("/api/admin/marketplace", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await apiError(response, "/api/admin/marketplace"));
  }
}

export async function setMarketplaceSellerStatus(
  sellerId: string,
  status: MarketplaceSellerStatus,
): Promise<void> {
  await postAction({
    action: "seller-status",
    sellerId,
    status,
  });
}

export async function setMarketplaceListingStatus(
  listingId: string,
  status: MarketplaceListingStatus,
): Promise<void> {
  await postAction({
    action: "listing-status",
    listingId,
    status,
  });
}
