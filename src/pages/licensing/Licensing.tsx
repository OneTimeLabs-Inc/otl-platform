import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Link2, RefreshCw, ShieldOff } from "lucide-react";
import {
  assignPerpetualLicense,
  generateTemporaryDownloadLink,
  getSoftwareLicensingSnapshot,
  revokeTemporaryDownloadLink,
  setDownloadAccess,
  setLicenseStatus,
} from "../../services/softwareLicensing";
import type {
  LicenseStatus,
  SoftwareLicensingSnapshot,
} from "../../types/softwareLicensing";
import "./Licensing.css";

const emptySnapshot: SoftwareLicensingSnapshot = {
  products: [],
  users: [],
  licenses: [],
  downloadLinks: [],
};

function prettyDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function Licensing() {
  const [data, setData] = useState<SoftwareLicensingSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [productId, setProductId] = useState("");
  const [note, setNote] = useState("");
  const [selectedEntitlement, setSelectedEntitlement] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(1440);
  const [maxUses, setMaxUses] = useState<number | null>(1);
  const [generatedUrl, setGeneratedUrl] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getSoftwareLicensingSnapshot();
      setData(snapshot);
      if (!userId && snapshot.users[0]) setUserId(snapshot.users[0].authUserId);
      if (!productId && snapshot.products[0]) setProductId(snapshot.products[0].id);
      if (!selectedEntitlement && snapshot.licenses[0]) {
        setSelectedEntitlement(snapshot.licenses[0].entitlementId);
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

  const selectedLicense = useMemo(
    () => data.licenses.find(item => item.entitlementId === selectedEntitlement) ?? null,
    [data.licenses, selectedEntitlement],
  );

  const productVersionById = useMemo(
    () => new Map(data.products.map(product => [product.id, product.currentVersion])),
    [data.products],
  );

  function productLabel(productName: string, productId: string): string {
    const version = productVersionById.get(productId);
    return version ? `${productName} ${version}` : productName;
  }

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
      setMessage(result.existing ? "This user already has an active license." : `License assigned: ${result.licenseKey}`);
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
          <label>User</label>
          <select value={userId} onChange={event => setUserId(event.target.value)}>
            {data.users.map(user => (
              <option key={user.authUserId} value={user.authUserId}>
                {user.displayName ? `${user.displayName} — ` : ""}{user.email}
              </option>
            ))}
          </select>
          <label>Software</label>
          <select value={productId} onChange={event => setProductId(event.target.value)}>
            {data.products.map(product => (
              <option key={product.id} value={product.id}>{product.name}{product.currentVersion ? ` ${product.currentVersion}` : ""}</option>
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
          <label>Licensed software</label>
          <select value={selectedEntitlement} onChange={event => setSelectedEntitlement(event.target.value)}>
            {data.licenses.filter(item => item.status === "active" && item.downloadEnabled).map(item => (
              <option key={item.entitlementId} value={item.entitlementId}>{productLabel(item.productName, item.productId)} — {item.userEmail}</option>
            ))}
          </select>
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
              <select value={maxUses === null ? "unlimited" : String(maxUses)} onChange={event => setMaxUses(event.target.value === "unlimited" ? null : Number(event.target.value))}>
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
              <button onClick={() => void navigator.clipboard.writeText(generatedUrl)} title="Copy link"><Copy size={14} /></button>
            </div>
          )}
        </section>
      </div>

      <section className="licensing-card licensing-wide">
        <div className="licensing-card-title">Licenses</div>
        <div className="licensing-table-wrap">
          <table className="licensing-table">
            <thead><tr><th>User</th><th>Software</th><th>License</th><th>Status</th><th>Downloads</th><th>Actions</th></tr></thead>
            <tbody>
              {data.licenses.map(item => (
                <tr key={item.entitlementId}>
                  <td><strong>{item.userDisplayName || item.userEmail}</strong><small>{item.userEmail}</small></td>
                  <td>{productLabel(item.productName, item.productId)}</td>
                  <td className="license-key">{item.licenseKey}</td>
                  <td><span className={`license-status ${item.status}`}>{item.status}</span></td>
                  <td>
                    <button className={`download-toggle ${item.downloadEnabled ? "enabled" : ""}`} disabled={working || item.status !== "active"} onClick={() => void run(async () => {
                      await setDownloadAccess({ entitlementId: item.entitlementId, enabled: !item.downloadEnabled });
                    })}>{item.downloadEnabled ? "Enabled" : "Disabled"}</button>
                  </td>
                  <td className="license-actions">
                    {item.status !== "active" && <button onClick={() => void changeStatus(item.licenseId, "active")}>Activate</button>}
                    {item.status === "active" && <button onClick={() => void changeStatus(item.licenseId, "suspended")}>Suspend</button>}
                    {item.status !== "revoked" && <button className="danger" onClick={() => void changeStatus(item.licenseId, "revoked")}><ShieldOff size={13} /> Revoke</button>}
                  </td>
                </tr>
              ))}
              {!loading && data.licenses.length === 0 && <tr><td colSpan={6} className="empty-row">No software licenses have been assigned yet.</td></tr>}
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
                return <tr key={link.id}>
                  <td>{productLabel(link.productName, link.productId)}</td>
                  <td>{link.recipientEmail || "—"}</td>
                  <td>{link.useCount} / {link.maxUses ?? "∞"}</td>
                  <td>{prettyDate(link.expiresAt)}</td>
                  <td>{status}</td>
                  <td>{!link.revokedAt && !expired && !exhausted && <button className="table-action danger" onClick={() => void run(async () => { await revokeTemporaryDownloadLink(link.id); })}>Revoke</button>}</td>
                </tr>;
              })}
              {!loading && data.downloadLinks.length === 0 && <tr><td colSpan={6} className="empty-row">No temporary links generated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
