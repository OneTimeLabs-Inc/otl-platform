import { supabase } from "../lib/supabase";
import type {
  MarketplaceAdminSnapshot,
  MarketplaceListingStatus,
  MarketplaceSellerStatus,
} from "../types/marketplaceAdmin";

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

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error || `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function getMarketplaceAdminSnapshot(): Promise<MarketplaceAdminSnapshot> {
  const response = await fetch("/api/admin/marketplace", {
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return await response.json() as MarketplaceAdminSnapshot;
}

async function postAction(body: Record<string, unknown>): Promise<void> {
  const response = await fetch("/api/admin/marketplace", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
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
