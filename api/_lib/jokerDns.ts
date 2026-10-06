type DmapiResult = {
  statusCode: string | null;
  statusText: string | null;
  authSid: string | null;
  body: string;
  raw: string;
};

type ZonePlan = {
  domain: string;
  label: string;
  fqdn: string;
  target: string;
  record: string;
  zoneBefore: string;
  zoneAfter: string;
  existingRecordCount: number;
  resultingRecordCount: number;
};

function parseDmapi(raw: string): DmapiResult {
  const normalized = raw.replace(/\r\n/g, "\n");
  const [headerBlock, ...bodyBlocks] = normalized.split(/\n\s*\n/);
  const body = bodyBlocks.join("\n\n").trim();
  const headers = new Map<string, string>();

  for (const line of headerBlock.split("\n")) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    headers.set(
      line.slice(0, index).trim().toLowerCase(),
      line.slice(index + 1).trim(),
    );
  }

  return {
    statusCode: headers.get("status-code") ?? null,
    statusText: headers.get("status-text") ?? null,
    authSid: headers.get("auth-sid") ?? null,
    body,
    raw,
  };
}

async function requestDmapi(
  action: string,
  params: URLSearchParams,
): Promise<DmapiResult> {
  const url = `https://dmapi.joker.com/request/${action}?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "User-Agent": "OneTimeLabs-Platform/1.0" },
  });
  const raw = await response.text();
  const parsed = parseDmapi(raw);

  parsed.authSid = response.headers.get("auth-sid") ?? parsed.authSid;
  parsed.statusCode = response.headers.get("status-code") ?? parsed.statusCode;
  parsed.statusText = response.headers.get("status-text") ?? parsed.statusText;

  if (!response.ok || (parsed.statusCode && parsed.statusCode !== "0" && !/^1\d{3}$/.test(parsed.statusCode))) {
    throw new Error(
      `Joker ${action} failed: ${parsed.statusText || response.statusText || "Unknown error"}`,
    );
  }

  return parsed;
}

async function jokerLogin(): Promise<string> {
  const apiKey = process.env.JOKER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("JOKER_API_KEY is not configured.");
  }

  const result = await requestDmapi(
    "login",
    new URLSearchParams({ "api-key": apiKey }),
  );

  if (!result.authSid) {
    throw new Error("Joker login succeeded but returned no Auth-Sid.");
  }

  return result.authSid;
}

function recordLines(zone: string): string[] {
  return zone
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith(";"));
}

function canonicalRecord(line: string): string {
  return line.trim().replace(/\s+/g, " ").toLowerCase();
}

function recordCounts(zone: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of recordLines(zone)) {
    const key = canonicalRecord(line);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function assertOnlyExpectedRecordAdded(
  before: string,
  after: string,
  expectedRecord: string,
  stage: "pre-write" | "post-write",
): void {
  const beforeCounts = recordCounts(before);
  const afterCounts = recordCounts(after);
  const expectedKey = canonicalRecord(expectedRecord);

  const beforeTotal = [...beforeCounts.values()].reduce((sum, count) => sum + count, 0);
  const afterTotal = [...afterCounts.values()].reduce((sum, count) => sum + count, 0);

  for (const [key, count] of beforeCounts) {
    if ((afterCounts.get(key) ?? 0) < count) {
      throw new Error(
        `Joker DNS ${stage} safety check failed: an existing DNS record would be missing or changed. No further DNS changes will be attempted.`,
      );
    }
  }

  const expectedBefore = beforeCounts.get(expectedKey) ?? 0;
  const expectedAfter = afterCounts.get(expectedKey) ?? 0;

  if (expectedAfter !== expectedBefore + 1 || afterTotal !== beforeTotal + 1) {
    throw new Error(
      `Joker DNS ${stage} safety check failed: the zone must contain every existing record plus exactly one new CNAME.`,
    );
  }
}

async function readZone(authSid: string, domain: string): Promise<string> {
  const current = await requestDmapi(
    "dns-zone-get",
    new URLSearchParams({
      domain,
      "include-defaults": "1",
      "auth-sid": authSid,
    }),
  );

  if (!current.body.trim()) {
    throw new Error(`Joker returned an empty DNS zone for ${domain}. Refusing to write it.`);
  }

  return current.body;
}

export async function planJokerSubdomainCname(args: {
  label: string;
  target: string;
  ttl?: number;
}): Promise<ZonePlan> {
  const domain = (process.env.JOKER_DNS_DOMAIN || "onetimelabs.net").trim().toLowerCase();
  const label = args.label.trim().toLowerCase();

  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) {
    throw new Error("Invalid Joker DNS subdomain label.");
  }

  if (label === "www" || label === "mail") {
    throw new Error(`Refusing to automate reserved hostname ${label}.${domain}.`);
  }

  const normalizedTarget = args.target.trim().replace(/\.$/, "").toLowerCase();
  if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(normalizedTarget)) {
    throw new Error("Invalid CNAME target returned for Joker DNS.");
  }

  const authSid = await jokerLogin();
  const zoneBefore = await readZone(authSid, domain);
  const existingLines = recordLines(zoneBefore);

  const duplicate = existingLines.some(line => {
    const [existingLabel] = line.split(/\s+/);
    return existingLabel?.toLowerCase() === label;
  });

  if (duplicate) {
    throw new Error(`Joker DNS already contains a record for ${label}.${domain}. Refusing to modify it.`);
  }

  const target = `${normalizedTarget}.`;
  const ttl = Math.max(60, args.ttl ?? 300);
  const record = `${label} CNAME 0 ${target} ${ttl}`;
  const trimmedBefore = zoneBefore.replace(/[\r\n]+$/, "");
  const zoneAfter = `${trimmedBefore}\n${record}`;

  assertOnlyExpectedRecordAdded(zoneBefore, zoneAfter, record, "pre-write");

  return {
    domain,
    label,
    fqdn: `${label}.${domain}`,
    target,
    record,
    zoneBefore,
    zoneAfter,
    existingRecordCount: recordLines(zoneBefore).length,
    resultingRecordCount: recordLines(zoneAfter).length,
  };
}

export async function createJokerSubdomainCname(args: {
  label: string;
  target: string;
  ttl?: number;
}): Promise<{ record: string; zoneBefore: string; zoneAfter: string; verifiedZone: string }> {
  const plan = await planJokerSubdomainCname(args);
  const authSid = await jokerLogin();

  // Joker documents dns-zone-put as a full-zone replacement. Never write a
  // transformed/rebuilt zone: send the exact zone returned by dns-zone-get,
  // with exactly one validated CNAME appended.
  const putParams = new URLSearchParams({
    domain: plan.domain,
    zone: plan.zoneAfter,
    "auth-sid": authSid,
  });

  // Refuse a large URL-encoded full-zone write rather than risk truncation.
  if (putParams.toString().length > 14000) {
    throw new Error(
      "Joker DNS zone is too large for the guarded DMAPI request. No DNS changes were made.",
    );
  }

  const put = await requestDmapi("dns-zone-put", putParams);
  if (put.statusCode && put.statusCode !== "0" && !/^1\d{3}$/.test(put.statusCode)) {
    throw new Error(`Unable to update Joker DNS zone: ${put.statusText ?? "Unknown error"}`);
  }

  // Immediately re-read the authoritative Joker zone. The operation is only
  // considered successful if every original record still exists and exactly
  // one new record -- the requested CNAME -- was added.
  const verifiedZone = await readZone(authSid, plan.domain);
  assertOnlyExpectedRecordAdded(plan.zoneBefore, verifiedZone, plan.record, "post-write");

  return {
    record: plan.record,
    zoneBefore: plan.zoneBefore,
    zoneAfter: plan.zoneAfter,
    verifiedZone,
  };
}
