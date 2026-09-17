export type ConsultingClient = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  stripeCustomerId: string | null;
  active: boolean;
  createdAt: string;
};

export type ConsultingBillingModel = "hourly" | "daily" | "fixed" | "retainer";

export type ConsultingContractStatus = "draft" | "sent" | "accepted" | "completed" | "cancelled";

export type ConsultingContractData = {
  projectSummary: string;
  deliverables: string;
  clientResponsibilities: string;
  assumptions: string;
  exclusions: string;
  paymentTerms: string;
  specialTerms: string;
};

export type ConsultingContract = {
  id: string;
  clientId: string;
  title: string;
  serviceType: string;
  templateKey: string;
  status: ConsultingContractStatus;
  startDate: string | null;
  endDate: string | null;
  billingModel: ConsultingBillingModel;
  rateCents: number | null;
  currency: string;
  scope: string | null;
  contractData: ConsultingContractData;
  contractText: string | null;
  acceptedAt: string | null;
  acceptedBy: string | null;
  createdAt: string;
};

export type ConsultingInvoice = {
  id: string;
  clientId: string;
  contractId: string | null;
  stripeInvoiceId: string | null;
  stripeInvoiceUrl: string | null;
  status: string;
  description: string;
  amountCents: number;
  currency: string;
  dueDays: number;
  createdAt: string;
  sentAt: string | null;
};

export type ConsultingSnapshot = {
  clients: ConsultingClient[];
  contracts: ConsultingContract[];
  invoices: ConsultingInvoice[];
  stripeConfigured: boolean;
};
