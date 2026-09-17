import {
  CalendarDays,
  CircleAlert,
  FileSignature,
  Landmark,
  ListChecks,
  ShieldCheck,
  Users,
} from "lucide-react";

import type {
  ConsultingClient,
  ConsultingContract,
} from "../../types/consulting";

type Props = {
  contract: ConsultingContract;
  client: ConsultingClient | null;
};

function money(cents: number | null) {
  if (cents === null) return "As agreed in writing";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function dateLabel(value: string | null) {
  if (!value) return "To be agreed";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function contractNumber(contract: ConsultingContract) {
  const year = new Date(contract.createdAt).getFullYear();
  return `OTL-${year}-${contract.id.slice(0, 8).toUpperCase()}`;
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map(line => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function DetailList({ value, fallback }: { value: string; fallback: string }) {
  const items = lines(value);
  if (items.length === 0) return <p>{fallback}</p>;
  return (
    <ul>
      {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </ul>
  );
}

export default function ContractDocument({ contract, client }: Props) {
  const contractData = {
    projectSummary: contract.contractData?.projectSummary ?? "",
    deliverables: contract.contractData?.deliverables ?? "",
    clientResponsibilities: contract.contractData?.clientResponsibilities ?? "",
    assumptions: contract.contractData?.assumptions ?? "",
    exclusions: contract.contractData?.exclusions ?? "",
    paymentTerms: contract.contractData?.paymentTerms ?? "",
    specialTerms: contract.contractData?.specialTerms ?? "",
  };

  const isLegacy = Object.values(contractData).every(value => !value);

  return (
    <article className="contract-document" data-print-contract>
      <header className="contract-document-header">
        <div className="contract-brand">
          <div className="contract-brand-mark">1TL</div>
          <div>
            <strong>OneTime Labs</strong>
            <span>Enterprise Technology &amp; Software Engineering</span>
          </div>
        </div>
        <div className="contract-number-block">
          <span>Agreement</span>
          <strong>{contractNumber(contract)}</strong>
          <em className={`contract-state ${contract.status}`}>{contract.status}</em>
        </div>
      </header>

      <section className="contract-hero">
        <div className="contract-eyebrow">{contract.serviceType}</div>
        <h1>{contract.title}</h1>
        <p>
          Professional services agreement between OneTime Labs and {client?.companyName ?? "the Client"}.
        </p>
      </section>

      <section className="contract-summary-grid">
        <div className="contract-summary-item">
          <Users size={16} />
          <span>Client</span>
          <strong>{client?.companyName ?? "Client"}</strong>
          {client?.contactName && <small>{client.contactName}</small>}
        </div>
        <div className="contract-summary-item">
          <CalendarDays size={16} />
          <span>Term</span>
          <strong>{dateLabel(contract.startDate)}</strong>
          <small>{contract.endDate ? `Through ${dateLabel(contract.endDate)}` : "End date by completion or written notice"}</small>
        </div>
        <div className="contract-summary-item">
          <Landmark size={16} />
          <span>Billing</span>
          <strong>{contract.billingModel.replace(/^./, value => value.toUpperCase())}</strong>
          <small>{money(contract.rateCents)}</small>
        </div>
        <div className="contract-summary-item">
          <FileSignature size={16} />
          <span>Payment terms</span>
          <strong>{contractData.paymentTerms || "Per invoice"}</strong>
          <small>USD unless otherwise stated</small>
        </div>
      </section>

      <section className="contract-section">
        <div className="contract-section-heading">
          <span>01</span>
          <div><strong>Project Summary</strong><small>Purpose and engagement context</small></div>
        </div>
        <div className="contract-section-body">
          <p>{contractData.projectSummary || `OneTime Labs will provide ${contract.serviceType} services for ${client?.companyName ?? "the Client"}.`}</p>
        </div>
      </section>

      <section className="contract-section">
        <div className="contract-section-heading">
          <span>02</span>
          <div><strong>Scope of Work</strong><small>Work included in this engagement</small></div>
        </div>
        <div className="contract-section-body">
          <p>{contract.scope || "Scope and deliverables will be documented and approved before work begins."}</p>
        </div>
      </section>

      <section className="contract-section contract-section-split">
        <div>
          <div className="contract-section-heading compact">
            <span>03</span>
            <div><strong>Deliverables</strong><small>Expected outputs</small></div>
          </div>
          <div className="contract-section-body">
            <DetailList value={contractData.deliverables} fallback="Deliverables will be defined and confirmed with the client before work begins." />
          </div>
        </div>
        <div>
          <div className="contract-section-heading compact">
            <span>04</span>
            <div><strong>Client Responsibilities</strong><small>Access and cooperation required</small></div>
          </div>
          <div className="contract-section-body">
            <DetailList value={contractData.clientResponsibilities} fallback="Provide timely access to personnel, systems, vendors, documentation, facilities, and approvals reasonably required to perform the work." />
          </div>
        </div>
      </section>

      <section className="contract-section">
        <div className="contract-section-heading">
          <span>05</span>
          <div><strong>Fees &amp; Payment</strong><small>Commercial terms</small></div>
        </div>
        <div className="contract-section-body">
          <div className="contract-fee-table">
            <div><span>Service</span><strong>{contract.serviceType}</strong></div>
            <div><span>Billing model</span><strong>{contract.billingModel}</strong></div>
            <div><span>Rate / engagement amount</span><strong>{money(contract.rateCents)}</strong></div>
            <div><span>Payment terms</span><strong>{contractData.paymentTerms || "As shown on each invoice"}</strong></div>
          </div>
          <p className="contract-muted">
            Approved third-party costs, travel, hardware, software licensing, and unusual-hours work may be billed separately when agreed in writing.
          </p>
        </div>
      </section>

      <div className="contract-callout">
        <CircleAlert size={18} />
        <div>
          <strong>Change Control</strong>
          <p>Material changes to scope, assumptions, schedule, or deliverables require written approval and may change fees or delivery dates.</p>
        </div>
      </div>

      <section className="contract-section contract-section-split">
        <div>
          <div className="contract-section-heading compact">
            <span>06</span>
            <div><strong>Assumptions</strong><small>Conditions used to plan the work</small></div>
          </div>
          <div className="contract-section-body">
            <DetailList value={contractData.assumptions} fallback="Work is based on information and access supplied by the client and may be adjusted if material conditions change." />
          </div>
        </div>
        <div>
          <div className="contract-section-heading compact">
            <span>07</span>
            <div><strong>Exclusions</strong><small>Work outside this agreement</small></div>
          </div>
          <div className="contract-section-body">
            <DetailList value={contractData.exclusions} fallback="Work not expressly included in the approved scope is outside this agreement unless added through written change control." />
          </div>
        </div>
      </section>

      <section className="contract-section">
        <div className="contract-section-heading">
          <span>08</span>
          <div><strong>Standard Terms</strong><small>Confidentiality, ownership, and termination</small></div>
        </div>
        <div className="contract-section-body contract-terms-grid">
          <div>
            <ShieldCheck size={15} />
            <strong>Confidentiality &amp; Data</strong>
            <p>Each party will use reasonable care with confidential information received during the engagement and will use it only for the work described in this agreement.</p>
          </div>
          <div>
            <ListChecks size={15} />
            <strong>Ownership</strong>
            <p>Pre-existing tools, reusable methods, frameworks, and OneTime Labs software remain with their respective owners. Client-specific deliverables and separately licensed software are governed by the applicable written terms.</p>
          </div>
          <div>
            <CircleAlert size={15} />
            <strong>Termination</strong>
            <p>Either party may end the engagement by written notice. The client remains responsible for work performed and approved costs incurred through the effective termination date.</p>
          </div>
          <div>
            <FileSignature size={15} />
            <strong>Entire Agreement</strong>
            <p>This agreement and its referenced statements of work describe the engagement and may be amended only in writing by both parties.</p>
          </div>
        </div>
      </section>

      {(contractData.specialTerms || isLegacy) && (
        <section className="contract-section">
          <div className="contract-section-heading">
            <span>09</span>
            <div><strong>{isLegacy ? "Legacy Agreement Text" : "Special Terms"}</strong><small>Engagement-specific conditions</small></div>
          </div>
          <div className="contract-section-body">
            {isLegacy
              ? <pre className="contract-legacy-text">{contract.contractText || "No additional terms are stored."}</pre>
              : <DetailList value={contractData.specialTerms} fallback="No additional special terms." />}
          </div>
        </section>
      )}

      <section className="contract-signatures">
        <div>
          <span>OneTime Labs</span>
          <div className="signature-line" />
          <strong>Ivan Kay</strong>
          <small>President / Architect</small>
          <em>Date: __________________</em>
        </div>
        <div>
          <span>{client?.companyName ?? "Client"}</span>
          <div className="signature-line" />
          <strong>{client?.contactName || "Authorized Representative"}</strong>
          <small>Authorized Representative</small>
          <em>Date: __________________</em>
        </div>
      </section>

      <footer className="contract-document-footer">
        <span>{contractNumber(contract)}</span>
        <span>OneTime Labs · onetimelabs.net</span>
        <span>Generated by OneTime Labs Platform</span>
      </footer>
    </article>
  );
}
