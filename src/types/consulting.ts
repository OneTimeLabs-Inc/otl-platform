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

export type ConsultingContract = {
  id: string;
  clientId: string;
  title: string;
  serviceType: string;
  status: "draft" | "sent" | "accepted" | "completed" | "cancelled";
  startDate: string | null;
  endDate: string | null;
  billingModel: "hourly" | "daily" | "fixed" | "retainer";
  rateCents: number | null;
  currency: string;
  scope: string | null;
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
