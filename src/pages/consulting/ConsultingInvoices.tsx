import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  FileText,
  RefreshCw,
  ReceiptText,
  Send,
  ShieldCheck,
} from "lucide-react";

import {
  createStripeInvoice,
  sendStripeInvoice,
} from "../../services/consulting";
import { useConsultingOperations } from "./useConsultingOperations";
import "./Consulting.css";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function ConsultingInvoices() {
  const {
    data,
    loading,
    working,
    error,
    message,
    load,
    run,
    setError,
  } = useConsultingOperations();

  const [clientId, setClientId] = useState("");
  const [contractId, setContractId] = useState("");
  const [description, setDescription] = useState("Consulting services");
  const [amount, setAmount] = useState("");
  const [dueDays, setDueDays] = useState("30");

  useEffect(() => {
    if (!clientId && data.clients[0]?.id) {
      setClientId(data.clients[0].id);
    }
  }, [clientId, data.clients]);

  const clientNames = useMemo(
    () => new Map(data.clients.map(client => [client.id, client.companyName])),
    [data.clients],
  );

  const invoiceContracts = useMemo(
    () => data.contracts.filter(contract => contract.clientId === clientId),
    [data.contracts, clientId],
  );

  async function addInvoice() {
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Enter an invoice amount greater than zero.");
      return;
    }

    await run(
      () => createStripeInvoice({
        clientId,
        contractId: contractId || undefined,
        description,
        amountCents: Math.round(dollars * 100),
        dueDays: Number(dueDays) || 30,
      }),
      "Stripe draft invoice created.",
    );

    setAmount("");
  }

  return (
    <div className="consulting-admin consulting-page page">
      <div className="consulting-page-heading">
        <div className="consulting-heading-group">
          <div className="consulting-heading-icon"><ReceiptText size={18} /></div>
          <div>
            <div className="consulting-eyebrow">Consulting / Stripe Invoices</div>
            <h1>Stripe Invoices</h1>
            <p>Create a draft, review it, then send a hosted Stripe invoice with card and ACH payment options.</p>
          </div>
        </div>
        <button className="consulting-secondary" onClick={() => void load()} disabled={loading || working}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {!data.stripeConfigured && !loading && !error && (
        <div className="consulting-alert warning">Stripe is not configured. Add STRIPE_SECRET_KEY in Platform before creating invoices.</div>
      )}
      {error && <div className="consulting-alert error">{error}</div>}
      {message && <div className="consulting-alert success">{message}</div>}

      <div className={`consulting-integration-banner ${data.stripeConfigured ? "ready" : "warning"}`}>
        <div className="consulting-integration-icon"><ShieldCheck size={18} /></div>
        <div>
          <strong>{data.stripeConfigured ? "Stripe connection ready" : "Stripe connection required"}</strong>
          <span>{data.stripeConfigured ? "Invoices support card and US bank account (ACH) payments through Stripe's hosted payment page." : "Configure Stripe before creating invoice drafts."}</span>
        </div>
      </div>

      <section className="consulting-workspace-card">
        <div className="consulting-workspace-header">
          <div>
            <div className="consulting-section-icon"><CircleDollarSign size={16} /></div>
            <div>
              <h2>Create Invoice Draft</h2>
              <p>Build the customer invoice first. Sending remains a separate, deliberate action.</p>
            </div>
          </div>
          <span className="consulting-step-badge">Stripe draft</span>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title">
            <strong>Invoice relationship</strong>
            <span>Select the client and optionally tie the invoice to a consulting contract.</span>
          </div>
          <div className="consulting-field-grid two">
            <div className="consulting-field">
              <label>Client</label>
              <div className="consulting-select-wrap">
                <select value={clientId} onChange={event => { setClientId(event.target.value); setContractId(""); }}>
                  <option value="">Select a client</option>
                  {data.clients.map(client => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
            <div className="consulting-field">
              <label><FileText size={13} /> Contract / engagement</label>
              <div className="consulting-select-wrap">
                <select value={contractId} onChange={event => setContractId(event.target.value)}>
                  <option value="">No linked contract</option>
                  {invoiceContracts.map(contract => <option key={contract.id} value={contract.id}>{contract.title}</option>)}
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
          </div>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title">
            <strong>Invoice details</strong>
            <span>The description and amount appear on the Stripe invoice.</span>
          </div>
          <div className="consulting-field-grid three">
            <div className="consulting-field consulting-span-2">
              <label>Description</label>
              <input value={description} onChange={event => setDescription(event.target.value)} placeholder="Consulting services" />
            </div>
            <div className="consulting-field">
              <label><CircleDollarSign size={13} /> Amount (USD)</label>
              <div className="consulting-money-input"><span>$</span><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="575.00" /></div>
            </div>
            <div className="consulting-field">
              <label><CalendarClock size={13} /> Due in days</label>
              <input value={dueDays} onChange={event => setDueDays(event.target.value)} inputMode="numeric" />
            </div>
          </div>
        </div>

        <div className="consulting-form-actions">
          <div className="consulting-form-hint">Creating a draft does not email the customer. Review it in the table below, then click Send.</div>
          <button className="consulting-primary large" onClick={() => void addInvoice()} disabled={working || !data.stripeConfigured || !clientId || !description.trim()}>
            <ReceiptText size={15} /> Create Stripe Draft
          </button>
        </div>
      </section>

      <section className="consulting-wide-card consulting-record-card">
        <div className="consulting-table-header">
          <div><strong>Invoice Register</strong><span>{data.invoices.length} records</span></div>
        </div>
        <div className="consulting-table-wrap">
          <table className="consulting-table">
            <thead><tr><th>Client</th><th>Description</th><th>Amount</th><th>Status</th><th>Stripe</th></tr></thead>
            <tbody>
              {data.invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{clientNames.get(invoice.clientId) ?? "Unknown"}</td>
                  <td>{invoice.description}</td>
                  <td><strong className="consulting-table-normal">{money(invoice.amountCents)}</strong></td>
                  <td><span className={`consulting-status ${invoice.status}`}>{invoice.status}</span></td>
                  <td className="consulting-actions">
                    {invoice.stripeInvoiceUrl && <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noreferrer">Open payment page</a>}
                    {invoice.status === "draft" && (
                      <button onClick={() => void run(() => sendStripeInvoice(invoice.id), "Invoice sent through Stripe.")} disabled={working}>
                        <Send size={12} /> Send
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && data.invoices.length === 0 && <tr><td colSpan={5} className="consulting-empty">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
