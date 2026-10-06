import { supabase } from "../lib/supabase";
import type {
  BusinessInstance,
  BusinessLaunchRequest,
  LaunchResponse,
} from "../types/businessLaunch";
import { apiError, readJson } from "./apiResponse";

async function adminHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Sign in to Platform.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function listBusinessInstances(): Promise<BusinessInstance[]> {
  const response = await fetch("/api/admin/business-launch", {
    headers: await adminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await apiError(response, "/api/admin/business-launch"));
  }

  const body = await readJson<{ instances: BusinessInstance[] }>(response, "/api/admin/business-launch");
  return body.instances ?? [];
}

export async function launchBusiness(
  request: BusinessLaunchRequest,
): Promise<LaunchResponse> {
  const response = await fetch("/api/admin/business-launch", {
    method: "POST",
    headers: await adminHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await apiError(response, "/api/admin/business-launch"));
  }

  return await readJson<LaunchResponse>(response, "/api/admin/business-launch");
}
