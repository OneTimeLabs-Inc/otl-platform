import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  FileSignature,
  ReceiptText,
  RefreshCw,
  Send,
} from "lucide-react";

import {
  createConsultingClient,
  createConsultingContract,
  createStripeInvoice,
  getConsultingSnapshot,
  sendStripeInvoice,
  setContractStatus,
} from "../../services/consulting";
import type { ConsultingSnapshot } from "../../types/consulting";
import "./Consulting.css";

const emptySnapshot: ConsultingSnapshot = {
  clients: [],
  contracts: [],
  invoices: [],
  stripeConfigured: false,
};

function money(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function Consulting() {
  const [data, setData] = useState(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewContractId, setPreviewContractId] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [contractClientId, setContractClientId] = useState("");
  const [contractTitle, setContractTitle] = useState("Consulting Services Agreement");
  const [serviceType, setServiceType] = useState("Vendor Migration");
  const [billingModel, setBillingModel] = useState<"hourly" | "daily" | "fixed" | "retainer">("hourly");
  const [rate, setRate] = useState("175");
  const [startDate, setStartDate] = useState("");
  const [scope, setScope] = useState("");

  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceContractId, setInvoiceContractId] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("Consulting services");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [dueDays, setDueDays] = useState("30");

  const clientNames = useMemo(
    () => new Map(data.clients.map(client => [client.id, client.companyName])),
    [data.clients],
  );

  const previewContract = data.contracts.find(contract => contract.id === previewContractId) ?? null;

  const invoiceContracts = useMemo(
    () => data.contracts.filter(contract => contract.clientId === invoiceClientId),
    [data.contracts, invoiceClientId],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const snapshot = await getConsultingSnapshot();
      setData(snapshot);
      const firstClient = snapshot.clients[0]?.id ?? "";
      setContractClientId(current => current || firstClient);
      setInvoiceClientId(current => current || firstClient);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load consulting operations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function run(task: () => Promise<unknown>, success: string) {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(success);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The operation failed.");
    } finally {
      setWorking(false);
    }
  }

  async function addClient() {
    if (!companyName.trim()) return;
    await run(async () => {
      const result = await createConsultingClient({ companyName, contactName, email, phone, billingAddress });
      setContractClientId(result.id);
      setInvoiceClientId(result.id);
      setCompanyName(""); setContactName(""); setEmail(""); setPhone(""); setBillingAddress("");
    }, "Client created.");
  }

  async function addContract() {
    const dollars = Number(rate);
    await run(() => createConsultingContract({
      clientId: contractClientId,
      title: contractTitle,
      serviceType,
      billingModel,
      rateCents: Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null,
      startDate,
      scope,
    }), "Contract draft created.");
  }

  async function addInvoice() {
    const dollars = Number(invoiceAmount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Enter an invoice amount greater than zero.");
      return;
    }
    await run(() => createStripeInvoice({
      clientId: invoiceClientId,
      contractId: invoiceContractId || undefined,
      description: invoiceDescription,
      amountCents: Math.round(dollars * 100),
      dueDays: Number(dueDays) || 30,
    }), "Stripe draft invoice created.");
    setInvoiceAmount("");
  }

  return (
    <div className="consulting-admin page">
      <div className="page-header">
        <div className="page-title">
          <h1>Consulting</h1>
          <span>Clients, consultation contracts, engagements, and Stripe invoices.</span>
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

      <div className="consulting-form-grid">
        <section className="consulting-card">
          <div className="consulting-card-title"><Building2 size={15} /> New client</div>
          <label>Company</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" />
          <div className="consulting-two-col">
            <div><label>Contact</label><input value={contactName} onChange={e => setContactName(e.target.value)} /></div>
            <div><label>Email</label><input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
          </div>
          <label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} />
          <label>Billing address</label><textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} rows={3} />
          <button className="consulting-primary" onClick={() => void addClient()} disabled={working || !companyName.trim()}>Create Client</button>
        </section>

        <section className="consulting-card">
          <div className="consulting-card-title"><FileSignature size={15} /> Consultation contract</div>
          <label>Client</label>
          <select value={contractClientId} onChange={e => setContractClientId(e.target.value)}>
            <option value="">Select a client</option>
            {data.clients.map(client => <option key={client.id} value={client.id}>{client.companyName}</option>)}
          </select>
          <label>Agreement title</label><input value={contractTitle} onChange={e => setContractTitle(e.target.value)} />
          <div className="consulting-two-col">
            <div><label>Service</label><input value={serviceType} onChange={e => setServiceType(e.target.value)} /></div>
            <div><label>Start date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          </div>
          <div className="consulting-two-col">
            <div><label>Billing</label><select value={billingModel} onChange={e => setBillingModel(e.target.value as typeof billingModel)}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="fixed">Fixed</option><option value="retainer">Retainer</option></select></div>
            <div><label>Rate / amount ($)</label><input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" /></div>
          </div>
          <label>Scope</label><textarea value={scope} onChange={e => setScope(e.target.value)} rows={4} placeholder="Describe deliverables, exclusions, sites, systems, and acceptance criteria." />
          <button className="consulting-primary" onClick={() => void addContract()} disabled={working || !contractClientId || !contractTitle.trim()}>Create Contract Draft</button>
          <div className="consulting-footnote">Creates a Platform contract record and a reusable consulting agreement draft. Review the agreement before sending it to a client.</div>
        </section>

        <section className="consulting-card">
          <div className="consulting-card-title"><ReceiptText size={15} /> Stripe invoice</div>
          <label>Client</label>
          <select value={invoiceClientId} onChange={e => { setInvoiceClientId(e.target.value); setInvoiceContractId(""); }}>
            <option value="">Select a client</option>
            {data.clients.map(client => <option key={client.id} value={client.id}>{client.companyName}</option>)}
          </select>
          <label>Contract / engagement</label>
          <select value={invoiceContractId} onChange={e => setInvoiceContractId(e.target.value)}>
            <option value="">No linked contract</option>
            {invoiceContracts.map(contract => <option key={contract.id} value={contract.id}>{contract.title}</option>)}
          </select>
          <label>Description</label><input value={invoiceDescription} onChange={e => setInvoiceDescription(e.target.value)} />
          <div className="consulting-two-col">
            <div><label>Amount ($)</label><input value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} inputMode="decimal" /></div>
            <div><label>Due in days</label><input value={dueDays} onChange={e => setDueDays(e.target.value)} inputMode="numeric" /></div>
          </div>
          <button className="consulting-primary" onClick={() => void addInvoice()} disabled={working || !data.stripeConfigured || !invoiceClientId || !invoiceDescription.trim()}>Create Stripe Draft</button>
          <div className="consulting-footnote">Invoices are created as drafts first. Customers can pay by card or US bank account (ACH). Sending is a separate action below.</div>
        </section>
      </div>

      <section className="consulting-wide-card">
        <div className="consulting-table-header"><div><strong>Contracts</strong><span>{data.contracts.length} records</span></div></div>
        <div className="consulting-table-wrap"><table className="consulting-table"><thead><tr><th>Client</th><th>Agreement</th><th>Billing</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {data.contracts.map(contract => <tr key={contract.id}>
            <td>{clientNames.get(contract.clientId) ?? "Unknown"}</td>
            <td><strong>{contract.title}</strong><small>{contract.serviceType}</small></td>
            <td>{contract.billingModel} · {money(contract.rateCents)}</td>
            <td><span className={`consulting-status ${contract.status}`}>{contract.status}</span></td>
            <td className="consulting-actions"><button onClick={() => setPreviewContractId(contract.id)}>View</button><select className="consulting-status-select" value={contract.status} onChange={e => void run(() => setContractStatus({ contractId: contract.id, status: e.target.value as typeof contract.status }), "Contract status updated.")} disabled={working}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
          </tr>)}
          {!loading && data.contracts.length === 0 && <tr><td colSpan={5} className="consulting-empty">No contracts yet.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="consulting-wide-card">
        <div className="consulting-table-header"><div><strong>Invoices</strong><span>{data.invoices.length} records</span></div></div>
        <div className="consulting-table-wrap"><table className="consulting-table"><thead><tr><th>Client</th><th>Description</th><th>Amount</th><th>Status</th><th>Stripe</th></tr></thead><tbody>
          {data.invoices.map(invoice => <tr key={invoice.id}>
            <td>{clientNames.get(invoice.clientId) ?? "Unknown"}</td>
            <td>{invoice.description}</td><td>{money(invoice.amountCents)}</td>
            <td><span className={`consulting-status ${invoice.status}`}>{invoice.status}</span></td>
            <td className="consulting-actions">
              {invoice.stripeInvoiceUrl && <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noreferrer">Open</a>}
              {invoice.status === "draft" && <button onClick={() => void run(() => sendStripeInvoice(invoice.id), "Invoice sent through Stripe.")} disabled={working}><Send size={12} /> Send</button>}
            </td>
          </tr>)}
          {!loading && data.invoices.length === 0 && <tr><td colSpan={5} className="consulting-empty">No invoices yet.</td></tr>}
        </tbody></table></div>
      </section>

      {previewContract && (
        <div className="consulting-modal-backdrop" onMouseDown={() => setPreviewContractId("")}>
          <div className="consulting-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="consulting-modal-head">
              <div><strong>{previewContract.title}</strong><span>{clientNames.get(previewContract.clientId) ?? "Client"}</span></div>
              <button onClick={() => setPreviewContractId("")}>Close</button>
            </div>
            <pre>{previewContract.contractText || "No agreement text is stored for this contract."}</pre>
            <div className="consulting-modal-actions">
              <button onClick={() => void navigator.clipboard.writeText(previewContract.contractText || "")}>Copy agreement</button>
              <button onClick={() => window.print()}>Print / Save PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
