import { supabase } from "../lib/supabase";
import type {
  ConsultingBillingModel,
  ConsultingContractData,
  ConsultingContractStatus,
  ConsultingSnapshot,
} from "../types/consulting";

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Sign in to Platform.");
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error || `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export async function getConsultingSnapshot(): Promise<ConsultingSnapshot> {
  const response = await fetch("/api/admin/consulting", { headers: await authHeaders() });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as ConsultingSnapshot;
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/admin/consulting", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as T;
}

export function createConsultingClient(input: {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  notes?: string;
}) {
  return post<{ id: string }>({ action: "client-create", ...input });
}

export function createConsultingContract(input: {
  clientId: string;
  title: string;
  serviceType: string;
  templateKey: string;
  billingModel: ConsultingBillingModel;
  rateCents: number | null;
  startDate?: string;
  endDate?: string;
  scope: string;
  contractData: ConsultingContractData;
}) {
  return post<{ id: string }>({ action: "contract-create", ...input });
}

export function setContractStatus(input: {
  contractId: string;
  status: ConsultingContractStatus;
  acceptedBy?: string;
}) {
  return post<{ updated: true }>({ action: "contract-status", ...input });
}

export function createStripeInvoice(input: {
  clientId: string;
  contractId?: string;
  description: string;
  amountCents: number;
  dueDays: number;
}) {
  return post<{ id: string; stripeInvoiceId: string; url: string | null }>({ action: "invoice-create", ...input });
}

export function sendStripeInvoice(invoiceId: string) {
  return post<{ sent: true; url: string | null }>({ action: "invoice-send", invoiceId });
}
