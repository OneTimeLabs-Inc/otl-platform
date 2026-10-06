import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { getPlatformRoles, type PlatformRole } from "../../services/platformRoles";
import "./Roles.css";

export default function Roles() {
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRoles(await getPlatformRoles());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="roles-page page">
      <div className="page-header roles-header">
        <div className="page-title">
          <h1>Roles</h1>
          <p>Platform and organization roles available for user assignment.</p>
        </div>
        <button type="button" className="roles-refresh" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} className={loading ? "roles-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && <div className="roles-error">{error}</div>}

      <div className="panel">
        <div className="panel-header">Platform Roles</div>
        <div className="panel-body roles-grid">
          {loading ? (
            <div className="roles-empty">Loading roles…</div>
          ) : roles.length === 0 ? (
            <div className="roles-empty">No platform roles were found.</div>
          ) : roles.map(role => (
            <article className="role-card" key={role.id}>
              <div className="role-icon"><ShieldCheck size={18} /></div>
              <div>
                <div className="role-title-row">
                  <strong>{role.display_name}</strong>
                  <code>{role.code}</code>
                </div>
                <p>{role.description || "No description provided."}</p>
                <small>Sort order {role.sort_order}</small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
