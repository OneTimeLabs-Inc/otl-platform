export type MarketplaceSellerStatus = "pending" | "approved" | "suspended";
export type MarketplaceListingStatus = "draft" | "published" | "sold_out" | "archived";

export type MarketplaceSeller = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
  slug: string;
  status: MarketplaceSellerStatus;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;
  createdAt: string;
};

export type MarketplaceListing = {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  category: string;
  subcategory: string;
  priceCents: number;
  quantity: number;
  status: MarketplaceListingStatus;
  createdAt: string;
};

export type MarketplaceAdminSnapshot = {
  sellers: MarketplaceSeller[];
  listings: MarketplaceListing[];
};
