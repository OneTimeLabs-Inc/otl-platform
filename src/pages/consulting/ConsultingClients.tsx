import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { createConsultingClient } from "../../services/consulting";
import { useConsultingOperations } from "./useConsultingOperations";
import "./Consulting.css";

export default function ConsultingClients() {
  const {
    data,
    loading,
    working,
    error,
    message,
    load,
    run,
  } = useConsultingOperations();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");

  const activeClients = useMemo(
    () => data.clients.filter(client => client.active).length,
    [data.clients],
  );

  async function addClient() {
    if (!companyName.trim()) return;

    await run(async () => {
      await createConsultingClient({
        companyName,
        contactName,
        email,
        phone,
        billingAddress,
        notes,
      });

      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setBillingAddress("");
      setNotes("");
    }, "Client created.");
  }

  return (
    <div className="consulting-admin consulting-page page">
      <div className="consulting-page-heading">
        <div className="consulting-heading-group">
          <div className="consulting-heading-icon"><UsersRound size={18} /></div>
          <div>
            <div className="consulting-eyebrow">Consulting / Clients</div>
            <h1>Client Management</h1>
            <p>Create consulting clients and keep their billing/contact information in one place.</p>
          </div>
        </div>
        <button className="consulting-secondary" onClick={() => void load()} disabled={loading || working}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="consulting-alert error">{error}</div>}
      {message && <div className="consulting-alert success">{message}</div>}

      <div className="consulting-stat-row">
        <div><span>Total clients</span><strong>{data.clients.length}</strong></div>
        <div><span>Active clients</span><strong>{activeClients}</strong></div>
        <div><span>Stripe-linked</span><strong>{data.clients.filter(client => client.stripeCustomerId).length}</strong></div>
      </div>

      <section className="consulting-workspace-card">
        <div className="consulting-workspace-header">
          <div>
            <div className="consulting-section-icon"><UserPlus size={16} /></div>
            <div>
              <h2>New Client</h2>
              <p>Set up the client record used by contracts and Stripe invoices.</p>
            </div>
          </div>
          <span className="consulting-step-badge">Client record</span>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title">
            <strong>Company information</strong>
            <span>Core organization and primary contact details.</span>
          </div>
          <div className="consulting-field-grid two">
            <div className="consulting-field consulting-span-2">
              <label><Building2 size={13} /> Company name</label>
              <input value={companyName} onChange={event => setCompanyName(event.target.value)} placeholder="Acme Manufacturing" />
            </div>
            <div className="consulting-field">
              <label>Primary contact</label>
              <input value={contactName} onChange={event => setContactName(event.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="consulting-field">
              <label><Mail size={13} /> Email</label>
              <input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="jane@company.com" />
            </div>
            <div className="consulting-field">
              <label><Phone size={13} /> Phone</label>
              <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="(555) 555-0100" />
            </div>
            <div className="consulting-field">
              <label><MapPin size={13} /> Billing address</label>
              <textarea value={billingAddress} onChange={event => setBillingAddress(event.target.value)} rows={3} placeholder="Street, city, state, ZIP" />
            </div>
          </div>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title">
            <strong>Internal notes</strong>
            <span>Optional context for OneTime Labs. This is not shown on invoices.</span>
          </div>
          <div className="consulting-field">
            <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={4} placeholder="Procurement contact, project context, vendor notes, or other internal information." />
          </div>
        </div>

        <div className="consulting-form-actions">
          <div className="consulting-form-hint">The client becomes immediately available in Contract Builder and Stripe Invoices.</div>
          <button className="consulting-primary large" onClick={() => void addClient()} disabled={working || !companyName.trim()}>
            <UserPlus size={15} /> Create Client
          </button>
        </div>
      </section>

      <section className="consulting-wide-card consulting-record-card">
        <div className="consulting-table-header">
          <div><strong>Client Directory</strong><span>{data.clients.length} records</span></div>
        </div>
        <div className="consulting-table-wrap">
          <table className="consulting-table">
            <thead><tr><th>Company</th><th>Primary contact</th><th>Contact</th><th>Stripe</th><th>Status</th></tr></thead>
            <tbody>
              {data.clients.map(client => (
                <tr key={client.id}>
                  <td><strong>{client.companyName}</strong><small>{client.billingAddress || "No billing address"}</small></td>
                  <td>{client.contactName || "—"}</td>
                  <td><strong className="consulting-table-normal">{client.email || "—"}</strong><small>{client.phone || "No phone"}</small></td>
                  <td>{client.stripeCustomerId ? <span className="consulting-status accepted">Linked</span> : <span className="consulting-status">Not linked</span>}</td>
                  <td><span className={`consulting-status ${client.active ? "accepted" : "cancelled"}`}>{client.active ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
              {!loading && data.clients.length === 0 && <tr><td colSpan={5} className="consulting-empty">No clients yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
