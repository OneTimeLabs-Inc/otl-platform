import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  KeyRound,
  Link2,
  RefreshCw,
  Search,
  ShieldOff,
  Trash2,
} from "lucide-react";
import {
  assignPerpetualLicense,
  deleteSoftwareLicense,
  generateTemporaryDownloadLink,
  getSoftwareLicensingSnapshot,
  revokeTemporaryDownloadLink,
  setDownloadAccess,
  setLicenseStatus,
} from "../../services/softwareLicensing";
import type {
  LicenseStatus,
  SoftwareLicense,
  SoftwareLicensingSnapshot,
} from "../../types/softwareLicensing";
import "./Licensing.css";

const emptySnapshot: SoftwareLicensingSnapshot = {
  products: [],
  users: [],
  licenses: [],
  downloadLinks: [],
};

type SortMode = "user-asc" | "user-desc" | "software" | "recent";

function prettyDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

export default function Licensing() {
  const [data, setData] = useState<SoftwareLicensingSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [userId, setUserId] = useState("");
  const [assignUserSearch, setAssignUserSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [note, setNote] = useState("");

  const [downloadUserId, setDownloadUserId] = useState("");
  const [downloadUserSearch, setDownloadUserSearch] = useState("");
  const [selectedEntitlement, setSelectedEntitlement] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(1440);
  const [maxUses, setMaxUses] = useState<number | null>(1);
  const [generatedUrl, setGeneratedUrl] = useState("");

  const [licenseSearch, setLicenseSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LicenseStatus>("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("user-asc");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getSoftwareLicensingSnapshot();
      setData(snapshot);

      if (!productId && snapshot.products[0]) {
        setProductId(snapshot.products[0].id);
      }

      if (!userId && snapshot.users[0]) {
        setUserId(snapshot.users[0].authUserId);
      }

      const firstDownloadable = snapshot.licenses.find(
        item => item.status === "active" && item.downloadEnabled,
      );

      if (!downloadUserId && firstDownloadable) {
        setDownloadUserId(firstDownloadable.authUserId);
      }

      if (!selectedEntitlement && firstDownloadable) {
        setSelectedEntitlement(firstDownloadable.entitlementId);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load licensing data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const productVersionById = useMemo(
    () => new Map(data.products.map(product => [product.id, product.currentVersion])),
    [data.products],
  );

  function productLabel(productName: string, currentProductId: string): string {
    const version = productVersionById.get(currentProductId);
    return version ? `${productName} ${version}` : productName;
  }

  const filteredAssignUsers = useMemo(() => {
    const query = normalized(assignUserSearch);
    if (!query) return data.users;
    return data.users.filter(user =>
      normalized(`${user.displayName ?? ""} ${user.email}`).includes(query),
    );
  }, [assignUserSearch, data.users]);

  const downloadableLicenses = useMemo(
    () => data.licenses.filter(item => item.status === "active" && item.downloadEnabled),
    [data.licenses],
  );

  const downloadableUserIds = useMemo(
    () => new Set(downloadableLicenses.map(item => item.authUserId)),
    [downloadableLicenses],
  );

  const filteredDownloadUsers = useMemo(() => {
    const query = normalized(downloadUserSearch);
    return data.users.filter(user => {
      if (!downloadableUserIds.has(user.authUserId)) return false;
      if (!query) return true;
      return normalized(`${user.displayName ?? ""} ${user.email}`).includes(query);
    });
  }, [data.users, downloadableUserIds, downloadUserSearch]);

  const selectedUserLicenses = useMemo(
    () => downloadableLicenses.filter(item => item.authUserId === downloadUserId),
    [downloadableLicenses, downloadUserId],
  );

  const selectedLicense = useMemo(
    () => data.licenses.find(item => item.entitlementId === selectedEntitlement) ?? null,
    [data.licenses, selectedEntitlement],
  );

  const visibleLicenses = useMemo(() => {
    const query = normalized(licenseSearch);

    const rows = data.licenses.filter(item => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (productFilter !== "all" && item.productId !== productFilter) return false;
      if (!query) return true;

      return normalized([
        item.userDisplayName ?? "",
        item.userEmail,
        item.productName,
        productVersionById.get(item.productId) ?? "",
        item.licenseKey,
      ].join(" ")).includes(query);
    });

    return [...rows].sort((a, b) => {
      const aUser = (a.userDisplayName || a.userEmail).toLowerCase();
      const bUser = (b.userDisplayName || b.userEmail).toLowerCase();

      if (sortMode === "user-asc") return aUser.localeCompare(bUser);
      if (sortMode === "user-desc") return bUser.localeCompare(aUser);
      if (sortMode === "software") {
        return productLabel(a.productName, a.productId)
          .localeCompare(productLabel(b.productName, b.productId));
      }
      return new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime();
    });
  }, [data.licenses, licenseSearch, productFilter, productVersionById, sortMode, statusFilter]);

  useEffect(() => {
    if (selectedUserLicenses.length === 0) {
      setSelectedEntitlement("");
      return;
    }

    if (!selectedUserLicenses.some(item => item.entitlementId === selectedEntitlement)) {
      setSelectedEntitlement(selectedUserLicenses[0].entitlementId);
    }
  }, [selectedEntitlement, selectedUserLicenses]);

  async function run(task: () => Promise<void>) {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await task();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed.");
    } finally {
      setWorking(false);
    }
  }

  async function assign() {
    if (!userId || !productId) return;
    await run(async () => {
      const result = await assignPerpetualLicense({ authUserId: userId, productId, note });
      setMessage(
        result.existing
          ? "This user already has an active license."
          : `License assigned: ${result.licenseKey}`,
      );
      setNote("");
    });
  }

  async function changeStatus(licenseId: string, status: LicenseStatus) {
    const reason = window.prompt(
      status === "revoked"
        ? "Reason for revocation (chargeback, returned payment, etc.):"
        : `Optional reason for ${status}:`,
      status === "revoked" ? "Payment reversed / chargeback" : "",
    );
    if (reason === null) return;

    await run(async () => {
      await setLicenseStatus({ licenseId, status, reason });
      setMessage(`License ${status}.`);
    });
  }

  async function removeLicense(item: SoftwareLicense) {
    const versionedProduct = productLabel(item.productName, item.productId);
    const confirmed = window.confirm(
      `Permanently delete ${versionedProduct} from ${item.userEmail}?\n\n` +
      "This removes the entitlement, license, activations, and temporary download links. " +
      "Purchased licenses cannot be deleted and must be revoked instead.",
    );

    if (!confirmed) return;

    await run(async () => {
      await deleteSoftwareLicense(item.entitlementId);
      setMessage(`Deleted ${versionedProduct} license for ${item.userEmail}.`);
    });
  }

  async function generateLink() {
    if (!selectedEntitlement) return;
    setWorking(true);
    setError("");
    setMessage("");
    try {
      const result = await generateTemporaryDownloadLink({
        entitlementId: selectedEntitlement,
        ttlMinutes,
        maxUses,
        note: "Generated from OneTime Labs Platform",
      });
      setGeneratedUrl(result.url);
      setMessage(`Temporary link created. Expires ${prettyDate(result.expiresAt)}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate link.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="licensing-page page">
      <div className="page-header">
        <div className="page-title">
          <h1>Software Licensing</h1>
          <span>Assign perpetual licenses, disable software after payment reversals, and issue temporary downloads.</span>
        </div>
        <button className="licensing-secondary" onClick={() => void load()} disabled={loading || working}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="licensing-alert error">{error}</div>}
      {message && <div className="licensing-alert success">{message}</div>}

      <div className="licensing-grid">
        <section className="licensing-card">
          <div className="licensing-card-title"><KeyRound size={15} /> Assign perpetual license</div>

          <label>Find user</label>
          <div className="licensing-search-field">
            <Search size={14} />
            <input
              value={assignUserSearch}
              onChange={event => setAssignUserSearch(event.target.value)}
              placeholder="Search name or email"
            />
          </div>

          <label>User</label>
          <select value={userId} onChange={event => setUserId(event.target.value)}>
            {filteredAssignUsers.map(user => (
              <option key={user.authUserId} value={user.authUserId}>
                {user.displayName ? `${user.displayName} — ` : ""}{user.email}
              </option>
            ))}
          </select>
          {assignUserSearch && filteredAssignUsers.length === 0 && (
            <div className="licensing-inline-note">No users match that search.</div>
          )}

          <label>Software</label>
          <select value={productId} onChange={event => setProductId(event.target.value)}>
            {data.products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name}{product.currentVersion ? ` ${product.currentVersion}` : ""}
              </option>
            ))}
          </select>

          <label>Note</label>
          <input value={note} onChange={event => setNote(event.target.value)} placeholder="Optional internal note" />

          <button className="licensing-primary" onClick={() => void assign()} disabled={working || !userId || !productId}>
            Assign License
          </button>
        </section>

        <section className="licensing-card">
          <div className="licensing-card-title"><Link2 size={15} /> Temporary download link</div>

          <label>Find licensed user</label>
          <div className="licensing-search-field">
            <Search size={14} />
            <input
              value={downloadUserSearch}
              onChange={event => setDownloadUserSearch(event.target.value)}
              placeholder="Search name or email"
            />
          </div>

          <label>User</label>
          <select
            value={downloadUserId}
            onChange={event => {
              setDownloadUserId(event.target.value);
              setGeneratedUrl("");
            }}
          >
            {filteredDownloadUsers.map(user => (
              <option key={user.authUserId} value={user.authUserId}>
                {user.displayName ? `${user.displayName} — ` : ""}{user.email}
              </option>
            ))}
          </select>

          <label>Licensed software</label>
          <select
            value={selectedEntitlement}
            onChange={event => {
              setSelectedEntitlement(event.target.value);
              setGeneratedUrl("");
            }}
          >
            {selectedUserLicenses.map(item => (
              <option key={item.entitlementId} value={item.entitlementId}>
                {productLabel(item.productName, item.productId)} — {item.licenseKey}
              </option>
            ))}
          </select>

          {downloadUserId && selectedUserLicenses.length === 0 && (
            <div className="licensing-inline-note">This user has no active licenses with downloads enabled.</div>
          )}

          <div className="licensing-two-col">
            <div>
              <label>Expires</label>
              <select value={ttlMinutes} onChange={event => setTtlMinutes(Number(event.target.value))}>
                <option value={15}>15 minutes</option>
                <option value={60}>1 hour</option>
                <option value={1440}>24 hours</option>
                <option value={4320}>3 days</option>
                <option value={10080}>7 days</option>
              </select>
            </div>
            <div>
              <label>Uses</label>
              <select
                value={maxUses === null ? "unlimited" : String(maxUses)}
                onChange={event => setMaxUses(event.target.value === "unlimited" ? null : Number(event.target.value))}
              >
                <option value="1">1 use</option>
                <option value="2">2 uses</option>
                <option value="3">3 uses</option>
                <option value="5">5 uses</option>
                <option value="10">10 uses</option>
                <option value="unlimited">Unlimited until expiry</option>
              </select>
            </div>
          </div>

          <button className="licensing-primary" onClick={() => void generateLink()} disabled={working || !selectedLicense}>
            Generate Link
          </button>

          {generatedUrl && (
            <div className="generated-link">
              <input readOnly value={generatedUrl} />
              <button onClick={() => void navigator.clipboard.writeText(generatedUrl)} title="Copy link">
                <Copy size={14} />
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="licensing-card licensing-wide">
        <div className="licensing-table-header">
          <div>
            <div className="licensing-card-title">Licenses</div>
            <div className="licensing-result-count">
              {visibleLicenses.length} of {data.licenses.length} license{data.licenses.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="licensing-table-filters">
            <div className="licensing-search-field compact">
              <Search size={14} />
              <input
                value={licenseSearch}
                onChange={event => setLicenseSearch(event.target.value)}
                placeholder="Search user, email, license..."
              />
            </div>

            <select value={productFilter} onChange={event => setProductFilter(event.target.value)} aria-label="Filter by software">
              <option value="all">All software</option>
              {data.products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name}{product.currentVersion ? ` ${product.currentVersion}` : ""}
                </option>
              ))}
            </select>

            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as "all" | LicenseStatus)} aria-label="Filter by status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>

            <select value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)} aria-label="Sort licenses">
              <option value="user-asc">User A–Z</option>
              <option value="user-desc">User Z–A</option>
              <option value="software">Software A–Z</option>
              <option value="recent">Recently assigned</option>
            </select>
          </div>
        </div>

        <div className="licensing-table-wrap">
          <table className="licensing-table">
            <thead>
              <tr><th>User</th><th>Software</th><th>License</th><th>Status</th><th>Downloads</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {visibleLicenses.map(item => (
                <tr key={item.entitlementId}>
                  <td>
                    <strong>{item.userDisplayName || item.userEmail}</strong>
                    <small>{item.userEmail}</small>
                  </td>
                  <td>{productLabel(item.productName, item.productId)}</td>
                  <td className="license-key">{item.licenseKey}</td>
                  <td><span className={`license-status ${item.status}`}>{item.status}</span></td>
                  <td>
                    <button
                      className={`download-toggle ${item.downloadEnabled ? "enabled" : ""}`}
                      disabled={working || item.status !== "active"}
                      onClick={() => void run(async () => {
                        await setDownloadAccess({ entitlementId: item.entitlementId, enabled: !item.downloadEnabled });
                      })}
                    >
                      {item.downloadEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="license-actions">
                    {item.status !== "active" && (
                      <button onClick={() => void changeStatus(item.licenseId, "active")}>Activate</button>
                    )}
                    {item.status === "active" && (
                      <button onClick={() => void changeStatus(item.licenseId, "suspended")}>Suspend</button>
                    )}
                    {item.status !== "revoked" && (
                      <button className="danger" onClick={() => void changeStatus(item.licenseId, "revoked")}>
                        <ShieldOff size={13} /> Revoke
                      </button>
                    )}
                    <button className="danger" onClick={() => void removeLicense(item)} disabled={working}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && visibleLicenses.length === 0 && (
                <tr><td colSpan={6} className="empty-row">No licenses match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="licensing-card licensing-wide">
        <div className="licensing-card-title">Recent temporary links</div>
        <div className="licensing-table-wrap">
          <table className="licensing-table">
            <thead><tr><th>Software</th><th>Recipient</th><th>Usage</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.downloadLinks.slice(0, 25).map(link => {
                const expired = new Date(link.expiresAt).getTime() <= Date.now();
                const exhausted = link.maxUses !== null && link.useCount >= link.maxUses;
                const status = link.revokedAt ? "Revoked" : expired ? "Expired" : exhausted ? "Exhausted" : "Active";
                return (
                  <tr key={link.id}>
                    <td>{productLabel(link.productName, link.productId)}</td>
                    <td>{link.recipientEmail || "—"}</td>
                    <td>{link.useCount} / {link.maxUses ?? "∞"}</td>
                    <td>{prettyDate(link.expiresAt)}</td>
                    <td>{status}</td>
                    <td>
                      {!link.revokedAt && !expired && !exhausted && (
                        <button
                          className="table-action danger"
                          onClick={() => void run(async () => { await revokeTemporaryDownloadLink(link.id); })}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && data.downloadLinks.length === 0 && (
                <tr><td colSpan={6} className="empty-row">No temporary links generated yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
