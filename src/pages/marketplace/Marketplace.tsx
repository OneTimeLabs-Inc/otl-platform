import {
  Archive,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Store,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMarketplaceAdminSnapshot,
  setMarketplaceListingStatus,
  setMarketplaceSellerStatus,
} from "../../services/marketplaceAdmin";
import type {
  MarketplaceAdminSnapshot,
  MarketplaceListingStatus,
  MarketplaceSellerStatus,
} from "../../types/marketplaceAdmin";
import "./Marketplace.css";

export default function Marketplace() {
  const [snapshot, setSnapshot] = useState<MarketplaceAdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await getMarketplaceAdminSnapshot());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load marketplace administration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sellers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!snapshot || !normalized) return snapshot?.sellers ?? [];
    return snapshot.sellers.filter(seller =>
      `${seller.displayName} ${seller.email} ${seller.slug} ${seller.status}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [snapshot, query]);

  const listings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!snapshot || !normalized) return snapshot?.listings ?? [];
    return snapshot.listings.filter(listing =>
      `${listing.title} ${listing.sellerName} ${listing.category} ${listing.subcategory} ${listing.status}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [snapshot, query]);

  async function sellerStatus(sellerId: string, status: MarketplaceSellerStatus) {
    setWorkingId(sellerId);
    setError("");
    try {
      await setMarketplaceSellerStatus(sellerId, status);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update seller.");
    } finally {
      setWorkingId(null);
    }
  }

  async function listingStatus(listingId: string, status: MarketplaceListingStatus) {
    setWorkingId(listingId);
    setError("");
    try {
      await setMarketplaceListingStatus(listingId, status);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update listing.");
    } finally {
      setWorkingId(null);
    }
  }

  if (loading && !snapshot) {
    return <section className="marketplace-admin-page marketplace-loading"><LoaderCircle className="marketplace-spin" size={18} /> Loading marketplace...</section>;
  }

  return (
    <section className="marketplace-admin-page">
      <header className="marketplace-admin-header">
        <div>
          <span className="marketplace-kicker">ONETIME LABS STORE</span>
          <h1>Marketplace</h1>
          <p>Seller and listing administration lives in Platform. The Store remains customer and seller facing.</p>
        </div>
        <button type="button" className="marketplace-refresh" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </header>

      <div className="marketplace-summary">
        <article><strong>{snapshot?.sellers.length ?? 0}</strong><span>Sellers</span></article>
        <article><strong>{snapshot?.sellers.filter(item => item.status === "approved").length ?? 0}</strong><span>Approved</span></article>
        <article><strong>{snapshot?.sellers.filter(item => item.status === "suspended").length ?? 0}</strong><span>Suspended</span></article>
        <article><strong>{snapshot?.listings.length ?? 0}</strong><span>Listings</span></article>
      </div>

      <div className="marketplace-toolbar">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search seller, email, listing, category..."
          aria-label="Search marketplace administration"
        />
      </div>

      {error && <div className="marketplace-error">{error}</div>}

      <section className="marketplace-panel">
        <div className="marketplace-panel-title"><Store size={17} /><div><h2>Sellers</h2><p>Suspend or restore Store seller access.</p></div></div>
        <div className="marketplace-table">
          <div className="marketplace-row marketplace-head"><span>Seller</span><span>Status</span><span>Stripe</span><span>Actions</span></div>
          {sellers.map(seller => {
            const working = workingId === seller.id;
            const stripeReady = seller.stripeOnboardingComplete && seller.stripeChargesEnabled && seller.stripePayoutsEnabled;
            return (
              <div className="marketplace-row" key={seller.id}>
                <div className="marketplace-primary"><strong>{seller.displayName}</strong><span>{seller.email}</span></div>
                <span className={`marketplace-status ${seller.status}`}>{seller.status}</span>
                <span>{stripeReady ? "Ready" : seller.stripeAccountId ? "Setup incomplete" : "Not connected"}</span>
                <div className="marketplace-actions">
                  {seller.status === "pending" && <button disabled={working} onClick={() => void sellerStatus(seller.id, "approved")}><CheckCircle2 size={14} /> Approve</button>}
                  {seller.status !== "suspended" && <button className="secondary" disabled={working} onClick={() => void sellerStatus(seller.id, "suspended")}><XCircle size={14} /> Suspend</button>}
                  {seller.status === "suspended" && <button disabled={working} onClick={() => void sellerStatus(seller.id, "approved")}><RotateCcw size={14} /> Restore</button>}
                </div>
              </div>
            );
          })}
          {sellers.length === 0 && <div className="marketplace-empty">No sellers match this search.</div>}
        </div>
      </section>

      <section className="marketplace-panel">
        <div className="marketplace-panel-title"><Archive size={17} /><div><h2>Listings</h2><p>Publish, unpublish, or archive seller inventory.</p></div></div>
        <div className="marketplace-table listings">
          <div className="marketplace-row marketplace-head"><span>Listing</span><span>Seller</span><span>Status</span><span>Actions</span></div>
          {listings.map(listing => {
            const working = workingId === listing.id;
            return (
              <div className="marketplace-row" key={listing.id}>
                <div className="marketplace-primary"><strong>{listing.title}</strong><span>{listing.subcategory} · ${(listing.priceCents / 100).toFixed(2)} · {listing.quantity} available</span></div>
                <span>{listing.sellerName}</span>
                <span className={`marketplace-status ${listing.status}`}>{listing.status.replace("_", " ")}</span>
                <div className="marketplace-actions">
                  {listing.status !== "published" && listing.quantity > 0 && <button disabled={working} onClick={() => void listingStatus(listing.id, "published")}>Publish</button>}
                  {listing.status === "published" && <button className="secondary" disabled={working} onClick={() => void listingStatus(listing.id, "draft")}>Unpublish</button>}
                  {listing.status !== "archived" && <button className="secondary" disabled={working} onClick={() => void listingStatus(listing.id, "archived")}>Archive</button>}
                </div>
              </div>
            );
          })}
          {listings.length === 0 && <div className="marketplace-empty">No listings match this search.</div>}
        </div>
      </section>
    </section>
  );
}
