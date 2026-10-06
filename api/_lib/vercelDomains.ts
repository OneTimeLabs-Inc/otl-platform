type VercelConfig = {
  recommendedCNAME?: Array<{ rank?: number; value?: string }>;
  configuredBy?: string | null;
  misconfigured?: boolean;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function vercelFetch(path: string, init: RequestInit = {}) {
  const token = required("VERCEL_TOKEN");
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://api.vercel.com${path}${teamId ? `${separator}teamId=${encodeURIComponent(teamId)}` : ""}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? JSON.stringify((body as { error: unknown }).error)
        : text || response.statusText;
    throw new Error(`Vercel API failed (${response.status}): ${message}`);
  }

  return body;
}

export async function addDomainToOperationsProject(hostname: string): Promise<string> {
  const project = required("VERCEL_OPERATIONS_PROJECT");

  try {
    await vercelFetch(`/v10/projects/${encodeURIComponent(project)}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: hostname }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A retry after a partial launch should be idempotent enough for operators.
    if (!/already|not_modified/i.test(message)) throw error;
  }

  const config = await vercelFetch(
    `/v6/domains/${encodeURIComponent(hostname)}/config`,
  ) as VercelConfig;

  const recommendedRaw = config.recommendedCNAME as unknown;
  let recommended: string | undefined;

  if (typeof recommendedRaw === "string") {
    recommended = recommendedRaw.trim();
  } else if (Array.isArray(recommendedRaw)) {
    recommended = recommendedRaw
      .map(item => typeof item === "string" ? item : item?.value)
      .find(value => typeof value === "string" && value.trim())
      ?.trim();
  }

  return recommended || process.env.VERCEL_CNAME_FALLBACK?.trim() || "cname.vercel-dns.com";
}
