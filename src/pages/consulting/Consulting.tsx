import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Copy,
  Eye,
  FileSignature,
  Printer,
  ReceiptText,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import {
  createConsultingClient,
  createConsultingContract,
  createStripeInvoice,
  getConsultingSnapshot,
  sendStripeInvoice,
  setContractStatus,
} from "../../services/consulting";
import type {
  ConsultingBillingModel,
  ConsultingContractData,
  ConsultingSnapshot,
} from "../../types/consulting";
import ContractDocument from "./ContractDocument";
import "./Consulting.css";

const emptySnapshot: ConsultingSnapshot = {
  clients: [],
  contracts: [],
  invoices: [],
  stripeConfigured: false,
};

type ContractTemplate = {
  label: string;
  title: string;
  serviceType: string;
  billingModel: ConsultingBillingModel;
  rate: string;
  data: ConsultingContractData;
  scope: string;
};

const contractTemplates: Record<string, ContractTemplate> = {
  consulting: {
    label: "Consulting Agreement",
    title: "Consulting Services Agreement",
    serviceType: "Enterprise Consulting",
    billingModel: "hourly",
    rate: "175",
    scope: "Architecture, technical advisory, implementation support, documentation, troubleshooting, and other professional services mutually agreed during the engagement.",
    data: {
      projectSummary: "OneTime Labs will provide enterprise technology consulting and architecture services in support of the Client's stated business and technical objectives.",
      deliverables: "Technical recommendations\nArchitecture or implementation documentation\nWorking sessions and stakeholder guidance\nFinal handoff notes or agreed deliverables",
      clientResponsibilities: "Provide timely access to required personnel and systems\nProvide accurate technical and business information\nIdentify an authorized decision-maker\nReview deliverables and approvals without unreasonable delay",
      assumptions: "Remote access is available unless onsite work is specifically included\nRequired vendor and system credentials will be supplied by the Client\nExisting systems are reasonably documented or discoverable",
      exclusions: "Hardware, software, and third-party licensing costs\nTravel unless specifically approved\nWork outside the agreed scope without written change approval",
      paymentTerms: "Net 15",
      specialTerms: "Work outside the agreed scope requires written approval before additional billable work begins.",
    },
  },
  "vendor-migration": {
    label: "Vendor Migration SOW",
    title: "Vendor Migration Statement of Work",
    serviceType: "Vendor Migration",
    billingModel: "fixed",
    rate: "5000",
    scope: "Assessment, migration planning, dependency mapping, vendor coordination, implementation support, validation, cutover assistance, and post-migration handoff for the systems identified by the Client.",
    data: {
      projectSummary: "OneTime Labs will plan and support the transition from an incumbent technology vendor or platform to the Client's selected replacement while reducing operational disruption and preserving required business services.",
      deliverables: "Current-state assessment\nDependency and risk register\nMigration architecture and cutover plan\nImplementation and vendor coordination\nValidation checklist\nPost-migration handoff documentation",
      clientResponsibilities: "Provide access to incumbent and replacement vendors\nProvide current contracts, inventories, configurations, and technical contacts\nApprove migration windows and change controls\nProvide business owners for validation and acceptance",
      assumptions: "Replacement technology has been selected or will be selected before implementation\nClient and vendor resources will be available during agreed migration windows\nMaterial scope changes may require revised pricing or dates",
      exclusions: "Vendor product licensing and termination fees\nUnapproved hardware purchases\nRemediation of unrelated legacy systems\n24x7 support unless expressly included",
      paymentTerms: "50% at project start, 50% at completion unless otherwise stated",
      specialTerms: "Cutover dates are dependent on Client and third-party vendor readiness. Delays outside OneTime Labs' control may require schedule adjustment.",
    },
  },
  "managed-print": {
    label: "Managed Print Assessment",
    title: "Managed Print Services Assessment",
    serviceType: "Managed Print Services",
    billingModel: "fixed",
    rate: "2500",
    scope: "Discovery and assessment of print infrastructure, fleet data, queues, drivers, print servers, management tooling, support workflows, and opportunities for consolidation or vendor transition.",
    data: {
      projectSummary: "OneTime Labs will assess the Client's managed print environment and produce a practical technical view of the current state, risks, and opportunities for optimization or migration.",
      deliverables: "Fleet and infrastructure assessment\nPrint server and queue review\nDriver and platform risk findings\nManagement-tool review\nOptimization recommendations\nExecutive findings summary",
      clientResponsibilities: "Provide access to print servers and management tools\nProvide available fleet exports and vendor documentation\nIdentify site and support contacts\nProvide required network and security approvals",
      assumptions: "Assessment is based on systems and data made available during the engagement\nRemediation is not included unless separately scoped",
      exclusions: "Printer hardware purchases\nConsumables and break/fix services\nPhysical device moves\nImplementation work not specifically included in the scope",
      paymentTerms: "Net 15",
      specialTerms: "Assessment findings reflect the environment visible during the engagement and may change as additional devices, sites, or dependencies are discovered.",
    },
  },
  "custom-development": {
    label: "Custom Development",
    title: "Custom Software Development Agreement",
    serviceType: "Custom Development",
    billingModel: "fixed",
    rate: "5000",
    scope: "Design and development of the application, workflow, integration, or internal business tool described in the approved project requirements, including agreed frontend, backend, authentication, administration, deployment, and handoff work.",
    data: {
      projectSummary: "OneTime Labs will design and build a custom software solution based on the approved requirements and deliver it in an operable production-ready form within the agreed scope.",
      deliverables: "Application design and user interface\nBackend and database implementation\nAuthentication and access controls where required\nAdministrative tools where required\nProduction deployment\nSource and operational handoff",
      clientResponsibilities: "Provide requirements and timely feedback\nProvide branding, content, and third-party credentials when required\nApprove major workflow and design decisions\nPerform business acceptance testing",
      assumptions: "The project will be built against the approved scope\nThird-party services remain subject to their own availability and terms\nMaterial feature additions are handled through change control",
      exclusions: "Third-party subscription or usage fees\nNew features not included in the approved scope\nOngoing support after the agreed warranty or support period unless separately contracted",
      paymentTerms: "50% at project start, 50% before production handoff unless otherwise stated",
      specialTerms: "Pre-existing OneTime Labs frameworks, reusable components, libraries, and tools remain OneTime Labs property unless specifically transferred in writing.",
    },
  },
  retainer: {
    label: "Support / Retainer",
    title: "Technology Consulting Retainer Agreement",
    serviceType: "Ongoing Consulting",
    billingModel: "retainer",
    rate: "3000",
    scope: "Ongoing architecture, technical advisory, vendor coordination, troubleshooting, planning, documentation, and implementation support within the monthly service allocation agreed with the Client.",
    data: {
      projectSummary: "OneTime Labs will provide ongoing technology consulting capacity for recurring operational, architecture, vendor, and project needs.",
      deliverables: "Scheduled consulting availability\nArchitecture and vendor advisory\nIssue and project support\nDocumentation and recommendations\nMonthly activity summary when requested",
      clientResponsibilities: "Provide a primary contact and escalation path\nPrioritize requested work\nProvide required access and approvals\nNotify OneTime Labs of material deadlines or planned changes",
      assumptions: "Work is prioritized within the agreed monthly allocation\nUnused capacity does not roll over unless stated in writing",
      exclusions: "Emergency 24x7 response unless included\nThird-party costs\nMajor implementation projects that exceed the retainer scope",
      paymentTerms: "Due at the beginning of each monthly service period",
      specialTerms: "Work exceeding the agreed monthly allocation requires written approval and may be billed separately at the applicable consulting rate.",
    },
  },
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

  const [templateKey, setTemplateKey] = useState("consulting");
  const [contractClientId, setContractClientId] = useState("");
  const [contractTitle, setContractTitle] = useState(contractTemplates.consulting.title);
  const [serviceType, setServiceType] = useState(contractTemplates.consulting.serviceType);
  const [billingModel, setBillingModel] = useState<ConsultingBillingModel>(contractTemplates.consulting.billingModel);
  const [rate, setRate] = useState(contractTemplates.consulting.rate);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scope, setScope] = useState(contractTemplates.consulting.scope);
  const [projectSummary, setProjectSummary] = useState(contractTemplates.consulting.data.projectSummary);
  const [deliverables, setDeliverables] = useState(contractTemplates.consulting.data.deliverables);
  const [clientResponsibilities, setClientResponsibilities] = useState(contractTemplates.consulting.data.clientResponsibilities);
  const [assumptions, setAssumptions] = useState(contractTemplates.consulting.data.assumptions);
  const [exclusions, setExclusions] = useState(contractTemplates.consulting.data.exclusions);
  const [paymentTerms, setPaymentTerms] = useState(contractTemplates.consulting.data.paymentTerms);
  const [specialTerms, setSpecialTerms] = useState(contractTemplates.consulting.data.specialTerms);

  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceContractId, setInvoiceContractId] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("Consulting services");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [dueDays, setDueDays] = useState("30");

  const clientNames = useMemo(
    () => new Map(data.clients.map(client => [client.id, client.companyName])),
    [data.clients],
  );

  const clientsById = useMemo(
    () => new Map(data.clients.map(client => [client.id, client])),
    [data.clients],
  );

  const previewContract = data.contracts.find(contract => contract.id === previewContractId) ?? null;
  const previewClient = previewContract ? clientsById.get(previewContract.clientId) ?? null : null;

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

  function applyTemplate(nextKey: string) {
    const template = contractTemplates[nextKey] ?? contractTemplates.consulting;
    setTemplateKey(nextKey);
    setContractTitle(template.title);
    setServiceType(template.serviceType);
    setBillingModel(template.billingModel);
    setRate(template.rate);
    setScope(template.scope);
    setProjectSummary(template.data.projectSummary);
    setDeliverables(template.data.deliverables);
    setClientResponsibilities(template.data.clientResponsibilities);
    setAssumptions(template.data.assumptions);
    setExclusions(template.data.exclusions);
    setPaymentTerms(template.data.paymentTerms);
    setSpecialTerms(template.data.specialTerms);
  }

  async function addClient() {
    if (!companyName.trim()) return;
    await run(async () => {
      const result = await createConsultingClient({ companyName, contactName, email, phone, billingAddress });
      setContractClientId(result.id);
      setInvoiceClientId(result.id);
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setBillingAddress("");
    }, "Client created.");
  }

  async function addContract() {
    const dollars = Number(rate);
    const contractData: ConsultingContractData = {
      projectSummary,
      deliverables,
      clientResponsibilities,
      assumptions,
      exclusions,
      paymentTerms,
      specialTerms,
    };

    await run(async () => {
      const result = await createConsultingContract({
        clientId: contractClientId,
        title: contractTitle,
        serviceType,
        templateKey,
        billingModel,
        rateCents: Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : null,
        startDate,
        endDate,
        scope,
        contractData,
      });
      setPreviewContractId(result.id);
    }, "Contract draft created.");
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
          <span>Clients, branded contracts, engagements, and Stripe invoices.</span>
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

        <section className="consulting-card consulting-contract-builder">
          <div className="consulting-card-title"><FileSignature size={15} /> Contract builder <span className="consulting-new-badge"><Sparkles size={11} /> Branded document</span></div>

          <div className="contract-builder-grid">
            <div>
              <label>Template</label>
              <select value={templateKey} onChange={e => applyTemplate(e.target.value)}>
                {Object.entries(contractTemplates).map(([key, template]) => <option key={key} value={key}>{template.label}</option>)}
              </select>
            </div>
            <div>
              <label>Client</label>
              <select value={contractClientId} onChange={e => setContractClientId(e.target.value)}>
                <option value="">Select a client</option>
                {data.clients.map(client => <option key={client.id} value={client.id}>{client.companyName}</option>)}
              </select>
            </div>
            <div className="contract-builder-span-2">
              <label>Agreement title</label><input value={contractTitle} onChange={e => setContractTitle(e.target.value)} />
            </div>
            <div><label>Service</label><input value={serviceType} onChange={e => setServiceType(e.target.value)} /></div>
            <div><label>Billing</label><select value={billingModel} onChange={e => setBillingModel(e.target.value as ConsultingBillingModel)}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="fixed">Fixed</option><option value="retainer">Retainer</option></select></div>
            <div><label>Rate / amount ($)</label><input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" /></div>
            <div><label>Payment terms</label><input value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Net 15" /></div>
            <div><label>Start date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><label>End date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>

          <div className="contract-builder-section-title">Project definition</div>
          <label>Project summary</label><textarea value={projectSummary} onChange={e => setProjectSummary(e.target.value)} rows={3} />
          <label>Scope of work</label><textarea value={scope} onChange={e => setScope(e.target.value)} rows={4} placeholder="Describe the work included in this agreement." />

          <div className="contract-builder-text-grid">
            <div><label>Deliverables <span>one per line</span></label><textarea value={deliverables} onChange={e => setDeliverables(e.target.value)} rows={6} /></div>
            <div><label>Client responsibilities <span>one per line</span></label><textarea value={clientResponsibilities} onChange={e => setClientResponsibilities(e.target.value)} rows={6} /></div>
            <div><label>Assumptions <span>one per line</span></label><textarea value={assumptions} onChange={e => setAssumptions(e.target.value)} rows={5} /></div>
            <div><label>Exclusions <span>one per line</span></label><textarea value={exclusions} onChange={e => setExclusions(e.target.value)} rows={5} /></div>
          </div>

          <label>Special terms</label><textarea value={specialTerms} onChange={e => setSpecialTerms(e.target.value)} rows={3} />

          <div className="contract-builder-footer">
            <div className="consulting-footnote">Template content is a starting point. Review scope, commercial terms, and legal language before execution.</div>
            <button className="consulting-primary" onClick={() => void addContract()} disabled={working || !contractClientId || !contractTitle.trim()}>Create Branded Contract Draft</button>
          </div>
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
            <td className="consulting-actions"><button onClick={() => setPreviewContractId(contract.id)}><Eye size={12} /> View document</button><select className="consulting-status-select" value={contract.status} onChange={e => void run(() => setContractStatus({ contractId: contract.id, status: e.target.value as typeof contract.status }), "Contract status updated.")} disabled={working}><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
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
              {invoice.stripeInvoiceUrl && <a href={invoice.stripeInvoiceUrl} target="_blank" rel="noreferrer">Open payment page</a>}
              {invoice.status === "draft" && <button onClick={() => void run(() => sendStripeInvoice(invoice.id), "Invoice sent through Stripe.")} disabled={working}><Send size={12} /> Send</button>}
            </td>
          </tr>)}
          {!loading && data.invoices.length === 0 && <tr><td colSpan={5} className="consulting-empty">No invoices yet.</td></tr>}
        </tbody></table></div>
      </section>

      {previewContract && (
        <div className="consulting-modal-backdrop" onMouseDown={() => setPreviewContractId("")}>
          <div className="consulting-contract-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="consulting-modal-toolbar">
              <div>
                <strong>{previewContract.title}</strong>
                <span>{clientNames.get(previewContract.clientId) ?? "Client"} · branded contract preview</span>
              </div>
              <div className="consulting-modal-toolbar-actions">
                <button onClick={() => void navigator.clipboard.writeText(previewContract.contractText || "")}><Copy size={12} /> Copy text</button>
                <button onClick={() => window.print()}><Printer size={12} /> Print / Save PDF</button>
                <button onClick={() => setPreviewContractId("")}><X size={13} /> Close</button>
              </div>
            </div>
            <div className="consulting-contract-scroll">
              <ContractDocument contract={previewContract} client={previewClient} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
