import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Eye,
  FileSignature,
  Layers3,
  Printer,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import {
  createConsultingContract,
  setContractStatus,
} from "../../services/consulting";
import type {
  ConsultingBillingModel,
  ConsultingContractData,
} from "../../types/consulting";
import ContractDocument from "./ContractDocument";
import { contractTemplates } from "./contractTemplates";
import { useConsultingOperations } from "./useConsultingOperations";
import "./Consulting.css";

function money(cents: number | null) {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function printContractDocument() {
  const source = document.querySelector<HTMLElement>("[data-print-contract]");
  if (!source) return;

  const printCopy = source.cloneNode(true) as HTMLElement;
  printCopy.removeAttribute("data-print-contract");
  printCopy.setAttribute("data-print-contract-copy", "true");

  document.body.appendChild(printCopy);
  document.body.classList.add("contract-print-mode");

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    document.body.classList.remove("contract-print-mode");
    printCopy.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  window.requestAnimationFrame(() => {
    window.print();
    cleanup();
  });
}

export default function ContractBuilder() {
  const {
    data,
    loading,
    working,
    error,
    message,
    load,
    run,
  } = useConsultingOperations();

  const [previewContractId, setPreviewContractId] = useState("");
  const [templateKey, setTemplateKey] = useState("consulting");
  const [clientId, setClientId] = useState("");
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

  useEffect(() => {
    if (!clientId && data.clients[0]?.id) {
      setClientId(data.clients[0].id);
    }
  }, [clientId, data.clients]);

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
  const activeTemplate = contractTemplates[templateKey] ?? contractTemplates.consulting;

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
        clientId,
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

  return (
    <div className="consulting-admin consulting-page page">
      <div className="consulting-page-heading">
        <div className="consulting-heading-group">
          <div className="consulting-heading-icon"><FileSignature size={18} /></div>
          <div>
            <div className="consulting-eyebrow">Consulting / Contract Builder</div>
            <h1>Contract Builder</h1>
            <p>Start with a OneTime Labs agreement template, customize the engagement, then render a branded contract.</p>
          </div>
        </div>
        <button className="consulting-secondary" onClick={() => void load()} disabled={loading || working}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="consulting-alert error">{error}</div>}
      {message && <div className="consulting-alert success">{message}</div>}

      <section className="consulting-template-card">
        <div className="consulting-template-mark"><Sparkles size={19} /></div>
        <div className="consulting-template-copy">
          <span>Starting template</span>
          <strong>{activeTemplate.label}</strong>
          <p>{activeTemplate.description}</p>
        </div>
        <div className="consulting-template-select consulting-select-wrap">
          <select value={templateKey} onChange={event => applyTemplate(event.target.value)}>
            {Object.entries(contractTemplates).map(([key, template]) => (
              <option key={key} value={key}>{template.label}</option>
            ))}
          </select>
          <ChevronDown size={16} />
        </div>
      </section>

      <section className="consulting-workspace-card contract-builder-workspace">
        <div className="consulting-workspace-header">
          <div>
            <div className="consulting-section-icon"><Layers3 size={16} /></div>
            <div>
              <h2>Agreement Details</h2>
              <p>Build the contract in sections so the finished document reads like a real professional agreement.</p>
            </div>
          </div>
          <span className="consulting-step-badge">Draft contract</span>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title numbered"><b>01</b><div><strong>Agreement setup</strong><span>Choose the client and identify the agreement.</span></div></div>
          <div className="consulting-field-grid two">
            <div className="consulting-field">
              <label>Client</label>
              <div className="consulting-select-wrap">
                <select value={clientId} onChange={event => setClientId(event.target.value)}>
                  <option value="">Select a client</option>
                  {data.clients.map(client => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
            <div className="consulting-field">
              <label>Service type</label>
              <input value={serviceType} onChange={event => setServiceType(event.target.value)} />
            </div>
            <div className="consulting-field consulting-span-2">
              <label>Agreement title</label>
              <input value={contractTitle} onChange={event => setContractTitle(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title numbered"><b>02</b><div><strong>Commercial terms</strong><span>Billing model, contract value, payment terms, and term dates.</span></div></div>
          <div className="consulting-field-grid four">
            <div className="consulting-field">
              <label>Billing model</label>
              <div className="consulting-select-wrap">
                <select value={billingModel} onChange={event => setBillingModel(event.target.value as ConsultingBillingModel)}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="fixed">Fixed</option>
                  <option value="retainer">Retainer</option>
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
            <div className="consulting-field">
              <label>Rate / amount (USD)</label>
              <div className="consulting-money-input"><span>$</span><input value={rate} onChange={event => setRate(event.target.value)} inputMode="decimal" /></div>
            </div>
            <div className="consulting-field consulting-span-2">
              <label>Payment terms</label>
              <input value={paymentTerms} onChange={event => setPaymentTerms(event.target.value)} placeholder="Net 15" />
            </div>
            <div className="consulting-field">
              <label><CalendarDays size={13} /> Start date</label>
              <input type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
            </div>
            <div className="consulting-field">
              <label><CalendarDays size={13} /> End date</label>
              <input type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title numbered"><b>03</b><div><strong>Project definition</strong><span>Describe why the engagement exists and exactly what work is included.</span></div></div>
          <div className="consulting-field">
            <label>Project summary</label>
            <textarea value={projectSummary} onChange={event => setProjectSummary(event.target.value)} rows={4} />
          </div>
          <div className="consulting-field">
            <label>Scope of work</label>
            <textarea value={scope} onChange={event => setScope(event.target.value)} rows={5} />
          </div>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title numbered"><b>04</b><div><strong>Delivery &amp; responsibilities</strong><span>Use one line per item so the finished contract renders a clean list.</span></div></div>
          <div className="consulting-field-grid two">
            <div className="consulting-field"><label>Deliverables <span>one per line</span></label><textarea value={deliverables} onChange={event => setDeliverables(event.target.value)} rows={7} /></div>
            <div className="consulting-field"><label>Client responsibilities <span>one per line</span></label><textarea value={clientResponsibilities} onChange={event => setClientResponsibilities(event.target.value)} rows={7} /></div>
          </div>
        </div>

        <div className="consulting-form-section">
          <div className="consulting-form-section-title numbered"><b>05</b><div><strong>Guardrails &amp; special terms</strong><span>Document planning assumptions, explicit exclusions, and engagement-specific conditions.</span></div></div>
          <div className="consulting-field-grid two">
            <div className="consulting-field"><label>Assumptions <span>one per line</span></label><textarea value={assumptions} onChange={event => setAssumptions(event.target.value)} rows={6} /></div>
            <div className="consulting-field"><label>Exclusions <span>one per line</span></label><textarea value={exclusions} onChange={event => setExclusions(event.target.value)} rows={6} /></div>
            <div className="consulting-field consulting-span-2"><label>Special terms</label><textarea value={specialTerms} onChange={event => setSpecialTerms(event.target.value)} rows={4} /></div>
          </div>
        </div>

        <div className="consulting-form-actions">
          <div className="consulting-form-hint">Template language is a starting point. Review scope, commercial terms, and legal language before execution.</div>
          <button className="consulting-primary large" onClick={() => void addContract()} disabled={working || !clientId || !contractTitle.trim()}>
            <FileSignature size={15} /> Create Branded Contract Draft
          </button>
        </div>
      </section>

      <section className="consulting-wide-card consulting-record-card">
        <div className="consulting-table-header"><div><strong>Contract Register</strong><span>{data.contracts.length} records</span></div></div>
        <div className="consulting-table-wrap">
          <table className="consulting-table">
            <thead><tr><th>Client</th><th>Agreement</th><th>Billing</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {data.contracts.map(contract => (
                <tr key={contract.id}>
                  <td>{clientNames.get(contract.clientId) ?? "Unknown"}</td>
                  <td><strong>{contract.title}</strong><small>{contract.serviceType}</small></td>
                  <td>{contract.billingModel} · {money(contract.rateCents)}</td>
                  <td><span className={`consulting-status ${contract.status}`}>{contract.status}</span></td>
                  <td className="consulting-actions">
                    <button onClick={() => setPreviewContractId(contract.id)}><Eye size={12} /> View document</button>
                    <div className="consulting-status-select-wrap">
                      <select
                        className="consulting-status-select"
                        value={contract.status}
                        onChange={event => void run(
                          () => setContractStatus({ contractId: contract.id, status: event.target.value as typeof contract.status }),
                          "Contract status updated.",
                        )}
                        disabled={working}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown size={12} />
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && data.contracts.length === 0 && <tr><td colSpan={5} className="consulting-empty">No contracts yet.</td></tr>}
            </tbody>
          </table>
        </div>
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
                <button onClick={printContractDocument}><Printer size={12} /> Print / Save PDF</button>
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
